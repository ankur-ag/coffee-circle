"use server";

import { getDb } from "@/lib/db";
import { bookings, users, feedback, meetups, coffeeShops } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { isBookingActive, isMeetupInFuture, isMeetupFull } from "@/lib/data";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { auth, signIn, signOut } from "@/auth";

export async function bookMeetup(formData: FormData) {
    const session = await auth();
    console.log("Booking Session:", JSON.stringify(session, null, 2));

    if (!session?.user?.id) {
        const error = new Error("Please sign in to book a meetup.");
        (error as any).userFriendly = true;
        throw error;
    }

    const meetupId = formData.get("meetupId") as string;
    const hasPlusOne = formData.get("hasPlusOne") === "true";
    const userId = session.user.id;

    if (!meetupId) {
        const error = new Error("Please select an event date to continue.");
        (error as any).userFriendly = true;
        throw error;
    }

    // Use default vibe since it's no longer selected by users
    const vibe = "social";

    console.log("Booking meetup:", { meetupId, vibe, userId });

    const db = getDb();

    try {
        // Check if user already has ANY active (upcoming) booking
        // Get all confirmed bookings for the user (Edge Runtime compatible)
        let allConfirmedBookings: any[] = [];
        try {
            allConfirmedBookings = await db
                .select()
                .from(bookings)
                .where(and(
                    eq(bookings.userId, userId),
                    eq(bookings.status, "confirmed")
                )) as any[];
        } catch (dbError) {
            console.error("Database error fetching bookings:", dbError);
            throw new Error("Unable to check your existing reservations. Please try again.");
        }

        // Get meetups for these bookings to check if they're active
        const bookingsWithMeetups = await Promise.all(
            allConfirmedBookings.map(async (booking: any) => {
                try {
                    const meetup = await db
                        .select()
                        .from(meetups)
                        .where(eq(meetups.id, booking.meetupId))
                        .limit(1) as any[];
                    
                    if (meetup.length > 0) {
                        // Get location if it exists
                        let location = null;
                        if (meetup[0].locationId) {
                            try {
                                const locationData = await db
                                    .select()
                                    .from(coffeeShops)
                                    .where(eq(coffeeShops.id, meetup[0].locationId))
                                    .limit(1) as any[];
                                location = locationData.length > 0 ? locationData[0] : null;
                            } catch (locationError) {
                                // Location fetch failed, but continue without it
                                console.warn("Failed to fetch location:", locationError);
                            }
                        }
                        
                        return {
                            ...booking,
                            meetup: {
                                ...meetup[0],
                                location,
                            },
                        };
                    }
                    return { ...booking, meetup: null };
                } catch (meetupError) {
                    console.error("Error fetching meetup:", meetupError);
                    return { ...booking, meetup: null };
                }
            })
        );

        // Find the first active (upcoming) booking
        const existingActiveBooking = bookingsWithMeetups.find((booking: any) => isBookingActive(booking));

        if (existingActiveBooking) {
            console.log("User already has an active booking");
            // Return user-friendly error message
            const errorMessage = `You already have an active reservation for ${existingActiveBooking.meetup?.date} at ${existingActiveBooking.meetup?.time}. Please cancel it first if you'd like to book a different meetup.`;
            // Create a custom error that won't be wrapped
            const error = new Error(errorMessage);
            (error as any).userFriendly = true;
            throw error;
        }

        // Verify the meetup exists and is in the future (Edge Runtime compatible)
        let meetupResult: any[] = [];
        try {
            meetupResult = await db
                .select()
                .from(meetups)
                .where(eq(meetups.id, meetupId))
                .limit(1) as any[];
        } catch (dbError) {
            console.error("Database error fetching meetup:", dbError);
            throw new Error("Unable to verify the event. Please try again.");
        }
        
        if (meetupResult.length === 0) {
            const error = new Error("This event is no longer available. Please select another event.");
            (error as any).userFriendly = true;
            throw error;
        }
        
        const meetupData = meetupResult[0];
        
        // Get location if it exists
        let location = null;
        if (meetupData.locationId) {
            try {
                const locationResult = await db
                    .select()
                    .from(coffeeShops)
                    .where(eq(coffeeShops.id, meetupData.locationId))
                    .limit(1) as any[];
                location = locationResult.length > 0 ? locationResult[0] : null;
            } catch (locationError) {
                // Location fetch failed, but continue without it
                console.warn("Failed to fetch location:", locationError);
            }
        }
        
        const meetup = {
            ...meetupData,
            location,
        } as any;

        if (!isMeetupInFuture(meetup)) {
            const error = new Error("Cannot book a past event. Please select an upcoming event.");
            (error as any).userFriendly = true;
            throw error;
        }

        // Check if event is full (6 attendees limit for non-admins, including +1 if applicable)
        const isFull = await isMeetupFull(meetupId, hasPlusOne);
        const isAdmin = session.user.role === "admin";

        if (isFull && !isAdmin) {
            const plusOneText = hasPlusOne ? " (including your +1)" : "";
            const error = new Error(`This event is full${plusOneText}. Maximum capacity is 6 attendees. Please select another event.`);
            (error as any).userFriendly = true;
            throw error;
        }

        console.log("Attempting insert...");
        const bookingId = crypto.randomUUID();
        try {
            await db.insert(bookings).values({
                id: bookingId,
                userId,
                meetupId,
                vibe,
                status: "confirmed",
                hasPlusOne: hasPlusOne ? "true" : "false",
            });
            console.log("Insert successful");
        } catch (insertError) {
            console.error("Database error inserting booking:", insertError);
            throw new Error("Unable to complete your booking. Please try again.");
        }

        // Send confirmation email (non-blocking)
        try {

            if (meetup && session.user?.email && session.user?.name) {
                const { sendBookingConfirmation } = await import("@/lib/email");
                await sendBookingConfirmation({
                    to: session.user.email,
                    userName: session.user.name,
                    eventDate: meetup.date,
                    eventTime: meetup.time,
                    locationName: meetup.location?.name || "TBD",
                    locationAddress: meetup.location?.location || "TBD",
                    locationCity: meetup.location?.city || "TBD",
                });
            }
        } catch (emailError) {
            // Log but don't fail the booking
            console.error("Failed to send booking confirmation email:", emailError);
        }

        revalidatePath("/dashboard");
        revalidatePath("/book");
        
        return { success: true, bookingId };
    } catch (error) {
        console.error("Failed to book meetup (Detailed):", error);
        
        // If it's already a user-friendly error, re-throw it as-is
        if (error instanceof Error && (error as any).userFriendly) {
            throw error;
        }
        
        // For database errors or other technical errors, provide a user-friendly message
        if (error instanceof Error) {
            const errorMessage = error.message.toLowerCase();
            
            // Check for common database errors and provide user-friendly messages
            if (errorMessage.includes("connection") || errorMessage.includes("timeout") || errorMessage.includes("network")) {
                throw new Error("Unable to connect to the server. Please check your internet connection and try again.");
            } else if (errorMessage.includes("unauthorized") || errorMessage.includes("permission")) {
                throw new Error("You don't have permission to perform this action. Please sign in and try again.");
            } else if (errorMessage.includes("missing required fields") || errorMessage.includes("invalid")) {
                throw new Error("Please fill in all required fields and try again.");
            } else {
                // For other errors, use the original message if it's user-friendly, otherwise provide a generic message
                // Check if the error message looks user-friendly (doesn't contain technical terms)
                const isTechnicalError = errorMessage.includes("failed query") || 
                                        errorMessage.includes("sql") || 
                                        errorMessage.includes("database") ||
                                        errorMessage.includes("postgres") ||
                                        errorMessage.includes("error code");
                
                if (isTechnicalError) {
                    throw new Error("Something went wrong while processing your booking. Please try again or contact support if the problem persists.");
                } else {
                    // Use the original error message if it's already user-friendly
                    throw error;
                }
            }
        }
        
        // Fallback for unknown errors
        throw new Error("Something went wrong. Please try again.");
    }
}

export async function login() {
    console.log("Starting login action...");
    await signIn("google");
}

export async function logout() {
    await signOut();
}

export async function testDatabase() {
    console.log("Testing DB connection...");
    const db = getDb();
    try {
        await db.insert(users).values({
            id: `test-${Date.now()}`,
            email: `test-${Date.now()}@example.com`,
            name: "Test User",
        });
        console.log("DB Write Successful");
    } catch (e) {
        console.error("DB Write Failed:", e);
        throw e;
    }
}

export async function cancelBooking(bookingId: string) {
    const session = await auth();
    console.log("Canceling booking:", bookingId);

    if (!session?.user?.id) {
        throw new Error("Unauthorized");
    }

    const db = getDb();

    try {
        // Get booking details before deletion for email (Edge Runtime compatible)
        const bookingResult = await db
            .select()
            .from(bookings)
            .where(eq(bookings.id, bookingId))
            .limit(1) as any[];

        if (bookingResult.length === 0 || bookingResult[0].userId !== session.user.id) {
            const error = new Error("This booking does not belong to you.");
            (error as any).userFriendly = true;
            throw error;
        }

        const booking = bookingResult[0];

        // Get meetup details
        let meetup = null;
        if (booking.meetupId) {
            const meetupResult = await db
                .select()
                .from(meetups)
                .where(eq(meetups.id, booking.meetupId))
                .limit(1) as any[];
            meetup = meetupResult.length > 0 ? meetupResult[0] : null;
        }

        // Get location if meetup has one
        let location = null;
        if (meetup?.locationId) {
            const locationResult = await db
                .select()
                .from(coffeeShops)
                .where(eq(coffeeShops.id, meetup.locationId))
                .limit(1) as any[];
            location = locationResult.length > 0 ? locationResult[0] : null;
        }

        // Combine booking with meetup and location
        const bookingWithDetails = {
            ...booking,
            meetup: meetup ? { ...meetup, location } : null,
        };

        // Delete the booking - only if it belongs to the current user
        // Note: When a booking with +1 is deleted, the headcount automatically decreases by 2
        // because the capacity counting only includes confirmed bookings
        await db.delete(bookings)
            .where(eq(bookings.id, bookingId));

        const hadPlusOne = booking.hasPlusOne === "true";
        console.log(`Booking canceled successfully${hadPlusOne ? " (with +1, reducing headcount by 2)" : ""}`);

        // Send cancellation email (non-blocking)
        if (session.user?.email && session.user?.name) {
            try {
                const { sendCancellationConfirmation } = await import("@/lib/email");
                await sendCancellationConfirmation({
                    to: session.user.email,
                    userName: session.user.name,
                    eventDate: bookingWithDetails.meetup?.date || "TBD",
                    eventTime: bookingWithDetails.meetup?.time || "TBD",
                    locationName: bookingWithDetails.meetup?.location?.name || "TBD",
                    locationCity: bookingWithDetails.meetup?.location?.city || "TBD",
                });
            } catch (emailError) {
                console.error("Failed to send cancellation email:", emailError);
            }
        }
    } catch (error) {
        console.error("Failed to cancel booking:", error);
        
        // If it's already a user-friendly error, re-throw it as-is
        if (error instanceof Error && (error as any).userFriendly) {
            throw error;
        }
        
        throw new Error(`Failed to cancel booking: ${error instanceof Error ? error.message : String(error)}`);
    }

    revalidatePath("/");
    revalidatePath("/dashboard");
    revalidatePath("/book"); // Revalidate to update capacity display
    redirect("/dashboard");
}

export async function updateUserProfile(formData: FormData) {
    const session = await auth();
    console.log("Updating user profile");

    if (!session?.user?.id) {
        const error = new Error("Please sign in to update your profile.");
        (error as any).userFriendly = true;
        throw error;
    }

    const languagePreference = formData.get("languagePreference") as string;
    const country = formData.get("country") as string;

    const db = getDb();

    try {
        // Build update object with only provided fields
        const updateData: { languagePreference?: string; country?: string | null } = {};

        if (languagePreference) {
            updateData.languagePreference = languagePreference;
        }

        if (country !== undefined && country !== null) {
            updateData.country = country.trim() || null; // Allow clearing the field
        }

        if (Object.keys(updateData).length === 0) {
            const error = new Error("No changes to save.");
            (error as any).userFriendly = true;
            throw error;
        }

        await db.update(users)
            .set(updateData)
            .where(eq(users.id, session.user.id));

        console.log("Profile updated successfully:", updateData);
        
        revalidatePath("/profile");
        revalidatePath("/dashboard");
        return { success: true };
    } catch (error) {
        console.error("Failed to update profile:", error);
        
        // If it's already a user-friendly error, re-throw it as-is
        if (error instanceof Error && (error as any).userFriendly) {
            throw error;
        }
        
        throw new Error(`Failed to update profile: ${error instanceof Error ? error.message : String(error)}`);
    }
}

export async function submitFeedback(formData: FormData) {
    const session = await auth();
    console.log("Submitting feedback");

    if (!session?.user?.id) {
        throw new Error("Unauthorized");
    }

    const bookingId = formData.get("bookingId") as string;
    const rating = parseInt(formData.get("rating") as string);
    const comment = formData.get("comment") as string;

    if (!bookingId || !rating || rating < 1 || rating > 5) {
        throw new Error("Missing required fields or invalid rating");
    }

    const db = getDb();

    try {
        // Verify the booking belongs to the user (Edge Runtime compatible)
        const bookingResult = await db
            .select()
            .from(bookings)
            .where(eq(bookings.id, bookingId))
            .limit(1) as any[];

        if (bookingResult.length === 0 || bookingResult[0].userId !== session.user.id) {
            const error = new Error("This booking does not belong to you.");
            (error as any).userFriendly = true;
            throw error;
        }

        // Check if feedback already exists (Edge Runtime compatible)
        const existingFeedbackResult = await db
            .select()
            .from(feedback)
            .where(eq(feedback.bookingId, bookingId))
            .limit(1) as any[];
        
        const existingFeedback = existingFeedbackResult.length > 0 ? existingFeedbackResult[0] : null;

        if (existingFeedback) {
            // Update existing feedback
            await db.update(feedback)
                .set({
                    rating,
                    comment: comment || null,
                })
                .where(eq(feedback.id, existingFeedback.id));
            console.log("Feedback updated successfully");
        } else {
            // Create new feedback
            await db.insert(feedback).values({
                id: crypto.randomUUID(),
                bookingId,
                userId: session.user.id,
                rating,
                comment: comment || null,
            });
            console.log("Feedback submitted successfully");
        }
    } catch (error) {
        console.error("Failed to submit feedback:", error);
        
        // If it's already a user-friendly error, re-throw it as-is
        if (error instanceof Error && (error as any).userFriendly) {
            throw error;
        }
        
        // For other errors, provide a user-friendly message
        throw new Error("Unable to submit your feedback. Please try again.");
    }

    revalidatePath("/past-events");
    revalidatePath(`/past-events/${bookingId}/feedback`);
    revalidatePath("/dashboard");
    
    return { success: true, bookingId };
}

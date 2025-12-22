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
        throw new Error("Unauthorized");
    }

    const meetupId = formData.get("meetupId") as string;
    const hasPlusOne = formData.get("hasPlusOne") === "true";
    const userId = session.user.id;

    if (!meetupId) {
        throw new Error("Missing required fields");
    }

    // Use default vibe since it's no longer selected by users
    const vibe = "social";

    console.log("Booking meetup:", { meetupId, vibe, userId });

    const db = getDb();

    try {
        // Check if user already has ANY active (upcoming) booking
        // Get all confirmed bookings for the user (Edge Runtime compatible)
        const allConfirmedBookings = await db
            .select()
            .from(bookings)
            .where(and(
                eq(bookings.userId, userId),
                eq(bookings.status, "confirmed")
            )) as any[];

        // Get meetups for these bookings to check if they're active
        const bookingsWithMeetups = await Promise.all(
            allConfirmedBookings.map(async (booking: any) => {
                const meetup = await db
                    .select()
                    .from(meetups)
                    .where(eq(meetups.id, booking.meetupId))
                    .limit(1) as any[];
                
                if (meetup.length > 0) {
                    // Get location if it exists
                    let location = null;
                    if (meetup[0].locationId) {
                        const locationData = await db
                            .select()
                            .from(coffeeShops)
                            .where(eq(coffeeShops.id, meetup[0].locationId))
                            .limit(1) as any[];
                        location = locationData.length > 0 ? locationData[0] : null;
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
            })
        );

        // Find the first active (upcoming) booking
        const existingActiveBooking = bookingsWithMeetups.find((booking: any) => isBookingActive(booking));

        if (existingActiveBooking) {
            console.log("User already has an active booking");
            // Return error message instead of silently redirecting
            throw new Error(
                `You already have an active reservation for ${existingActiveBooking.meetup?.date} at ${existingActiveBooking.meetup?.time}. Please cancel it first if you'd like to book a different meetup.`
            );
        }

        // Verify the meetup exists and is in the future (Edge Runtime compatible)
        const meetupResult = await db
            .select()
            .from(meetups)
            .where(eq(meetups.id, meetupId))
            .limit(1) as any[];
        
        if (meetupResult.length === 0) {
            throw new Error("Meetup not found");
        }
        
        const meetupData = meetupResult[0];
        
        // Get location if it exists
        let location = null;
        if (meetupData.locationId) {
            const locationResult = await db
                .select()
                .from(coffeeShops)
                .where(eq(coffeeShops.id, meetupData.locationId))
                .limit(1) as any[];
            location = locationResult.length > 0 ? locationResult[0] : null;
        }
        
        const meetup = {
            ...meetupData,
            location,
        } as any;

        if (!meetup) {
            throw new Error("Meetup not found");
        }

        if (!isMeetupInFuture(meetup)) {
            throw new Error("Cannot book a past event. Please select an upcoming event.");
        }

        // Check if event is full (6 attendees limit for non-admins, including +1 if applicable)
        const isFull = await isMeetupFull(meetupId, hasPlusOne);
        const isAdmin = session.user.role === "admin";

        if (isFull && !isAdmin) {
            const plusOneText = hasPlusOne ? " (including your +1)" : "";
            throw new Error(`This event is full${plusOneText}. Maximum capacity is 6 attendees. Please select another event.`);
        }

        console.log("Attempting insert...");
        const bookingId = crypto.randomUUID();
        await db.insert(bookings).values({
            id: bookingId,
            userId,
            meetupId,
            vibe,
            status: "confirmed",
            hasPlusOne: hasPlusOne ? "true" : "false",
        });
        console.log("Insert successful");

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
        throw new Error(`Failed to book meetup: ${error instanceof Error ? error.message : String(error)}`);
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
        // Get booking details before deletion for email
        const booking = await db.query.bookings.findFirst({
            where: (bookings, { eq }) => eq(bookings.id, bookingId),
            with: {
                meetup: {
                    with: {
                        location: true,
                    },
                },
            },
        });

        // Verify the booking exists and belongs to the user before deleting
        if (!booking || booking.userId !== session.user.id) {
            throw new Error("Unauthorized: This booking does not belong to you");
        }

        // Delete the booking - only if it belongs to the current user
        // Note: When a booking with +1 is deleted, the headcount automatically decreases by 2
        // because the capacity counting only includes confirmed bookings
        await db.delete(bookings)
            .where(eq(bookings.id, bookingId));

        const hadPlusOne = booking.hasPlusOne === "true";
        console.log(`Booking canceled successfully${hadPlusOne ? " (with +1, reducing headcount by 2)" : ""}`);

        // Send cancellation email (non-blocking)
        if (booking && session.user?.email && session.user?.name) {
            try {
                const { sendCancellationConfirmation } = await import("@/lib/email");
                await sendCancellationConfirmation({
                    to: session.user.email,
                    userName: session.user.name,
                    eventDate: booking.meetup?.date || "TBD",
                    eventTime: booking.meetup?.time || "TBD",
                    locationName: booking.meetup?.location?.name || "TBD",
                    locationCity: booking.meetup?.location?.city || "TBD",
                });
            } catch (emailError) {
                console.error("Failed to send cancellation email:", emailError);
            }
        }
    } catch (error) {
        console.error("Failed to cancel booking:", error);
        throw new Error(`Failed to cancel booking: ${error instanceof Error ? error.message : String(error)}`);
    }

    revalidatePath("/");
    revalidatePath("/dashboard");
    revalidatePath("/book"); // Revalidate to update capacity display
    redirect("/");
}

export async function updateUserProfile(formData: FormData) {
    const session = await auth();
    console.log("Updating user profile");

    if (!session?.user?.id) {
        throw new Error("Unauthorized");
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

        if (country !== undefined) {
            updateData.country = country || null; // Allow clearing the field
        }

        if (Object.keys(updateData).length === 0) {
            throw new Error("No fields to update");
        }

        await db.update(users)
            .set(updateData)
            .where(eq(users.id, session.user.id));

        console.log("Profile updated successfully");
    } catch (error) {
        console.error("Failed to update profile:", error);
        throw new Error(`Failed to update profile: ${error instanceof Error ? error.message : String(error)}`);
    }

    revalidatePath("/profile");
    redirect("/profile");
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
        // Verify the booking belongs to the user
        const booking = await db.query.bookings.findFirst({
            where: eq(bookings.id, bookingId),
        }) as any;

        if (!booking || booking.userId !== session.user.id) {
            throw new Error("Unauthorized: This booking does not belong to you");
        }

        // Check if feedback already exists
        const existingFeedback = await db.query.feedback.findFirst({
            where: eq(feedback.bookingId, bookingId),
        }) as any;

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
        throw new Error(`Failed to submit feedback: ${error instanceof Error ? error.message : String(error)}`);
    }

    revalidatePath("/past-events");
    revalidatePath(`/past-events/${bookingId}/feedback`);
    revalidatePath("/dashboard");
    
    return { success: true, bookingId };
}

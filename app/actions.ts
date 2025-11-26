"use server";

import { getDb } from "@/lib/db";
import { bookings, users } from "@/lib/schema";
import { eq } from "drizzle-orm";

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
    const vibe = formData.get("vibe") as string;
    const userId = session.user.id;

    if (!meetupId || !vibe) {
        throw new Error("Missing required fields");
    }

    console.log("Booking meetup:", { meetupId, vibe, userId });

    const db = getDb();

    try {
        // Check if user already has ANY active booking
        const existingActiveBooking = await db.query.bookings.findFirst({
            where: (bookings, { and, eq }) => and(
                eq(bookings.userId, userId),
                eq(bookings.status, "confirmed")
            ),
            with: {
                meetup: {
                    with: {
                        location: true,
                    },
                },
            },
        });

        if (existingActiveBooking) {
            console.log("User already has an active booking");
            // Return error message instead of silently redirecting
            throw new Error(
                `You already have an active reservation for ${existingActiveBooking.meetup?.date} at ${existingActiveBooking.meetup?.time}. Please cancel it first if you'd like to book a different meetup.`
            );
        }

        console.log("Attempting insert...");
        const bookingId = crypto.randomUUID();
        await db.insert(bookings).values({
            id: bookingId,
            userId,
            meetupId,
            vibe,
            status: "confirmed",
        });
        console.log("Insert successful");

        // Send confirmation email (non-blocking)
        try {
            const meetup = await db.query.meetups.findFirst({
                where: (meetups, { eq }) => eq(meetups.id, meetupId),
                with: {
                    location: true,
                },
            });

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
    } catch (error) {
        console.error("Failed to book meetup (Detailed):", error);
        throw new Error(`Failed to book meetup: ${error instanceof Error ? error.message : String(error)}`);
    }

    revalidatePath("/dashboard");
    redirect("/dashboard");
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

        // Delete the booking - only if it belongs to the current user
        await db.delete(bookings)
            .where(eq(bookings.id, bookingId));

        console.log("Booking canceled successfully");

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
    revalidatePath("/book");
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

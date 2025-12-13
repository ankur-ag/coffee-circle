import { getDb } from "@/lib/db";
import { bookings, meetups, coffeeShops, users, feedback } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";

/**
 * Check if a meetup is in the future (not past)
 * A meetup is in the future if the date is today or later
 */
export function isMeetupInFuture(meetup: any): boolean {
    if (!meetup?.date) return false;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const meetupDate = new Date(meetup.date);
    meetupDate.setHours(0, 0, 0, 0);
    
    return meetupDate >= today;
}

/**
 * Check if a booking is active (not past)
 * A booking is active if the meetup date is today or in the future
 */
export function isBookingActive(booking: any): boolean {
    if (!booking?.meetup?.date) return false;
    if (booking.status !== "confirmed") return false;
    
    return isMeetupInFuture(booking.meetup);
}

export async function getUserBooking(userId: string) {
    const db = getDb();

    // Get all bookings for the user, ordered by creation date
    const allBookings = await db.query.bookings.findMany({
        where: eq(bookings.userId, userId),
        orderBy: [desc(bookings.createdAt)],
        with: {
            meetup: {
                with: {
                    location: true,
                }
            }
        }
    }) as any[];

    // Find the first active (upcoming) booking
    const activeBooking = allBookings.find((booking: any) => isBookingActive(booking));

    if (!activeBooking) return null;

    // Get attendees for this meetup
    const attendees = await db.query.bookings.findMany({
        where: eq(bookings.meetupId, activeBooking.meetupId),
        with: {
            user: true
        }
    }) as any[];

    return {
        ...activeBooking,
        attendees: attendees.map((b: any) => b.user),
    };
}

export async function getUpcomingMeetups() {
    const db = getDb();

    // Get all open meetups
    const allMeetups = await db.query.meetups.findMany({
        where: eq(meetups.status, "open"),
    }) as any[];

    // Filter to only include future meetups
    const futureMeetups = allMeetups.filter((meetup: any) => isMeetupInFuture(meetup));

    // For each meetup, count attendees
    const meetupsWithAttendees = await Promise.all(
        futureMeetups.map(async (meetup: any) => {
            const attendeeCount = await db.query.bookings.findMany({
                where: eq(bookings.meetupId, meetup.id),
            });

            return {
                ...meetup,
                attendees: attendeeCount || [],
            };
        })
    );

    return meetupsWithAttendees;
}

export async function getPastBookings(userId: string) {
    const db = getDb();

    // Get all bookings for the user
    const allBookings = await db.query.bookings.findMany({
        where: eq(bookings.userId, userId),
        orderBy: [desc(bookings.createdAt)],
        with: {
            meetup: {
                with: {
                    location: true,
                }
            }
        }
    }) as any[];

    // Filter for past bookings - bookings that are NOT active (i.e., past today's date)
    const pastBookings = allBookings.filter((booking: any) => {
        if (!booking.meetup) return false;
        
        // Check if meetup status is "past"
        if (booking.meetup.status === "past") return true;
        
        // Check if the booking is not active (past date)
        return !isBookingActive(booking);
    });

    return pastBookings;
}

export async function getFeedbackForBooking(bookingId: string) {
    const db = getDb();
    try {
        const [existingFeedback] = await db
            .select()
            .from(feedback)
            .where(eq(feedback.bookingId, bookingId))
            .limit(1);

        return existingFeedback || null;
    } catch (error) {
        // Table might not exist yet if migration hasn't been run
        console.error("Error fetching feedback:", error);
        return null;
    }
}

export async function getBookingById(bookingId: string, userId: string) {
    const db = getDb();
    const booking = await db.query.bookings.findFirst({
        where: eq(bookings.id, bookingId),
        with: {
            meetup: {
                with: {
                    location: true,
                }
            }
        }
    }) as any;

    // Verify the booking belongs to the user
    if (!booking || booking.userId !== userId) {
        return null;
    }

    return booking;
}

/**
 * Find the first past booking that doesn't have feedback yet
 * Returns the booking ID if found, null otherwise
 */
export async function getUnratedPastBooking(userId: string): Promise<string | null> {
    const db = getDb();
    
    // Get all past bookings for the user
    const pastBookings = await getPastBookings(userId);
    
    if (pastBookings.length === 0) {
        return null;
    }
    
    // Check each past booking for feedback
    for (const booking of pastBookings) {
        const existingFeedback = await getFeedbackForBooking(booking.id);
        if (!existingFeedback) {
            // Found an unrated past booking
            return booking.id;
        }
    }
    
    return null;
}

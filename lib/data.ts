import { getDb } from "@/lib/db";
import { bookings, meetups, coffeeShops, users, feedback } from "@/lib/schema";
import { eq, desc, and } from "drizzle-orm";

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

    // Get all open meetups using standard select (Edge Runtime compatible)
    const allMeetups = await db
        .select()
        .from(meetups)
        .where(eq(meetups.status, "open")) as any[];

    // Filter to only include future meetups
    const futureMeetups = allMeetups.filter((meetup: any) => isMeetupInFuture(meetup));

    // Sort by date (ascending - earliest first) and take only the 2 most recent
    const sortedMeetups = futureMeetups.sort((a: any, b: any) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return dateA - dateB; // Sort ascending (earliest first)
    });

    const twoMostRecent = sortedMeetups.slice(0, 2);

    // For each meetup, count confirmed attendees (including +1s)
    const meetupsWithAttendees = await Promise.all(
        twoMostRecent.map(async (meetup: any) => {
            // Use standard select instead of query API for Edge Runtime compatibility
            const confirmedBookings = await db
                .select()
                .from(bookings)
                .where(and(
                    eq(bookings.meetupId, meetup.id),
                    eq(bookings.status, "confirmed")
                )) as any[];

            // Count total attendees: each booking counts as 1, +1 bookings count as 2
            // Note: Cancelled bookings are automatically excluded since we only query confirmed bookings
            // When a booking with +1 is cancelled, it reduces the headcount by 2 automatically
            const totalAttendees = confirmedBookings.reduce((count: number, booking: any) => {
                const hasPlusOne = booking.hasPlusOne === "true" || booking.hasPlusOne === true;
                return count + (hasPlusOne ? 2 : 1);
            }, 0);

            return {
                ...meetup,
                attendees: confirmedBookings || [],
                attendeeCount: totalAttendees,
                isFull: totalAttendees >= 6,
            };
        })
    );

    return meetupsWithAttendees;
}

/**
 * Check if a meetup is full (has 6 or more confirmed attendees, including +1s)
 */
export async function isMeetupFull(meetupId: string, includePlusOne: boolean = false): Promise<boolean> {
    const db = getDb();
    // Use standard select for Edge Runtime compatibility
    const confirmedBookings = await db
        .select()
        .from(bookings)
        .where(and(
            eq(bookings.meetupId, meetupId),
            eq(bookings.status, "confirmed")
        )) as any[];

    // Count total attendees: each booking counts as 1, +1 bookings count as 2
    // Note: Cancelled bookings are automatically excluded since we only query confirmed bookings
    // When a booking with +1 is cancelled, it reduces the headcount by 2 automatically
    const totalAttendees = confirmedBookings.reduce((count: number, booking: any) => {
        const hasPlusOne = booking.hasPlusOne === "true" || booking.hasPlusOne === true;
        return count + (hasPlusOne ? 2 : 1);
    }, 0);

    // If checking with a potential +1, add 1 more to the count
    const checkCount = includePlusOne ? totalAttendees + 1 : totalAttendees;
    
    return checkCount >= 6;
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

/**
 * Get all events happening tomorrow with their confirmed bookings and user details
 */
export async function getTomorrowEventsWithAttendees() {
    const db = getDb();

    // Calculate tomorrow's date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const tomorrowDateStr = tomorrow.toISOString().split("T")[0];

    // Get all meetups and filter for tomorrow's date
    // Note: We get all meetups and filter because date is stored as text
    const allMeetups = await db.query.meetups.findMany({
        with: {
            location: true,
        }
    }) as any[];

    // Filter for tomorrow's date
    const tomorrowMeetups = allMeetups.filter((meetup: any) => meetup.date === tomorrowDateStr);

    // For each meetup, get confirmed bookings with user details
    const meetupsWithBookings = await Promise.all(
        tomorrowMeetups.map(async (meetup: any) => {
            const confirmedBookings = await db.query.bookings.findMany({
                where: (bookings, { and, eq }) => and(
                    eq(bookings.meetupId, meetup.id),
                    eq(bookings.status, "confirmed")
                ),
                with: {
                    user: true,
                }
            }) as any[];

            return {
                ...meetup,
                bookings: confirmedBookings,
            };
        })
    );

    return meetupsWithBookings;
}

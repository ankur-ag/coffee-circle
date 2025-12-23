import { getDb } from "@/lib/db";
import { bookings, meetups, coffeeShops, users, feedback } from "@/lib/schema";
import { eq, desc, and, inArray } from "drizzle-orm";
import { REMINDER_EMAIL_DAYS } from "@/lib/config";

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
 * Check if a booking is active (not past and not for a cancelled event)
 * A booking is active if:
 * - The booking status is "confirmed"
 * - The meetup date is today or in the future
 * - The meetup is not cancelled
 */
export function isBookingActive(booking: any): boolean {
    if (!booking?.meetup?.date) return false;
    if (booking.status !== "confirmed") return false;
    if (booking.meetup?.status === "cancelled") return false;
    
    return isMeetupInFuture(booking.meetup);
}

/**
 * Check if user has an active booking (Edge Runtime compatible)
 * Returns true if user has any confirmed booking for a future meetup that is not cancelled
 */
export async function hasActiveBooking(userId: string): Promise<boolean> {
    const db = getDb();
    
    // Get all confirmed bookings for the user (Edge Runtime compatible)
    const confirmedBookings = await db
        .select()
        .from(bookings)
        .where(and(
            eq(bookings.userId, userId),
            eq(bookings.status, "confirmed")
        )) as any[];
    
    if (confirmedBookings.length === 0) {
        return false;
    }
    
    // Get meetups for these bookings to check if they're in the future and not cancelled
    const meetupIds = confirmedBookings.map((b: any) => b.meetupId);
    
    if (meetupIds.length === 0) {
        return false;
    }
    
    const meetupsResult = await db
        .select()
        .from(meetups)
        .where(inArray(meetups.id, meetupIds)) as any[];
    
    // Check if any booking is for a future meetup that is not cancelled
    for (const booking of confirmedBookings) {
        const meetup = meetupsResult.find((m: any) => m.id === booking.meetupId);
        // A booking is only active if:
        // 1. The meetup exists
        // 2. The meetup is in the future (by date)
        // 3. The meetup is not cancelled
        if (meetup && isMeetupInFuture(meetup) && meetup.status !== "cancelled") {
            return true;
        }
    }
    
    return false;
}

export async function getUserBooking(userId: string) {
    const db = getDb();

    // ULTRA-OPTIMIZATION: Fetch ALL data in a single parallel batch
    // With <20 records, fetching everything is faster than multiple filtered queries
    // This reduces from 3 query batches to 1 single batch (4 queries in parallel)
    const [confirmedBookings, allMeetups, allUsers, allLocations] = await Promise.all([
        // Get all confirmed bookings for the user
        db
            .select()
            .from(bookings)
            .where(and(
                eq(bookings.userId, userId),
                eq(bookings.status, "confirmed")
            )),
        // Pre-fetch ALL meetups (with only 20 records, this is faster than filtering)
        db
            .select()
            .from(meetups),
        // Pre-fetch ALL users (with <20 records, this is faster than filtering by IDs)
        db
            .select()
            .from(users),
        // Pre-fetch ALL locations (with <20 records, this is faster than individual queries)
        db
            .select()
            .from(coffeeShops),
    ]) as [any[], any[], any[], any[]];

    if (confirmedBookings.length === 0) {
        return null;
    }

    // Find the first active (upcoming) booking using pre-fetched meetups
    let activeBooking: any = null;
    let activeMeetup: any = null;

    for (const booking of confirmedBookings) {
        const meetup = allMeetups.find((m: any) => m.id === booking.meetupId);
        if (meetup && isBookingActive({ ...booking, meetup })) {
            activeBooking = booking;
            activeMeetup = meetup;
            break;
        }
    }

    if (!activeBooking || !activeMeetup) return null;

    // Get location from pre-fetched locations (in-memory, no DB query)
    const location = activeMeetup.locationId
        ? allLocations.find((l: any) => l.id === activeMeetup.locationId) || null
        : null;

    // Get attendee bookings from pre-fetched bookings (in-memory, no DB query)
    const attendeeBookings = confirmedBookings.filter(
        (b: any) => b.meetupId === activeBooking.meetupId
    );

    // Filter attendees from pre-fetched users (in-memory, no DB query)
    const attendeeUserIds = new Set(attendeeBookings.map((b: any) => b.userId));
    const attendees = allUsers.filter((u: any) => attendeeUserIds.has(u.id));

    return {
        ...activeBooking,
        meetup: {
            ...activeMeetup,
            location,
        },
        attendees,
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

            // Get capacity from meetup, default to 6 if not set
            const capacity = meetup.capacity ?? 6;

            return {
                ...meetup,
                attendees: confirmedBookings || [],
                attendeeCount: totalAttendees,
                capacity,
                isFull: totalAttendees >= capacity,
            };
        })
    );

    return meetupsWithAttendees;
}

/**
 * Check if a meetup is full (has reached capacity, including +1s)
 */
export async function isMeetupFull(meetupId: string, includePlusOne: boolean = false, capacity?: number): Promise<boolean> {
    const db = getDb();
    
    // Get meetup to retrieve capacity if not provided
    let meetupCapacity: number;
    if (capacity !== undefined) {
        meetupCapacity = capacity;
    } else {
        const meetupResult = await db
            .select()
            .from(meetups)
            .where(eq(meetups.id, meetupId))
            .limit(1) as any[];
        
        if (meetupResult.length > 0) {
            meetupCapacity = (meetupResult[0].capacity as number | undefined) ?? 6;
        } else {
            meetupCapacity = 6; // Default if meetup not found
        }
    }
    
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
    
    return checkCount >= meetupCapacity;
}

export async function getPastBookings(userId: string) {
    const db = getDb();

    // OPTIMIZATION: Fetch all data in parallel (similar to getUserBooking)
    // With <20 records, fetching everything is faster than multiple filtered queries
    const [allBookings, allMeetups, allLocations] = await Promise.all([
        // Get all bookings for the user
        db
            .select()
            .from(bookings)
            .where(eq(bookings.userId, userId)),
        // Pre-fetch ALL meetups (with only 20 records, this is faster than filtering)
        db
            .select()
            .from(meetups),
        // Pre-fetch ALL locations (with <20 records, this is faster than individual queries)
        db
            .select()
            .from(coffeeShops),
    ]) as [any[], any[], any[]];

    if (allBookings.length === 0) {
        return [];
    }

    // Combine bookings with meetups and locations (all in-memory, no DB queries)
    const bookingsWithDetails = allBookings.map((booking: any) => {
        const meetup = allMeetups.find((m: any) => m.id === booking.meetupId);
        const location = meetup?.locationId 
            ? allLocations.find((l: any) => l.id === meetup.locationId)
            : null;
        
        return {
            ...booking,
            meetup: meetup ? { ...meetup, location } : null,
        };
    });

    // Filter for past bookings - only bookings where the event date is actually in the past
    // This ensures we don't ask for feedback on future events, even if they're cancelled
    const pastBookings = bookingsWithDetails.filter((booking: any) => {
        if (!booking.meetup || !booking.meetup.date) return false;
        
        // Check if meetup status is "past"
        if (booking.meetup.status === "past") return true;
        
        // Only consider it past if the event date is actually in the past
        // Don't rely on isBookingActive because that also checks for cancelled events
        // We want to only get bookings where the date has passed
        return !isMeetupInFuture(booking.meetup);
    });

    // Sort by creation date descending (most recent first)
    return pastBookings.sort((a: any, b: any) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
    });
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
    
    // Get booking (Edge Runtime compatible)
    const [bookingResult] = await db
        .select()
        .from(bookings)
        .where(eq(bookings.id, bookingId))
        .limit(1) as any[];

    // Verify the booking belongs to the user
    if (!bookingResult || bookingResult.userId !== userId) {
        return null;
    }

    // Fetch related data in parallel
    const [meetupResult] = await Promise.all([
        bookingResult.meetupId
            ? db
                  .select()
                  .from(meetups)
                  .where(eq(meetups.id, bookingResult.meetupId))
                  .limit(1)
            : Promise.resolve([]),
    ]) as [any[]];

    const meetup = meetupResult.length > 0 ? meetupResult[0] : null;

    // Get location if meetup has one
    let location = null;
    if (meetup?.locationId) {
        const [locationResult] = await db
            .select()
            .from(coffeeShops)
            .where(eq(coffeeShops.id, meetup.locationId))
            .limit(1) as any[];
        location = locationResult || null;
    }

    // Combine into booking object
    return {
        ...bookingResult,
        meetup: meetup ? { ...meetup, location } : null,
    };
}

/**
 * Find the first past booking that doesn't have feedback yet
 * Returns the booking ID if found, null otherwise
 * Only returns bookings where the event date is actually in the past
 * Optimized to batch feedback checks instead of sequential queries
 */
export async function getUnratedPastBooking(userId: string): Promise<string | null> {
    const db = getDb();
    
    // Get all past bookings for the user (only events with past dates)
    const pastBookings = await getPastBookings(userId);
    
    if (pastBookings.length === 0) {
        return null;
    }
    
    // Batch check feedback for all past bookings at once (Edge Runtime compatible)
    const bookingIds = pastBookings.map((b: any) => b.id);
    const existingFeedback = await db
        .select()
        .from(feedback)
        .where(inArray(feedback.bookingId, bookingIds)) as any[];
    
    const feedbackBookingIds = new Set(existingFeedback.map((f: any) => f.bookingId));
    
    // Find the first past booking without feedback
    // Double-check that the event date is actually in the past before asking for feedback
    for (const booking of pastBookings) {
        // Ensure the event date is actually in the past (not just cancelled future event)
        if (!booking.meetup || !booking.meetup.date) continue;
        
        // Skip if event is in the future (shouldn't happen with getPastBookings, but double-check)
        if (isMeetupInFuture(booking.meetup)) continue;
        
        // Check if feedback exists (from batched query)
        if (!feedbackBookingIds.has(booking.id)) {
            // Found an unrated past booking with a past event date
            return booking.id;
        }
    }
    
    return null;
}

/**
 * Get all events happening in N days with their confirmed bookings and user details
 * @param daysFromNow Number of days from today (default: 2 for reminder emails)
 */
export async function getEventsWithAttendees(daysFromNow: number = 2) {
    const db = getDb();

    // Calculate target date (N days from today)
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + daysFromNow);
    targetDate.setHours(0, 0, 0, 0);
    
    const targetDateStr = targetDate.toISOString().split("T")[0];

    // Get all meetups using standard select (Edge Runtime compatible)
    const allMeetups = await db
        .select()
        .from(meetups) as any[];

    // Filter for target date
    const targetMeetups = allMeetups.filter((meetup: any) => meetup.date === targetDateStr);

    // For each meetup, get confirmed bookings with user details
    const meetupsWithBookings = await Promise.all(
        targetMeetups.map(async (meetup: any) => {
            // Use standard select for Edge Runtime compatibility
            const confirmedBookings = await db
                .select()
                .from(bookings)
                .where(and(
                    eq(bookings.meetupId, meetup.id),
                    eq(bookings.status, "confirmed")
                )) as any[];

            // Get user details for each booking
            const bookingsWithUsers = await Promise.all(
                confirmedBookings.map(async (booking: any) => {
                    const userResult = await db
                        .select()
                        .from(users)
                        .where(eq(users.id, booking.userId))
                        .limit(1) as any[];
                    
                    return {
                        ...booking,
                        user: userResult.length > 0 ? userResult[0] : null,
                    };
                })
            );

            // Get location if it exists
            let location = null;
            if (meetup.locationId) {
                try {
                    const locationResult = await db
                        .select()
                        .from(coffeeShops)
                        .where(eq(coffeeShops.id, meetup.locationId))
                        .limit(1) as any[];
                    location = locationResult.length > 0 ? locationResult[0] : null;
                } catch (locationError) {
                    console.warn("Failed to fetch location:", locationError);
                }
            }

            return {
                ...meetup,
                location,
                bookings: bookingsWithUsers,
            };
        })
    );

    return meetupsWithBookings;
}

/**
 * Get all events happening tomorrow with their confirmed bookings and user details
 * @deprecated Use getEventsWithAttendees(1) instead
 */
export async function getTomorrowEventsWithAttendees() {
    return getEventsWithAttendees(1);
}

import { getDb } from "@/lib/db";
import { bookings, meetups, coffeeShops, users } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";

export async function getUserBooking(userId: string) {
    const db = getDb();

    // Get the latest booking for the user
    // Explicitly cast to any to avoid complex type inference issues with D1 adapter
    const booking = await db.query.bookings.findFirst({
        where: eq(bookings.userId, userId),
        orderBy: [desc(bookings.createdAt)],
        with: {
            meetup: {
                with: {
                    location: true,
                }
            }
        }
    }) as any;

    if (!booking) return null;

    // Get attendees for this meetup
    const attendees = await db.query.bookings.findMany({
        where: eq(bookings.meetupId, booking.meetupId),
        with: {
            user: true
        }
    }) as any[];

    return {
        ...booking,
        attendees: attendees.map((b: any) => b.user),
    };
}

export async function getUpcomingMeetups() {
    const db = getDb();

    // Get all open meetups
    const allMeetups = await db.query.meetups.findMany({
        where: eq(meetups.status, "open"),
    }) as any[];

    // For each meetup, count attendees
    const meetupsWithAttendees = await Promise.all(
        allMeetups.map(async (meetup: any) => {
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

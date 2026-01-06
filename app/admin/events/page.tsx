import { getDb } from "@/lib/db";
import { meetups, coffeeShops, bookings } from "@/lib/schema";
import { eq, sql, asc } from "drizzle-orm";
import Link from "next/link";
import { isMeetupInFuture } from "@/lib/data";
import { ShowPastToggle } from "./show-past-toggle";

export const runtime = "edge";

async function getMeetups() {
    const db = getDb();

    const result = await db
        .select({
            id: meetups.id,
            date: meetups.date,
            time: meetups.time,
            status: meetups.status,
            language: meetups.language,
            locationName: coffeeShops.name,
            locationCity: coffeeShops.city,
            tableName: meetups.tableName,
            attendeeCount: sql<number>`COALESCE(SUM(CASE WHEN ${bookings.status} = 'confirmed' THEN (CASE WHEN ${bookings.hasPlusOne} = 'true' THEN 2 ELSE 1 END) ELSE 0 END), 0)`,
        })
        .from(meetups)
        .leftJoin(coffeeShops, eq(meetups.locationId, coffeeShops.id))
        .leftJoin(bookings, eq(meetups.id, bookings.meetupId))
        .groupBy(meetups.id, coffeeShops.name, coffeeShops.city)
        .orderBy(asc(meetups.date));

    return result;
}

export default async function AdminEventsPage({ searchParams }: { searchParams: Promise<{ showPast?: string }> }) {
    const { showPast } = await searchParams;
    const allMeetups = await getMeetups();

    // Filter out past events by default (unless showPast=true)
    const showPastEvents = showPast === "true";
    const filteredMeetups = showPastEvents
        ? allMeetups
        : allMeetups.filter((meetup: typeof allMeetups[0]) => isMeetupInFuture(meetup));

    return (
        <div>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
                <h1 className="text-2xl sm:text-3xl font-bold">Events Management</h1>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <ShowPastToggle />
                    <Link
                        href="/admin/events/new"
                        className="bg-primary text-white px-4 py-2 rounded hover:bg-primary/90 text-center sm:text-left"
                    >
                        Create Event
                    </Link>
                </div>
            </div>

            <div className="bg-card text-card-foreground rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-border">
                        <thead className="bg-muted">
                            <tr>
                                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-muted-foreground/80 uppercase">
                                    Date
                                </th>
                                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-muted-foreground/80 uppercase">
                                    Time
                                </th>
                                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-muted-foreground/80 uppercase hidden sm:table-cell">
                                    Location
                                </th>
                                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-muted-foreground/80 uppercase">
                                    Language
                                </th>
                                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-muted-foreground/80 uppercase">
                                    Attendees
                                </th>
                                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-muted-foreground/80 uppercase hidden md:table-cell">
                                    Status
                                </th>
                                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-muted-foreground/80 uppercase">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-card divide-y divide-border">
                            {filteredMeetups.map((meetup: typeof filteredMeetups[0]) => {
                                const isExpired = !isMeetupInFuture(meetup);
                                const displayStatus = isExpired ? "expired" : meetup.status;

                                return (
                                    <tr key={meetup.id} className={`hover:bg-muted/50 ${isExpired ? "opacity-60" : ""}`}>
                                        <td className="px-3 sm:px-6 py-4 text-sm">
                                            {meetup.date}
                                        </td>
                                        <td className="px-3 sm:px-6 py-4 text-sm">
                                            {meetup.time}
                                        </td>
                                        <td className="px-3 sm:px-6 py-4 text-sm hidden sm:table-cell">
                                            <div>{meetup.locationName}</div>
                                            <div className="text-muted-foreground">{meetup.locationCity}</div>
                                            <div className="text-xs text-muted-foreground/70 mt-1">{meetup.tableName}</div>
                                        </td>
                                        <td className="px-3 sm:px-6 py-4 text-sm">
                                            {meetup.language === "zh" ? "🇨🇳 中文" : "🇬🇧 English"}
                                        </td>
                                        <td className="px-3 sm:px-6 py-4 text-sm">
                                            {meetup.attendeeCount}
                                        </td>
                                        <td className="px-3 sm:px-6 py-4 text-sm hidden md:table-cell">
                                            <span
                                                className={`px-2 py-1 rounded text-xs ${isExpired
                                                    ? "bg-red-100 text-red-800"
                                                    : meetup.status === "open"
                                                        ? "bg-green-100 text-green-800"
                                                        : "bg-secondary text-secondary-foreground text-foreground"
                                                    }`}
                                            >
                                                {displayStatus}
                                            </span>
                                        </td>
                                        <td className="px-3 sm:px-6 py-4 text-sm">
                                            <Link
                                                href={`/admin/events/${meetup.id}`}
                                                className="text-primary hover:underline"
                                            >
                                                Edit
                                            </Link>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

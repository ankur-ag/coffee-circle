import { getDb } from "@/lib/db";
import { meetups, coffeeShops, bookings } from "@/lib/schema";
import { eq, sql } from "drizzle-orm";
import Link from "next/link";

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
            attendeeCount: sql<number>`count(${bookings.id})`,
        })
        .from(meetups)
        .leftJoin(coffeeShops, eq(meetups.locationId, coffeeShops.id))
        .leftJoin(bookings, eq(meetups.id, bookings.meetupId))
        .groupBy(meetups.id, coffeeShops.name, coffeeShops.city)
        .orderBy(meetups.date);

    return result;
}

export default async function AdminEventsPage() {
    const allMeetups = await getMeetups();

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Events Management</h1>
                <Link
                    href="/admin/events/new"
                    className="bg-primary text-white px-4 py-2 rounded hover:bg-primary/90"
                >
                    Create Event
                </Link>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Date
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Time
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Location
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Language
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Attendees
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {allMeetups.map((meetup) => (
                            <tr key={meetup.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    {meetup.date}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    {meetup.time}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    {meetup.locationName} ({meetup.locationCity})
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    {meetup.language === "zh" ? "🇨🇳 中文" : "🇬🇧 English"}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    {meetup.attendeeCount}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    <span
                                        className={`px-2 py-1 rounded text-xs ${meetup.status === "open"
                                                ? "bg-green-100 text-green-800"
                                                : "bg-gray-100 text-gray-800"
                                            }`}
                                    >
                                        {meetup.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    <Link
                                        href={`/admin/events/${meetup.id}`}
                                        className="text-primary hover:underline mr-4"
                                    >
                                        Edit
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

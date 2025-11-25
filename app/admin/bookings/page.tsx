import { getDb } from "@/lib/db";
import { bookings, users, meetups, coffeeShops } from "@/lib/schema";
import { eq, desc, and } from "drizzle-orm";
import { CancelBookingButton } from "./cancel-button";
import { LocationFilter } from "./location-filter";

export const runtime = "edge";

async function getBookings(locationId?: string) {
    const db = getDb();

    let query = db
        .select({
            id: bookings.id,
            status: bookings.status,
            createdAt: bookings.createdAt,
            userName: users.name,
            userEmail: users.email,
            meetupDate: meetups.date,
            meetupTime: meetups.time,
            locationName: coffeeShops.name,
            locationCity: coffeeShops.city,
        })
        .from(bookings)
        .leftJoin(users, eq(bookings.userId, users.id))
        .leftJoin(meetups, eq(bookings.meetupId, meetups.id))
        .leftJoin(coffeeShops, eq(meetups.locationId, coffeeShops.id));

    if (locationId) {
        // Note: Drizzle's query builder with joins and conditional where clauses can be tricky.
        // For simplicity with this specific query structure, we'll apply the filter in the where clause directly if possible,
        // but since we're using a chain, we might need to reconstruct it or use a dynamic where.
        // Let's try a cleaner approach with dynamic where.

        // Re-constructing query to support dynamic where
        const baseQuery = db
            .select({
                id: bookings.id,
                status: bookings.status,
                createdAt: bookings.createdAt,
                userName: users.name,
                userEmail: users.email,
                meetupDate: meetups.date,
                meetupTime: meetups.time,
                locationName: coffeeShops.name,
                locationCity: coffeeShops.city,
            })
            .from(bookings)
            .leftJoin(users, eq(bookings.userId, users.id))
            .leftJoin(meetups, eq(bookings.meetupId, meetups.id))
            .leftJoin(coffeeShops, eq(meetups.locationId, coffeeShops.id));

        if (locationId) {
            baseQuery.where(eq(meetups.locationId, locationId));
        }

        return await baseQuery.orderBy(desc(bookings.createdAt));
    }

    return await query.orderBy(desc(bookings.createdAt));
}

async function getLocations() {
    const db = getDb();
    return await db.select({ id: coffeeShops.id, name: coffeeShops.name, city: coffeeShops.city }).from(coffeeShops).all();
}

export default async function AdminBookingsPage({ searchParams }: { searchParams: Promise<{ locationId?: string }> }) {
    const { locationId } = await searchParams;
    const allBookings = await getBookings(locationId);
    const locations = await getLocations();

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Reservations Management</h1>
                <LocationFilter locations={locations} />
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                User
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Event
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Location
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Booked At
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {allBookings.map((booking) => (
                            <tr key={booking.id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900">{booking.userName}</div>
                                    <div className="text-sm text-gray-500">{booking.userEmail}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    {booking.meetupDate} at {booking.meetupTime}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    {booking.locationName} ({booking.locationCity})
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    <span
                                        className={`px-2 py-1 rounded text-xs ${booking.status === "confirmed"
                                            ? "bg-green-100 text-green-800"
                                            : "bg-red-100 text-red-800"
                                            }`}
                                    >
                                        {booking.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {booking.createdAt ? new Date(booking.createdAt).toLocaleDateString() : "-"}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    {booking.status === "confirmed" && (
                                        <CancelBookingButton bookingId={booking.id} />
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

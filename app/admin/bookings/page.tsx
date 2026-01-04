import { getDb } from "@/lib/db";
import { bookings, users, meetups, coffeeShops } from "@/lib/schema";
import { eq, desc, and } from "drizzle-orm";
import { CancelBookingButton } from "./cancel-button";
import { LocationFilter } from "./location-filter";
import { DateFilter } from "./date-filter";

export const runtime = "edge";

async function getBookings(locationId?: string, eventDate?: string) {
    const db = getDb();

    // Build base query
    const baseQuery = db
        .select({
            id: bookings.id,
            status: bookings.status,
            hasPlusOne: bookings.hasPlusOne,
            createdAt: bookings.createdAt,
            userName: users.name,
            userEmail: users.email,
            meetupDate: meetups.date,
            meetupTime: meetups.time,
            tableName: meetups.tableName,
            locationName: coffeeShops.name,
            locationCity: coffeeShops.city,
        })
        .from(bookings)
        .leftJoin(users, eq(bookings.userId, users.id))
        .leftJoin(meetups, eq(bookings.meetupId, meetups.id))
        .leftJoin(coffeeShops, eq(meetups.locationId, coffeeShops.id));

    // Build where conditions
    const conditions = [];
    if (locationId) {
        conditions.push(eq(meetups.locationId, locationId));
    }
    if (eventDate) {
        conditions.push(eq(meetups.date, eventDate));
    }

    // Apply where clause if we have any conditions
    if (conditions.length > 0) {
        if (conditions.length === 1) {
            baseQuery.where(conditions[0]);
        } else {
            baseQuery.where(and(...conditions));
        }
    }

    return await baseQuery.orderBy(desc(bookings.createdAt));
}

async function getLocations() {
    const db = getDb();
    return await db.select({ id: coffeeShops.id, name: coffeeShops.name, city: coffeeShops.city }).from(coffeeShops);
}

export default async function AdminBookingsPage({ searchParams }: { searchParams: Promise<{ locationId?: string; eventDate?: string }> }) {
    const { locationId, eventDate } = await searchParams;
    const allBookings = await getBookings(locationId, eventDate);
    const locations = await getLocations();

    return (
        <div>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
                <h1 className="text-2xl sm:text-3xl font-bold">Reservations Management</h1>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4">
                    <DateFilter />
                    <LocationFilter locations={locations} />
                </div>
            </div>

            <div className="bg-card text-card-foreground rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-border">
                        <thead className="bg-muted">
                            <tr>
                                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-muted-foreground/80 uppercase">
                                    User
                                </th>
                                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-muted-foreground/80 uppercase">
                                    Event
                                </th>
                                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-muted-foreground/80 uppercase">
                                    Table
                                </th>
                                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-muted-foreground/80 uppercase">
                                    +1
                                </th>
                                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-muted-foreground/80 uppercase hidden sm:table-cell">
                                    Location
                                </th>
                                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-muted-foreground/80 uppercase">
                                    Status
                                </th>
                                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-muted-foreground/80 uppercase hidden md:table-cell">
                                    Booked At
                                </th>
                                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-muted-foreground/80 uppercase">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-card divide-y divide-border">
                            {allBookings.map((booking: typeof allBookings[0]) => (
                                <tr key={booking.id} className="hover:bg-muted/50">
                                    <td className="px-3 sm:px-6 py-4">
                                        <div className="text-sm font-medium text-foreground">{booking.userName}</div>
                                        <div className="text-sm text-muted-foreground truncate max-w-[150px] sm:max-w-none">{booking.userEmail}</div>
                                    </td>
                                    <td className="px-3 sm:px-6 py-4 text-sm">
                                        <div>{booking.meetupDate}</div>
                                        <div className="text-muted-foreground">{booking.meetupTime}</div>
                                    </td>
                                    <td className="px-3 sm:px-6 py-4 text-sm">
                                        <div className="font-medium">{booking.tableName}</div>
                                    </td>
                                    <td className="px-3 sm:px-6 py-4 text-sm text-center">
                                        {booking.hasPlusOne === "true" ? (
                                            <span className="text-blue-600 font-bold px-2 py-0.5 bg-blue-50 rounded-full text-xs">Yes</span>
                                        ) : (
                                            <span className="text-muted-foreground/70 text-xs">No</span>
                                        )}
                                    </td>
                                    <td className="px-3 sm:px-6 py-4 text-sm hidden sm:table-cell">
                                        <div>{booking.locationName}</div>
                                        <div className="text-muted-foreground">{booking.locationCity}</div>
                                    </td>
                                    <td className="px-3 sm:px-6 py-4 text-sm">
                                        <span
                                            className={`px-2 py-1 rounded text-xs ${booking.status === "confirmed"
                                                ? "bg-green-100 text-green-800"
                                                : "bg-red-100 text-red-800"
                                                }`}
                                        >
                                            {booking.status}
                                        </span>
                                    </td>
                                    <td className="px-3 sm:px-6 py-4 text-sm text-muted-foreground hidden md:table-cell">
                                        {booking.createdAt ? new Date(booking.createdAt).toLocaleDateString() : "-"}
                                    </td>
                                    <td className="px-3 sm:px-6 py-4 text-sm">
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
        </div>
    );
}

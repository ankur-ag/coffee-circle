import { getDb } from "@/lib/db";
import { coffeeShops } from "@/lib/schema";
import Link from "next/link";

export const runtime = "edge";

async function getLocations() {
    const db = getDb();
    try {
        // Try to select all columns including googleMapsLink
        const locations = await db.select().from(coffeeShops);
        return locations;
    } catch (error) {
        // If column doesn't exist yet, select only existing columns
        // This is a temporary fallback until migration is run
        console.warn("google_maps_link column not found, selecting without it:", error);
        const locations = await db
            .select({
                id: coffeeShops.id,
                name: coffeeShops.name,
                location: coffeeShops.location,
                city: coffeeShops.city,
                description: coffeeShops.description,
                image: coffeeShops.image,
                rating: coffeeShops.rating,
                features: coffeeShops.features,
            })
            .from(coffeeShops);
        return locations.map((loc) => ({ ...loc, googleMapsLink: null }));
    }
}

export default async function AdminLocationsPage() {
    const locations = await getLocations();

    return (
        <div>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
                <h1 className="text-2xl sm:text-3xl font-bold">Locations Management</h1>
                <Link
                    href="/admin/locations/new"
                    className="bg-primary text-white px-4 py-2 rounded hover:bg-primary/90 text-center sm:text-left"
                >
                    Add Location
                </Link>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Name
                            </th>
                            <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                City
                            </th>
                            <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">
                                Location
                            </th>
                            <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Rating
                            </th>
                            <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {locations.map((location) => (
                            <tr key={location.id} className="hover:bg-gray-50">
                                <td className="px-3 sm:px-6 py-4 text-sm font-medium">
                                    {location.name}
                                </td>
                                <td className="px-3 sm:px-6 py-4 text-sm">
                                    {location.city}
                                </td>
                                <td className="px-3 sm:px-6 py-4 text-sm hidden sm:table-cell">
                                    {location.location}
                                </td>
                                <td className="px-3 sm:px-6 py-4 text-sm">
                                    {(location.rating / 10).toFixed(1)} ⭐
                                </td>
                                <td className="px-3 sm:px-6 py-4 text-sm">
                                    <Link
                                        href={`/admin/locations/${location.id}`}
                                        className="text-primary hover:underline"
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
        </div>
    );
}

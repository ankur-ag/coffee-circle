"use client";

import { useRouter, useSearchParams } from "next/navigation";

type Location = {
    id: string;
    name: string;
    city: string;
};

export function LocationFilter({ locations }: { locations: Location[] }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentLocationId = searchParams?.get("locationId") || "";

    function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
        const locationId = e.target.value;
        const params = new URLSearchParams(searchParams?.toString() || "");

        if (locationId) {
            params.set("locationId", locationId);
        } else {
            params.delete("locationId");
        }

        router.push(`/admin/bookings?${params.toString()}`);
    }

    return (
        <div className="flex items-center gap-2">
            <label htmlFor="location-filter" className="text-sm font-medium text-gray-700">
                Filter by Location:
            </label>
            <select
                id="location-filter"
                value={currentLocationId}
                onChange={handleChange}
                className="border rounded px-3 py-2 text-sm bg-white"
            >
                <option value="">All Locations</option>
                {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                        {loc.name} ({loc.city})
                    </option>
                ))}
            </select>
        </div>
    );
}

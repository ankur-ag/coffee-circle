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
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
            <label htmlFor="location-filter" className="text-sm font-medium text-muted-foreground whitespace-nowrap">
                Filter by Location:
            </label>
            <select
                id="location-filter"
                value={currentLocationId}
                onChange={handleChange}
                className="border border-border rounded px-3 py-2 text-sm bg-card text-card-foreground w-full sm:w-auto"
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

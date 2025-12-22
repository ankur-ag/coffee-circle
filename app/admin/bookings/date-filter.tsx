"use client";

import { useRouter, useSearchParams } from "next/navigation";

export function DateFilter() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentDate = searchParams?.get("eventDate") || "";

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
        const eventDate = e.target.value;
        const params = new URLSearchParams(searchParams?.toString() || "");

        if (eventDate) {
            params.set("eventDate", eventDate);
        } else {
            params.delete("eventDate");
        }

        router.push(`/admin/bookings?${params.toString()}`);
    }

    return (
        <div className="flex items-center gap-2">
            <label htmlFor="date-filter" className="text-sm font-medium text-gray-700">
                Filter by Event Date:
            </label>
            <input
                id="date-filter"
                type="date"
                value={currentDate}
                onChange={handleChange}
                className="border rounded px-3 py-2 text-sm bg-white"
            />
        </div>
    );
}

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
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
            <label htmlFor="date-filter" className="text-sm font-medium text-muted-foreground whitespace-nowrap">
                Filter by Event Date:
            </label>
            <input
                id="date-filter"
                type="date"
                value={currentDate}
                onChange={handleChange}
                className="border border-border rounded px-3 py-2 text-sm bg-card text-card-foreground w-full sm:w-auto"
            />
        </div>
    );
}


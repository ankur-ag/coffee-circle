"use client";

import { useRouter, useSearchParams } from "next/navigation";

export function ShowPastToggle() {
    const router = useRouter();
    const searchParams = useSearchParams();
    // Default to hiding past events (showPast=false means hide past, which is the default)
    const showPast = searchParams?.get("showPast") === "true";

    function handleToggle() {
        const params = new URLSearchParams(searchParams?.toString() || "");
        
        if (showPast) {
            // Currently showing past events, hide them (remove param)
            params.delete("showPast");
        } else {
            // Currently hiding past events, show them
            params.set("showPast", "true");
        }

        router.push(`/admin/events?${params.toString()}`);
    }

    return (
        <label className="flex items-center gap-2 cursor-pointer">
            <input
                type="checkbox"
                checked={showPast}
                onChange={handleToggle}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <span className="text-sm font-medium text-gray-700">
                Show past events
            </span>
        </label>
    );
}

"use client";

import { removePlusOneAdmin } from "@/app/admin/actions";
import { useTransition } from "react";
import { XCircle } from "lucide-react";

export function RemovePlusOneButton({ bookingId }: { bookingId: string }) {
    const [isPending, startTransition] = useTransition();

    return (
        <button
            onClick={() => {
                if (confirm("Are you sure you want to remove the guest (+1) from this reservation?")) {
                    startTransition(() => removePlusOneAdmin(bookingId));
                }
            }}
            disabled={isPending}
            className="ml-2 text-red-500 hover:text-red-700 disabled:opacity-50 transition-colors"
            title="Remove guest (+1)"
        >
            <XCircle className="h-4 w-4" />
        </button>
    );
}

"use client";

import { cancelBookingAdmin } from "@/app/admin/actions";
import { useTransition } from "react";

export function CancelBookingButton({ bookingId }: { bookingId: string }) {
    const [isPending, startTransition] = useTransition();

    return (
        <button
            onClick={() => startTransition(() => cancelBookingAdmin(bookingId))}
            disabled={isPending}
            className="text-red-600 hover:text-red-900 text-sm font-medium disabled:opacity-50"
        >
            {isPending ? "Cancelling..." : "Cancel"}
        </button>
    );
}

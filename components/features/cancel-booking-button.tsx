"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import { cancelBooking } from "@/app/actions";

interface CancelBookingButtonProps {
    bookingId: string;
    eventDate: string;
    eventTime: string;
    locationName?: string;
}

export function CancelBookingButton({ bookingId, eventDate, eventTime, locationName }: CancelBookingButtonProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [showConfirm, setShowConfirm] = useState(false);

    const handleCancel = () => {
        startTransition(async () => {
            try {
                await cancelBooking(bookingId);
                // If successful, redirect will happen server-side
                // But we'll also refresh to update the UI
                router.push("/dashboard");
                router.refresh();
            } catch (error: any) {
                // Handle NEXT_REDIRECT error - it's actually a success case in Next.js
                if (error?.digest?.startsWith("NEXT_REDIRECT") || error?.message?.includes("NEXT_REDIRECT")) {
                    router.push("/dashboard");
                    router.refresh();
                } else {
                    alert(error.message || "Failed to cancel booking. Please try again.");
                    setShowConfirm(false);
                }
            }
        });
    };

    if (showConfirm) {
        return (
            <Card className="border-amber-200 bg-amber-50/50">
                <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-amber-600" />
                        <CardTitle className="text-base">Confirm Cancellation</CardTitle>
                    </div>
                    <CardDescription className="text-sm">
                        Are you sure you want to cancel this booking? This action cannot be undone.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="rounded-lg bg-white p-3 border border-amber-200">
                        <div className="text-sm space-y-1">
                            <p className="font-medium text-foreground">Event Details:</p>
                            <p className="text-muted-foreground">Date: {eventDate}</p>
                            <p className="text-muted-foreground">Time: {eventTime}</p>
                            {locationName && (
                                <p className="text-muted-foreground">Location: {locationName}</p>
                            )}
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="destructive"
                            className="flex-1"
                            onClick={handleCancel}
                            disabled={isPending}
                        >
                            {isPending ? "Cancelling..." : "Yes, Cancel Booking"}
                        </Button>
                        <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => setShowConfirm(false)}
                            disabled={isPending}
                        >
                            Keep Booking
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Button
            variant="outline"
            className="w-full"
            onClick={() => setShowConfirm(true)}
        >
            Cancel Booking
        </Button>
    );
}

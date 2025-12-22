"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Users, ArrowRight, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UPCOMING_MEETUPS } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { bookMeetup } from "@/app/actions";

interface Meetup {
    id: string;
    date: string;
    time: string;
    status: string;
    language: string;
    attendees: any[];
    attendeeCount?: number;
    isFull?: boolean;
}

export function BookingForm({ meetups }: { meetups: Meetup[] }) {
    const router = useRouter();
    const [selectedMeetupId, setSelectedMeetupId] = useState<string | null>(null);
    const [hasPlusOne, setHasPlusOne] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Show message if no meetups available
    if (!meetups || meetups.length === 0) {
        return (
            <Card>
                <CardContent className="py-12 text-center">
                    <p className="text-muted-foreground">No upcoming meetups available at the moment. Please check back later!</p>
                </CardContent>
            </Card>
        );
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);
        setIsSubmitting(true);

        const formData = new FormData(e.currentTarget);

        try {
            await bookMeetup(formData);
            
            // Navigate to dashboard on success
            router.push("/dashboard");
        } catch (err: any) {
            // Handle NEXT_REDIRECT error - it's actually a success case in Next.js
            // The redirect() function throws a special error that Next.js uses internally
            if (err?.digest?.startsWith("NEXT_REDIRECT") || err?.message?.includes("NEXT_REDIRECT")) {
                // This is actually success - navigate to dashboard
                router.push("/dashboard");
            } else {
                setIsSubmitting(false);
                setError(err instanceof Error ? err.message : "Failed to book meetup. Please try again.");
            }
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            <input type="hidden" name="meetupId" value={selectedMeetupId || ""} />
            <input type="hidden" name="hasPlusOne" value={hasPlusOne ? "true" : "false"} />

            {/* Error Message */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                        <h3 className="text-sm font-medium text-red-800">Unable to Book</h3>
                        <p className="text-sm text-red-700 mt-1">{error}</p>
                    </div>
                </div>
            )}

            {/* Step 1: Select Date */}
            <section>
                <h2 className="mb-4 text-xl font-semibold">Choose a Date</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                    {meetups.map((meetup) => {
                        const attendeeCount = meetup.attendeeCount ?? meetup.attendees.length;
                        const full = meetup.isFull ?? attendeeCount >= 6;
                        const canSelect = !full || selectedMeetupId === meetup.id;

                        return (
                            <Card
                                key={meetup.id}
                                className={cn(
                                    "transition-all",
                                    full && !canSelect
                                        ? "opacity-60 cursor-not-allowed"
                                        : "cursor-pointer hover:border-primary",
                                    selectedMeetupId === meetup.id ? "border-primary ring-1 ring-primary" : ""
                                )}
                                onClick={() => {
                                    if (!full || canSelect) {
                                        setSelectedMeetupId(meetup.id);
                                    }
                                }}
                            >
                                <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Badge variant="secondary" className="uppercase">
                                                {format(new Date(meetup.date), "EEEE")}
                                            </Badge>
                                            <Badge variant="outline">
                                                {meetup.language === "zh" ? "🇨🇳 中文" : "🇬🇧 English"}
                                            </Badge>
                                            {full && (
                                                <Badge variant="destructive" className="ml-2">
                                                    Full
                                                </Badge>
                                            )}
                                        </div>
                                        <span className="text-sm text-muted-foreground">{meetup.time}</span>
                                    </div>
                                    <CardTitle className="text-lg">
                                        {format(new Date(meetup.date), "MMMM d, yyyy")}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Users className="h-4 w-4" />
                                        <span>
                                            {attendeeCount} / 6 {full ? "(Full)" : "people attending"}
                                        </span>
                                    </div>
                                    {full && (
                                        <p className="text-xs text-muted-foreground mt-2">
                                            This event has reached maximum capacity
                                        </p>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            </section>

            {/* Step 2: Bring a +1 */}
            <section className={cn("transition-opacity duration-500", selectedMeetupId ? "opacity-100" : "opacity-50 pointer-events-none")}>
                <h2 className="mb-4 text-xl font-semibold">Bringing a Guest?</h2>
                <Card
                    className={cn(
                        "cursor-pointer transition-all hover:border-primary",
                        hasPlusOne ? "border-primary ring-1 ring-primary" : ""
                    )}
                    onClick={() => setHasPlusOne(!hasPlusOne)}
                >
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-lg">Bring a +1</CardTitle>
                                <CardDescription>Bringing a friend? They'll count towards the event capacity.</CardDescription>
                            </div>
                            <input
                                type="checkbox"
                                checked={hasPlusOne}
                                onChange={(e) => setHasPlusOne(e.target.checked)}
                                onClick={(e) => e.stopPropagation()}
                                className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                        </div>
                    </CardHeader>
                </Card>
            </section>

            {/* Action */}
            <div className="flex justify-end pt-4">
                {(() => {
                    const selectedMeetup = meetups.find((m) => m.id === selectedMeetupId);
                    const selectedAttendeeCount = selectedMeetup?.attendeeCount ?? selectedMeetup?.attendees.length ?? 0;
                    // Check if adding +1 would make it full
                    const wouldBeFull = hasPlusOne ? selectedAttendeeCount + 1 >= 6 : selectedAttendeeCount >= 6;
                    const canBook = selectedMeetupId && !wouldBeFull;

                    return (
                        <Button
                            type="submit"
                            size="lg"
                            className="w-full sm:w-auto"
                            disabled={!canBook || isSubmitting}
                        >
                            {isSubmitting ? "Booking..." : "Confirm Booking"} <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    );
                })()}
            </div>
        </form>
    );
}

"use client";

import { useState } from "react";
import { useFormState } from "react-dom";
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
}

export function BookingForm({ meetups }: { meetups: Meetup[] }) {
    const [selectedMeetupId, setSelectedMeetupId] = useState<string | null>(null);
    const [selectedVibe, setSelectedVibe] = useState<string | null>(null);
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
        } catch (err) {
            setIsSubmitting(false);
            setError(err instanceof Error ? err.message : "Failed to book meetup. Please try again.");
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            <input type="hidden" name="meetupId" value={selectedMeetupId || ""} />
            <input type="hidden" name="vibe" value={selectedVibe || ""} />

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
                <h2 className="mb-4 text-xl font-semibold">1. Choose a Date</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                    {meetups.map((meetup) => (
                        <Card
                            key={meetup.id}
                            className={cn(
                                "cursor-pointer transition-all hover:border-primary",
                                selectedMeetupId === meetup.id ? "border-primary ring-1 ring-primary" : ""
                            )}
                            onClick={() => setSelectedMeetupId(meetup.id)}
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
                                    <span>{meetup.attendees.length} people attending</span>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </section>

            {/* Step 2: Select Vibe */}
            <section className={cn("transition-opacity duration-500", selectedMeetupId ? "opacity-100" : "opacity-50 pointer-events-none")}>
                <h2 className="mb-4 text-xl font-semibold">2. Select Your Vibe</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                    {[
                        { id: "quiet", title: "Quiet Conversation", desc: "Low key, intimate, focused on deep talk." },
                        { id: "social", title: "Social & Networking", desc: "Lively, energetic, meeting new people." },
                    ].map((vibe) => (
                        <Card
                            key={vibe.id}
                            className={cn(
                                "cursor-pointer transition-all hover:border-primary",
                                selectedVibe === vibe.id ? "border-primary ring-1 ring-primary" : ""
                            )}
                            onClick={() => setSelectedVibe(vibe.id)}
                        >
                            <CardHeader>
                                <CardTitle className="text-lg">{vibe.title}</CardTitle>
                                <CardDescription>{vibe.desc}</CardDescription>
                            </CardHeader>
                        </Card>
                    ))}
                </div>
            </section>

            {/* Action */}
            <div className="flex justify-end pt-4">
                <Button
                    type="submit"
                    size="lg"
                    className="w-full sm:w-auto"
                    disabled={!selectedMeetupId || !selectedVibe || isSubmitting}
                >
                    {isSubmitting ? "Booking..." : "Confirm Booking"} <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            </div>
        </form>
    );
}

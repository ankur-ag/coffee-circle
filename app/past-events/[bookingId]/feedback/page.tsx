import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getBookingById, getFeedbackForBooking } from "@/lib/data";
import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { format } from "date-fns";
import { MapPin, Clock, Calendar, ArrowLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { FeedbackForm } from "./feedback-form";

export const runtime = "edge";

export default async function FeedbackPage({ params }: { params: Promise<{ bookingId: string }> }) {
    const session = await auth();

    if (!session?.user?.id) {
        redirect("/");
    }

    const { bookingId } = await params;
    const userId = session.user.id;

    const booking = await getBookingById(bookingId, userId);
    const existingFeedback = await getFeedbackForBooking(bookingId);

    if (!booking) {
        notFound();
    }

    const { meetup } = booking;
    const location = meetup?.location;

    return (
        <main className="container mx-auto max-w-4xl px-4 py-12 md:px-6">
            <Link href="/past-events" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Past Events</span>
            </Link>

            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">Event Feedback</h1>
                <p className="text-muted-foreground mt-2">Share your experience from this coffee meetup</p>
            </div>

            <div className="grid gap-8 md:grid-cols-[1fr_1fr]">
                {/* Event Details Card */}
                <Card>
                    <CardHeader>
                        <CardTitle>Event Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {location?.image && (
                            <div className="relative h-48 w-full rounded-lg overflow-hidden bg-muted">
                                <Image
                                    src={location.image}
                                    alt={location.name || "Location"}
                                    fill
                                    className="object-cover"
                                />
                            </div>
                        )}
                        <div>
                            <h3 className="font-semibold text-lg">
                                {location?.name || "Mystery Location"}
                            </h3>
                            {location && (
                                <div className="flex items-center gap-2 text-muted-foreground mt-1">
                                    <MapPin className="h-4 w-4" />
                                    <span className="text-sm">
                                        {location.location}, {location.city}
                                    </span>
                                </div>
                            )}
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center gap-3">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <div>
                                    <p className="font-medium">
                                        {meetup?.date ? format(new Date(meetup.date), "EEEE, MMMM d, yyyy") : "Date TBD"}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <div>
                                    <p className="font-medium">{meetup?.time || "Time TBD"}</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Feedback Form Card */}
                <Card>
                    <CardHeader>
                        <CardTitle>Your Feedback</CardTitle>
                        <CardDescription>
                            {existingFeedback ? "Update your feedback" : "Rate and comment on your experience"}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <FeedbackForm bookingId={bookingId} existingFeedback={existingFeedback} />
                    </CardContent>
                </Card>
            </div>
        </main>
    );
}



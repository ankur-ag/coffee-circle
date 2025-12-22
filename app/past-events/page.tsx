import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getPastBookings, getFeedbackForBooking } from "@/lib/data";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { MapPin, Clock, Calendar, MessageSquare, CheckCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export const runtime = "edge";

export default async function PastEventsPage() {
    const session = await auth();

    if (!session?.user?.id) {
        redirect("/");
    }

    const userId = session.user.id;
    const pastBookings = await getPastBookings(userId);

    // Check which bookings have feedback
    const bookingsWithFeedback = await Promise.all(
        pastBookings.map(async (booking: any) => {
            const existingFeedback = await getFeedbackForBooking(booking.id);
            return {
                ...booking,
                hasFeedback: !!existingFeedback,
            };
        })
    );

    return (
        <main className="container mx-auto max-w-4xl px-4 py-12 md:px-6">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">Past Events</h1>
                <p className="text-muted-foreground mt-2">Your previous coffee meetups</p>
            </div>

            {pastBookings.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <p className="text-muted-foreground">You haven't attended any past events yet.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-6">
                    {bookingsWithFeedback.map((booking: any) => {
                        const { meetup } = booking;
                        const location = meetup?.location;

                        return (
                            <Card key={booking.id} className="overflow-hidden">
                                <div className="grid md:grid-cols-[200px_1fr] gap-0">
                                    {location?.image && (
                                        <div className="relative h-48 md:h-full w-full bg-muted">
                                            <Image
                                                src={location.image}
                                                alt={location.name || "Location"}
                                                fill
                                                className="object-cover"
                                            />
                                        </div>
                                    )}
                                    <div>
                                        <CardHeader>
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <CardTitle className="text-xl">
                                                        {location?.name || "Mystery Location"}
                                                    </CardTitle>
                                                    {location && (
                                                        <div className="flex items-center gap-2 text-muted-foreground mt-1">
                                                            <MapPin className="h-4 w-4" />
                                                            <span className="text-sm">
                                                                {location.location}, {location.city}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                                <Badge variant="secondary">Past</Badge>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-4">
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
                                                {booking.vibe && (
                                                    <div>
                                                        <p className="text-sm text-muted-foreground mb-1">Your vibe:</p>
                                                        <Badge variant="outline">{booking.vibe}</Badge>
                                                    </div>
                                                )}
                                                {location?.description && (
                                                    <p className="text-sm text-muted-foreground line-clamp-2">
                                                        {location.description}
                                                    </p>
                                                )}
                                                <div className="pt-4 border-t">
                                                    <Link href={`/past-events/${booking.id}/feedback`}>
                                                        <Button variant={booking.hasFeedback ? "outline" : "default"} className="w-full sm:w-auto">
                                                            {booking.hasFeedback ? (
                                                                <>
                                                                    <CheckCircle className="h-4 w-4 mr-2" />
                                                                    Update Feedback
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <MessageSquare className="h-4 w-4 mr-2" />
                                                                    Provide Feedback
                                                                </>
                                                            )}
                                                        </Button>
                                                    </Link>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}
        </main>
    );
}



import { MapPin, Clock, Calendar, Users, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { format, differenceInDays } from "date-fns";
import { getUserBooking, getUnratedPastBooking } from "@/lib/data";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { LOCATION_REVEAL_DAYS } from "@/lib/config";

import { CancelBookingButton } from "@/components/features/cancel-booking-button";

export const runtime = "edge";

/**
 * Check if location should be revealed based on global config
 */
function shouldRevealLocation(eventDate: string): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const event = new Date(eventDate);
    event.setHours(0, 0, 0, 0);
    
    const daysUntilEvent = differenceInDays(event, today);
    
    // Reveal location based on LOCATION_REVEAL_DAYS config
    return daysUntilEvent <= LOCATION_REVEAL_DAYS;
}

export default async function DashboardPage() {
    const session = await auth();

    if (!session?.user?.id) {
        redirect("/book");
    }

    const userId = session.user.id;
    
    // Check if there's an unrated past event - redirect to feedback if so
    const unratedBookingId = await getUnratedPastBooking(userId);
    if (unratedBookingId) {
        redirect(`/past-events/${unratedBookingId}/feedback`);
    }
    
    const booking = await getUserBooking(userId);

    if (!booking) {
        return (
            <main className="container mx-auto max-w-4xl px-5 py-12 md:px-6 text-center">
                <h1 className="text-3xl font-bold">No Upcoming Meetups</h1>
                <p className="mt-4 text-muted-foreground">You haven't booked any coffee meetups yet.</p>
                <Button className="mt-8" asChild>
                    <a href="/book">Book a Spot</a>
                </Button>
            </main>
        );
    }

    const { meetup, attendees } = booking;
    const location = meetup.location;
    const hasLocation = !!location;
    const isRevealed = hasLocation && shouldRevealLocation(meetup.date);
    
    // Calculate days until reveal
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const eventDate = new Date(meetup.date);
    eventDate.setHours(0, 0, 0, 0);
    const daysUntilEvent = differenceInDays(eventDate, today);
    const daysUntilReveal = Math.max(0, daysUntilEvent - LOCATION_REVEAL_DAYS);
    
    // Coffee brewing image for hidden locations
    const COFFEE_BREWING_IMAGE = "https://images.unsplash.com/photo-1517487881594-2787fef5ebf7?q=80&w=1000&auto=format&fit=crop";

    return (
        <main className="container mx-auto max-w-4xl px-5 py-12 md:px-6">
            <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Your Ticket</h1>
                    <p className="text-muted-foreground">You're all set for this weekend!</p>
                </div>
                <Badge variant="secondary" className="w-fit px-4 py-1 text-base">
                    Confirmed
                </Badge>
            </div>

            <div className="grid gap-8 md:grid-cols-[2fr_1fr]">
                <div className="space-y-6">
                    {/* Location Card */}
                    <Card className="overflow-hidden border-primary/20 shadow-lg">
                        <div className="relative h-48 w-full bg-muted">
                            {isRevealed && location ? (
                                <Image
                                    src={location.image}
                                    alt={location.name}
                                    fill
                                    className="object-cover"
                                />
                            ) : (
                                <Image
                                    src={COFFEE_BREWING_IMAGE}
                                    alt="Coffee brewing"
                                    fill
                                    className="object-cover opacity-60"
                                />
                            )}
                            {!isRevealed && hasLocation && (
                                <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
                            )}
                            <div className="absolute right-4 top-4 rounded-full bg-background/90 px-3 py-1 text-xs font-medium backdrop-blur">
                                {isRevealed 
                                    ? "Location Revealed" 
                                    : daysUntilReveal > 0
                                        ? `Reveals in ${daysUntilReveal} day${daysUntilReveal !== 1 ? 's' : ''}`
                                        : "Reveals soon"}
                            </div>
                        </div>
                        <CardHeader>
                            <CardTitle className="text-2xl">
                                {isRevealed && location ? (
                                    <a
                                        href={(location as any).googleMapsLink || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${location.name} ${location.location} ${location.city}`)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="hover:text-primary transition-colors"
                                    >
                                        {location.name}
                                    </a>
                                ) : (
                                    <span className={hasLocation && !isRevealed ? "blur-sm select-none" : ""}>
                                        Mystery Location
                                    </span>
                                )}
                            </CardTitle>
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <MapPin className="h-4 w-4" />
                                {isRevealed && location ? (
                                    <a
                                        href={(location as any).googleMapsLink || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${location.name} ${location.location} ${location.city}`)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="hover:text-primary transition-colors underline"
                                    >
                                        {location.location}
                                    </a>
                                ) : (
                                    <span className={hasLocation && !isRevealed ? "blur-sm select-none" : ""}>
                                        {hasLocation ? "Location hidden until 2 days before event" : "Taipei City (TBA)"}
                                    </span>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent>
                            {isRevealed && location ? (
                                <div className="space-y-4">
                                    <p className="text-muted-foreground">{location.description}</p>
                                    <div className="flex flex-wrap gap-2">
                                        {JSON.parse(location.features).map((feature: string) => (
                                            <Badge key={feature} variant="outline">
                                                {feature}
                                            </Badge>
                                        ))}
                                    </div>
                                    <div className="flex items-center gap-1 text-amber-500">
                                        <Star className="h-4 w-4 fill-current" />
                                        <span className="font-medium">{location.rating / 10}</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <p className="text-muted-foreground">
                                        {hasLocation 
                                            ? `We're curating the perfect spot for your group. The location will be revealed ${LOCATION_REVEAL_DAYS} day${LOCATION_REVEAL_DAYS > 1 ? 's' : ''} before the event!`
                                            : "We're curating the perfect spot for your group. Check back soon!"}
                                    </p>
                                    {hasLocation && !isRevealed && daysUntilReveal > 0 && (
                                        <p className="text-sm text-muted-foreground">
                                            Location will be revealed in {daysUntilReveal} day{daysUntilReveal !== 1 ? 's' : ''}.
                                        </p>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Group Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="h-5 w-5" />
                                Your Circle
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {attendees.filter((u: typeof attendees[0]) => u.id !== userId).map((user: typeof attendees[0]) => {
                                    // Extract first name only
                                    const firstName = user.name?.split(" ")[0] || user.name || "Guest";
                                    const userImage = user.avatar || user.image;
                                    const userInitial = firstName[0]?.toUpperCase() || "?";
                                    
                                    return (
                                        <div key={user.id} className="flex items-center gap-4 rounded-lg border p-3 transition-colors hover:bg-secondary/50">
                                            <div className="relative h-12 w-12 overflow-hidden rounded-full bg-muted">
                                                {userImage ? (
                                                    <Image src={userImage} alt={firstName} fill className="object-cover" />
                                                ) : (
                                                    <div className="flex h-full w-full items-center justify-center bg-gray-300 text-gray-600 font-medium text-lg">
                                                        {userInitial}
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-medium">{firstName}</p>
                                                <p className="text-sm text-muted-foreground">{user.bio}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div className="flex items-center gap-4 rounded-lg border border-dashed p-3">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-muted-foreground">
                                        You
                                    </div>
                                    <div>
                                        <p className="font-medium">That's you!</p>
                                        <p className="text-sm text-muted-foreground">Ready to mingle</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar Details */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Time & Date</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-3">
                                <Calendar className="h-5 w-5 text-primary" />
                                <div>
                                    <p className="font-medium">{format(new Date(meetup.date), "EEEE, MMMM d")}</p>
                                    <p className="text-sm text-muted-foreground">2025</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Clock className="h-5 w-5 text-primary" />
                                <div>
                                    <p className="font-medium">{meetup.time}</p>
                                    <p className="text-sm text-muted-foreground">Duration: ~2 hours</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-primary text-primary-foreground">
                        <CardHeader>
                            <CardTitle className="text-lg">Tips</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="list-inside list-disc space-y-2 text-sm opacity-90">
                                <li>Arrive 5 minutes early</li>
                                <li>Be open to new conversations</li>
                                <li>Order a drink to support the venue</li>
                            </ul>
                        </CardContent>
                    </Card>

                    <CancelBookingButton
                        bookingId={booking.id}
                        eventDate={meetup.date}
                        eventTime={meetup.time}
                        locationName={location?.name}
                    />
                </div>
            </div>
        </main>
    );
}

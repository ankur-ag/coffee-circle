import { auth } from "@/auth";
import { SignIn } from "@/components/auth-buttons";
import { BookingForm } from "@/components/features/booking-form";
import { getUpcomingMeetups, hasActiveBooking } from "@/lib/data";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Calendar, AlertCircle } from "lucide-react";

export const runtime = "edge";

export default async function BookPage() {
    const session = await auth();

    if (!session?.user) {
        return (
            <main className="container mx-auto max-w-3xl px-5 py-12 md:px-6 text-center">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Reserve Your Spot</h1>
                    <p className="mt-2 text-muted-foreground">Please sign in to book a meetup.</p>
                </div>
                <SignIn />
            </main>
        );
    }

    // Check if user already has an active booking
    const hasActive = await hasActiveBooking(session.user.id);

    if (hasActive) {
        return (
            <main className="container mx-auto max-w-3xl px-5 py-12 md:px-6">
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Reserve Your Spot</h1>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 flex items-start gap-4">
                    <AlertCircle className="h-6 w-6 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                        <h2 className="text-lg font-semibold text-yellow-800 mb-2">You Already Have an Active Reservation</h2>
                        <p className="text-yellow-700 mb-4">
                            You currently have an active reservation. To book a different event, please cancel your existing reservation first.
                        </p>
                        <Link href="/dashboard">
                            <Button className="bg-primary text-white hover:bg-primary/90">
                                <Calendar className="mr-2 h-4 w-4" />
                                View My Reservation
                            </Button>
                        </Link>
                    </div>
                </div>
            </main>
        );
    }

    const meetups = await getUpcomingMeetups();

    return (
        <main className="container mx-auto max-w-3xl px-5 py-12 md:px-6">
            <div className="mb-8 text-center">
                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Reserve Your Spot</h1>
                <p className="mt-2 text-muted-foreground">Choose a date and tell us your vibe.</p>
            </div>
            <BookingForm meetups={meetups} />
        </main>
    );
}

import { auth } from "@/auth";
import { SignIn } from "@/components/auth-buttons";
import { BookingForm } from "@/components/features/booking-form";
import { getUpcomingMeetups } from "@/lib/data";

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

import { LogIn, Calendar, MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const steps = [
    {
        icon: LogIn,
        title: "1. Sign In",
        description: "Sign in with Google to create your account. Set your language preference for Saturday (Chinese) or Sunday (English) meetups.",
    },
    {
        icon: Calendar,
        title: "2. Book Your Spot",
        description: "Choose an upcoming event date that matches your language preference. Groups are limited to 6 people, and you can bring a +1.",
    },
    {
        icon: MapPin,
        title: "3. Meet & Connect",
        description: "The location is revealed 2 days before the event. You'll receive a reminder email, then meet your group at the curated cafe!",
    },
];

export function HowItWorks() {
    return (
        <section id="how-it-works" className="container mx-auto px-5 py-24 md:px-6">
            <div className="mb-12 text-center">
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">How it Works</h2>
                <p className="mt-4 text-lg text-muted-foreground">Simple steps to your next great conversation.</p>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
                {steps.map((step, index) => (
                    <Card key={index} className="relative overflow-hidden border-none bg-secondary/30 shadow-none transition-all hover:bg-secondary/50">
                        <CardHeader>
                            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                                <step.icon className="h-6 w-6" />
                            </div>
                            <CardTitle>{step.title}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">{step.description}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </section>
    );
}

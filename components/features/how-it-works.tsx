import { Clock, Coffee, MessageSquare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const steps = [
    {
        icon: Clock,
        title: "1. Pick a time",
        description: "Choose Saturday or Sunday at 2:00 PM. That’s it. No planning, no coordination.",
    },
    {
        icon: Coffee,
        title: "2. We set the table",
        description: "You’ll be placed with 4–6 people at a nearby café. We’ll share the café details before you meet.",
    },
    {
        icon: MessageSquare,
        title: "3. Show up and connect",
        description: "Grab a coffee, sit down, and enjoy easy conversation. Stay as long as you like.",
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

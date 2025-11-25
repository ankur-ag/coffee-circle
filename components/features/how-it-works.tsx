import { Coffee, Users, MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const steps = [
    {
        icon: Users,
        title: "1. Sign Up",
        description: "Create your profile and tell us your coffee preferences.",
    },
    {
        icon: Coffee,
        title: "2. Get Matched",
        description: "We curate a group of 4-6 people for you to meet.",
    },
    {
        icon: MapPin,
        title: "3. Meet Up",
        description: "Receive the location on Saturday morning and enjoy!",
    },
];

export function HowItWorks() {
    return (
        <section className="container mx-auto px-4 py-24 md:px-6">
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

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ScrollToSection } from "./scroll-to-section";

export function Hero() {
    return (
        <section className="relative flex min-h-[80vh] flex-col items-center justify-center overflow-hidden bg-background px-5 py-24 text-center md:px-6">
            <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/10 via-background to-background opacity-50" />

            <div className="container mx-auto flex max-w-4xl flex-col items-center gap-6">
                <div className="inline-flex items-center rounded-full border bg-background/50 px-3 py-1 text-sm font-medium backdrop-blur-sm">
                    <span className="mr-2 h-2 w-2 rounded-full bg-primary animate-pulse" />
                    Now live in Taipei
                </div>

                <h1 className="text-5xl font-bold tracking-tight sm:text-6xl md:text-7xl lg:text-8xl">
                    Connect over <span className="text-primary">Coffee</span>
                </h1>

                <p className="max-w-2xl text-lg text-muted-foreground sm:text-xl">
                    Join curated weekly coffee meetups in Taipei. Every Saturday and Sunday at 2pm.
                    Meet new people, discover hidden cafes, and enjoy great conversation.
                </p>

                <div className="flex flex-col gap-4 sm:flex-row sm:gap-6">
                    <Button size="lg" className="h-12 px-8 text-base" asChild>
                        <Link href="/book">
                            Join the Circle
                        </Link>
                    </Button>
                    <ScrollToSection
                        href="#how-it-works"
                        variant="outline"
                        size="lg"
                        className="h-12 px-8 text-base"
                    >
                        How it works
                    </ScrollToSection>
                </div>
            </div>

            {/* Decorative elements */}
            <div className="absolute -bottom-32 left-1/2 h-64 w-[120%] -translate-x-1/2 rounded-[100%] bg-gradient-to-t from-primary/5 to-transparent blur-3xl" />
        </section>
    );
}

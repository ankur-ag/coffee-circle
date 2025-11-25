import { Hero } from "@/components/features/hero";
import { HowItWorks } from "@/components/features/how-it-works";

export const runtime = "edge";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col">
      <Hero />
      <HowItWorks />
    </main>
  );
}

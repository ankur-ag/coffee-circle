import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import { Header } from "@/components/layout/header";
import { AuthProvider } from "@/components/auth-provider";

export const runtime = "edge";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "CoffeeCircle",
  description: "Connect with coffee lovers in Taipei",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${outfit.variable} antialiased`}
        suppressHydrationWarning
      >
        <AuthProvider>
          <Header />
          {children}
        </AuthProvider>
        <SpeedInsights />
      </body>
    </html>
  );
}

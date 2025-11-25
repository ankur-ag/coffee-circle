import type { Metadata } from "next";
import { Outfit } from "next/font/google";
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
    <html lang="en" >
      <body
        className={`${outfit.variable} antialiased`} // body class changed, inter.variable removed
      >
        <AuthProvider>
          <Header />
          {children}
        </AuthProvider>
      </body>
    </html >
  );
}

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Coffee } from "lucide-react";
import { auth } from "@/auth";
import { SignIn, SignOut } from "../auth-buttons";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export async function Header() {
    const session = await auth();

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto flex h-16 items-center justify-between">
                <Link href="/" className="flex items-center gap-2 font-bold text-xl">
                    <Coffee className="h-6 w-6 text-primary" />
                    <span>CoffeeCircle</span>
                </Link>
                <nav className="flex items-center gap-4">
                    {session?.user ? (
                        <div className="flex items-center gap-4">
                            <Link href="/dashboard">
                                <Button variant="ghost">Dashboard</Button>
                            </Link>
                            <Link href="/profile">
                                <Button variant="ghost">Profile</Button>
                            </Link>
                            <div className="flex items-center gap-2">
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={session.user.image || ""} alt={session.user.name || ""} />
                                    <AvatarFallback>{session.user.name?.[0]}</AvatarFallback>
                                </Avatar>
                                <span className="text-sm font-medium hidden sm:inline-block">
                                    {session.user.name}
                                </span>
                            </div>
                            <SignOut />
                        </div>
                    ) : (
                        <SignIn />
                    )}
                </nav>
            </div>
        </header>
    );
}

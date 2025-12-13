import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Coffee } from "lucide-react";
import { auth } from "@/auth";
import { SignIn } from "../auth-buttons";
import { AccountDropdown } from "../account-dropdown";

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
                            {session.user.role === "admin" && (
                                <Link href="/admin">
                                    <Button variant="ghost">Admin</Button>
                                </Link>
                            )}
                            <AccountDropdown
                                userName={session.user.name}
                                userImage={session.user.image}
                                userInitial={session.user.name?.[0]}
                            />
                        </div>
                    ) : (
                        <SignIn />
                    )}
                </nav>
            </div>
        </header>
    );
}

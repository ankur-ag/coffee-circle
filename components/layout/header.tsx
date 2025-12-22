import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Coffee } from "lucide-react";
import { auth } from "@/auth";
import { SignIn } from "../auth-buttons";
import { AccountDropdown } from "../account-dropdown";

export async function Header() {
    const session = await auth();

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 overflow-hidden">
            <div className="container mx-auto flex h-16 items-center justify-between px-5 md:px-6 min-w-0 relative">
                <Link href="/" className="flex items-center gap-2 font-bold text-xl flex-shrink-0 min-w-0">
                    <Coffee className="h-6 w-6 text-primary flex-shrink-0" />
                    <span className="truncate">CoffeeCircle</span>
                </Link>
                <nav className="flex items-center gap-2 md:gap-4 flex-shrink-0 relative">
                    {session?.user ? (
                        <div className="flex items-center gap-2 md:gap-4">
                            <Link href="/dashboard" className="hidden sm:inline-block">
                                <Button variant="ghost" size="sm" className="hidden sm:flex">Dashboard</Button>
                            </Link>
                            {session.user.role === "admin" && (
                                <Link href="/admin" className="hidden sm:inline-block">
                                    <Button variant="ghost" size="sm" className="hidden sm:flex">Admin</Button>
                                </Link>
                            )}
                            <div className="relative">
                                <AccountDropdown
                                    userName={session.user.name}
                                    userImage={session.user.image}
                                    userInitial={session.user.name?.[0]}
                                    userRole={session.user.role}
                                />
                            </div>
                        </div>
                    ) : (
                        <SignIn />
                    )}
                </nav>
            </div>
        </header>
    );
}

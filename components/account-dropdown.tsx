"use client";

import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { User, History, LogOut, LayoutDashboard, Shield } from "lucide-react";
import { signOut } from "next-auth/react";

interface AccountDropdownProps {
    userName: string | null | undefined;
    userImage: string | null | undefined;
    userInitial: string | undefined;
    userRole?: string | null;
}

export function AccountDropdown({ userName, userImage, userInitial, userRole }: AccountDropdownProps) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 hover:opacity-80 transition-opacity focus:outline-none flex-shrink-0 relative z-10">
                    <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarImage src={userImage || ""} alt={userName || ""} />
                        <AvatarFallback>{userInitial}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium hidden sm:inline-block">
                        {userName}
                    </span>
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56" sideOffset={8}>
                <DropdownMenuItem asChild className="sm:hidden">
                    <Link href="/dashboard" className="flex items-center gap-2 cursor-pointer">
                        <LayoutDashboard className="h-4 w-4" />
                        <span>Dashboard</span>
                    </Link>
                </DropdownMenuItem>
                {userRole === "admin" && (
                    <DropdownMenuItem asChild className="sm:hidden">
                        <Link href="/admin" className="flex items-center gap-2 cursor-pointer">
                            <Shield className="h-4 w-4" />
                            <span>Admin</span>
                        </Link>
                    </DropdownMenuItem>
                )}
                <DropdownMenuSeparator className="sm:hidden" />
                <DropdownMenuItem asChild>
                    <Link href="/profile" className="flex items-center gap-2 cursor-pointer">
                        <User className="h-4 w-4" />
                        <span>Profile</span>
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Link href="/past-events" className="flex items-center gap-2 cursor-pointer">
                        <History className="h-4 w-4" />
                        <span>Past Events</span>
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    onClick={() => signOut()}
                    className="flex items-center gap-2 cursor-pointer text-red-600 focus:text-red-600"
                >
                    <LogOut className="h-4 w-4" />
                    <span>Sign Out</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}



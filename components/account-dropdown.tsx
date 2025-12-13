"use client";

import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, History, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

interface AccountDropdownProps {
    userName: string | null | undefined;
    userImage: string | null | undefined;
    userInitial: string | undefined;
}

export function AccountDropdown({ userName, userImage, userInitial }: AccountDropdownProps) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 hover:opacity-80 transition-opacity focus:outline-none">
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={userImage || ""} alt={userName || ""} />
                        <AvatarFallback>{userInitial}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium hidden sm:inline-block">
                        {userName}
                    </span>
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
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

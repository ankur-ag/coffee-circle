"use client";

import { signIn, signOut } from "next-auth/react";
import { Button } from "./ui/button";

export function SignIn() {
    return (
        <Button
            onClick={() => signIn("google")}
            variant="outline"
            size="sm"
            className="text-xs sm:text-sm"
        >
            <span className="hidden sm:inline">Sign in with Google</span>
            <span className="sm:hidden">Sign In</span>
        </Button>
    );
}

export function SignOut() {
    return (
        <Button
            onClick={() => signOut()}
            variant="ghost"
        >
            Sign Out
        </Button>
    );
}

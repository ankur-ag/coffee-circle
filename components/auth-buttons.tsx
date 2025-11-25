"use client";

import { signIn, signOut } from "next-auth/react";
import { Button } from "./ui/button";

export function SignIn() {
    return (
        <Button
            onClick={() => signIn("google")}
            variant="outline"
        >
            Sign in with Google
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

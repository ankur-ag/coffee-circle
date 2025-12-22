import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { getDb } from "@/lib/db";
import { accounts, sessions, users, verificationTokens } from "@/lib/schema";



export const { handlers, auth, signIn, signOut } = NextAuth({
    adapter: DrizzleAdapter(getDb(), {
        usersTable: users,
        accountsTable: accounts,
        sessionsTable: sessions,
        verificationTokensTable: verificationTokens,
    }),
    providers: [Google],
    secret: process.env.AUTH_SECRET,
    trustHost: true, // Required for Cloudflare/Next.js behind proxy
    debug: true, // Enable NextAuth debug logs
    session: {
        strategy: "database",
        maxAge: 30 * 24 * 60 * 60, // 30 days in seconds (1 month)
    },
    callbacks: {
        async session({ session, user }) {
            if (session.user) {
                session.user.id = user.id;
                session.user.role = (user as any).role || "user";
            }
            return session;
        },
    },
});

console.log("Auth Secret status:", process.env.AUTH_SECRET ? "Present" : "Missing");

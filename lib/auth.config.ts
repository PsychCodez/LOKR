import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

export const authConfig = {
    providers: [
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        }),
    ],
    // IMPORTANT: NextAuth v5 needs this when deployed to Vercel
    trustHost: true,
    callbacks: {
        async authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const isPublicRoute = ["/", "/api/auth"].some(
                (route) => nextUrl.pathname === route || nextUrl.pathname.startsWith(route + "/")
            );

            if (isPublicRoute) {
                return true;
            }

            return isLoggedIn;
        },
        async signIn({ user }) {
            // Debugging environment variables in Vercel (Masked)
            console.log("--- Auth Configuration Debug ---");
            console.log("GOOGLE_CLIENT_ID exists:", !!process.env.GOOGLE_CLIENT_ID);
            console.log("GOOGLE_CLIENT_SECRET exists:", !!process.env.GOOGLE_CLIENT_SECRET);
            console.log("AUTH_SECRET exists:", !!process.env.AUTH_SECRET);
            console.log("DATABASE_URL exists:", !!process.env.DATABASE_URL);
            console.log("ALLOWED_EMAILS exists:", !!process.env.ALLOWED_EMAILS);

            const emails = process.env.ALLOWED_EMAILS;
            if (!emails) {
                console.error("❌ SIGN-IN FAILED: ALLOWED_EMAILS environment variable is missing.");
                return false;
            }

            const allowedEmails = emails
                .split(",")
                .map((e) => e.trim().toLowerCase())
                .filter(Boolean);

            const userEmail = user.email?.toLowerCase();
            const isAllowed = !!(userEmail && allowedEmails.includes(userEmail));

            if (!isAllowed) {
                console.error(`❌ SIGN-IN BLOCKED: Email "${userEmail}" is not in the allowlist.`);
            }

            return isAllowed;
        },
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user && token.id) {
                session.user.id = token.id as string;
            }
            return session;
        },
    },
    pages: {
        signIn: "/",
        error: "/",
    },
    session: {
        strategy: "jwt",
    },
} satisfies NextAuthConfig;

import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

export const authConfig = {
    providers: [
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
    ],
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
            const emails = process.env.ALLOWED_EMAILS;
            if (!emails) return false;

            const allowedEmails = emails
                .split(",")
                .map((e) => e.trim().toLowerCase())
                .filter(Boolean);

            const email = user.email?.toLowerCase();
            return !!(email && allowedEmails.includes(email));
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

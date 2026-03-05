import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

function getAllowedEmails(): string[] {
    const emails = process.env.ALLOWED_EMAILS;
    if (!emails) return [];
    return emails
        .split(",")
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean);
}

export const { handlers, auth, signIn, signOut } = NextAuth({
    adapter: PrismaAdapter(prisma),
    providers: [
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
    ],
    callbacks: {
        async signIn({ user }) {
            const allowedEmails = getAllowedEmails();
            if (allowedEmails.length === 0) {
                // If no allowlist configured, deny all (fail-safe)
                return false;
            }
            const email = user.email?.toLowerCase();
            if (!email || !allowedEmails.includes(email)) {
                return false;
            }
            return true;
        },
        async jwt({ token, user }) {
            // On initial sign-in, persist user id into the JWT
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
});

import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
    const { pathname } = req.nextUrl;

    // Public routes
    const publicRoutes = ["/", "/api/auth"];
    const isPublicRoute = publicRoutes.some(
        (route) => pathname === route || pathname.startsWith(route + "/")
    );

    if (isPublicRoute) {
        return NextResponse.next();
    }

    // Protect all other routes
    if (!req.auth) {
        const signInUrl = new URL("/", req.url);
        return NextResponse.redirect(signInUrl);
    }

    return NextResponse.next();
});

export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

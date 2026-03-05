"use client";

import { useSession, signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, Suspense } from "react";

function HomeContent() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const searchParams = useSearchParams();
    const error = searchParams.get("error");

    useEffect(() => {
        if (status === "authenticated") {
            router.push("/dashboard");
        }
    }, [status, router]);

    if (status === "loading") {
        return (
            <div className="landing-page">
                <div className="loading-spinner">
                    <div className="spinner" />
                </div>
            </div>
        );
    }

    return (
        <div className="landing-page">
            <div className="landing-logo">
                <img src="/lokr-logo.png" alt="LOKR" className="lock-icon-img" />
                <h1 className="landing-title">LOKR</h1>
            </div>
            <p className="landing-subtitle">
                AES-256-GCM encrypted password vault with tag-based organization.
                <br />
                Your secrets, locked down tight.
            </p>
            {error && (
                <div className="auth-error" style={{
                    color: "#ff6b6b",
                    background: "rgba(255, 107, 107, 0.1)",
                    border: "1px solid rgba(255, 107, 107, 0.3)",
                    borderRadius: "8px",
                    padding: "12px 20px",
                    marginBottom: "16px",
                    fontFamily: "monospace",
                    fontSize: "0.85rem",
                    maxWidth: "400px",
                    textAlign: "center",
                }}>
                    {error === "AccessDenied"
                        ? "⛔ Access denied — your email is not on the allowed list."
                        : `⚠️ Authentication error: ${error}`}
                </div>
            )}
            <button className="login-btn" onClick={() => signIn("google")}>
                <svg viewBox="0 0 24 24" fill="none">
                    <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                        fill="#4285F4"
                    />
                    <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                    />
                    <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                    />
                    <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                    />
                </svg>
                Sign in with Google
            </button>
        </div>
    );
}

export default function Home() {
    return (
        <Suspense
            fallback={
                <div className="landing-page">
                    <div className="loading-spinner">
                        <div className="spinner" />
                    </div>
                </div>
            }
        >
            <HomeContent />
        </Suspense>
    );
}

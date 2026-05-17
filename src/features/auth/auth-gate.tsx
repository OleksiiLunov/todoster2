"use client"

import Link from "next/link";
import type { ReactNode } from "react";

import { useAuth } from "./use-auth"

type AuthGateProps = { children: ReactNode };

export default function AuthGate({ children }: AuthGateProps) {
    const auth = useAuth();

    if (auth.isLoadingAuth) {
        return (
            <main className="flex min-h-screen items-center justify-center px-6">
                <p className="text-sm font-medium text-zinc-500">Loading...</p>
            </main>
        )
    }

    if (auth.currentUser === null) {
        return (
            <main className="flex min-h-screen items-center justify-center px-6 py-12">
                <section className="w-full max-w-md rounded-md border border-zinc-200 bg-white p-6 text-center shadow-sm">
                    <h1 className="text-2xl font-semibold leading-8 text-zinc-950">
                        You're not logged in. please proceed to one of the following pages.
                    </h1>
                    <div className="mt-6 grid gap-3 sm:grid-cols-2">
                        <Link
                            className="rounded-md bg-zinc-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800"
                            href="/login"
                        >
                            Login page
                        </Link>
                        <Link
                            className="rounded-md border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50"
                            href="/signup"
                        >
                            Signup page
                        </Link>
                    </div>
                </section>
            </main>
        )
    }

    return children;
}

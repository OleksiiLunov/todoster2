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
                <p className="text-sm font-medium text-[#7b694f]">Loading...</p>
            </main>
        )
    }

    if (auth.currentUser === null) {
        return (
            <main className="flex min-h-screen items-center justify-center px-6 py-12">
                <section className="w-full max-w-md rounded-md border border-[#e6dccb] bg-[#fffdf7] p-6 text-center shadow-sm shadow-[#7c4a24]/5">
                    <h1 className="text-2xl font-semibold leading-8 text-[#173f2a]">
                        You're not logged in. please proceed to one of the following pages.
                    </h1>
                    <div className="mt-6 grid gap-3 sm:grid-cols-2">
                        <Link
                            className="rounded-md bg-[#173f2a] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#225a3d]"
                            href="/login"
                        >
                            Login page
                        </Link>
                        <Link
                            className="rounded-md border border-[#d7c8b3] bg-white px-4 py-2.5 text-sm font-medium text-[#4d3a22] transition hover:bg-[#f7efd9]"
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

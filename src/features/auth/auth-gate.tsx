"use client"

import { useAuth } from "./use-auth"
import Link from 'next/link';
import type { ReactNode } from "react";

type AuthGateProps = { children: ReactNode };

export default function AuthGate({ children }: AuthGateProps) {
    const auth = useAuth();

    if (auth.isLoadingAuth) {
        return (
            <div><h1>Loading</h1></div>
        )
    }
    if (auth.currentUser === null) {
        return (
            <h1>
                <Link
                    href="/login">Login page
                </Link>
                <Link
                    href="/signup">Signup page
                </Link>
            </h1>
        )
    }
    return children;

}
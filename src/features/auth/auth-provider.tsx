"use client"

import type { ReactNode } from "react";
import { useState, useEffect, createContext, useRef } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/auth-service";
import {subscribeToAuthChanges} from "@/lib/auth/auth-listener";
import { clearTodoBrowserLocalState } from "@/lib/todos/browser-local-state";

import type { User } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/auth/browser-client";

type AuthProviderProps = { children: ReactNode };
type AuthContextValue = {currentUser: User | null, isLoadingAuth:boolean };

export const AuthContext = createContext<AuthContextValue| null>(null);

export function AuthProvider({ children }: AuthProviderProps) {
    const router = useRouter();
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isLoadingAuth, setIsLoadingAuth] = useState<boolean>(true);
    const currentUserIdRef = useRef<string | null>(null);
    const hasResolvedInitialAuthRef = useRef(false);

    useEffect(() => {
        function applyAuthUser(nextUser: User | null) {
            const nextUserId = nextUser?.id ?? null;

            setCurrentUser(nextUser);

            if (!hasResolvedInitialAuthRef.current) {
                currentUserIdRef.current = nextUserId;
                hasResolvedInitialAuthRef.current = true;
                setIsLoadingAuth(false);
                return;
            }

            const previousUserId = currentUserIdRef.current;

            if (previousUserId !== nextUserId) {
                if (previousUserId !== null) {
                    clearTodoBrowserLocalState();
                }

                currentUserIdRef.current = nextUserId;
                router.refresh();
            }
        }

        async function asyncGetUser() {
            const curUser = await getCurrentUser();
            applyAuthUser(curUser);
        }

        asyncGetUser();
        const unsubscribe = subscribeToAuthChanges(getSupabaseBrowserClient(), applyAuthUser);
        return unsubscribe;
    }, [router])
    
    
    return (
        <AuthContext value={{currentUser, isLoadingAuth}}>           
         {children}           
        </AuthContext>
    );
}

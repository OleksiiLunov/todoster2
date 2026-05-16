"use client"

import type { ReactNode } from "react";
import { useState, useEffect, createContext } from "react";
import { getCurrentUser } from "@/lib/auth/auth-service";
import {subscribeToAuthChanges} from "@/lib/auth/auth-listener";

import type { User } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/auth/browser-client";

type AuthProviderProps = { children: ReactNode };
type AuthContextValue = {currentUser: User | null, isLoadingAuth:boolean };

export const AuthContext = createContext<AuthContextValue| null>(null);

export function AuthProvider({ children }: AuthProviderProps) {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isLoadingAuth, setIsLoadingAuth] = useState<boolean>(true);
    useEffect(() => {
        async function asyncGetUser() {
            const curUser = await getCurrentUser().finally(() => setIsLoadingAuth(false));
            setCurrentUser(curUser);
        }
        asyncGetUser();
        const unsubscribe = subscribeToAuthChanges(getSupabaseBrowserClient(), setCurrentUser);        
        return unsubscribe;
    }, [])
    
    
    return (
        <AuthContext value={{currentUser, isLoadingAuth}}>           
         {children}           
        </AuthContext>
    );
}
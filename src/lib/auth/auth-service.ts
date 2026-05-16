import { getSupabaseBrowserClient } from "./browser-client";
import type { User } from "@supabase/supabase-js";


export async function signUpWithEmail(email: string, password: string, name: string): Promise<{ ok: boolean, error?: string }> {
    const supabaseBrowserClient = getSupabaseBrowserClient();

    const { error } = await supabaseBrowserClient.auth.signUp({
        email,
        password,
        options: {
            data: {
                name,
            },
        },
    })

    if (error) {
        return { ok: false, error: error.message }
    }

    return { ok: true };
}

export async function signInWithEmail(email: string, password: string): Promise<{ ok: boolean, error?: string }> {
    const supabaseBrowserClient = getSupabaseBrowserClient();

    const { error } = await supabaseBrowserClient.auth.signInWithPassword({
        email,
        password,
    })

    if (error) {
        return { ok: false, error: error.message }
    }

    return { ok: true };
}

export async function signOut(): Promise<{ ok: boolean, error?: string }> {
    const supabaseBrowserClient = getSupabaseBrowserClient();

    const { error } = await supabaseBrowserClient.auth.signOut();

    if (error) {
        return { ok: false, error: error.message }
    }

    return { ok: true };
}



export async function getCurrentUser(): Promise<User| null> {
    const supabaseBrowserClient = getSupabaseBrowserClient();

    const { data: { user } } = await supabaseBrowserClient.auth.getUser();

    if (!user) {
        return null;
    }

    return user;
}
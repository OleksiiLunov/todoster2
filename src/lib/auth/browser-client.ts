"use client";

import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

let supabaseBrowserClient:SupabaseClient | null = null;

export function getSupabaseBrowserClient() {
    if (!supabaseBrowserClient) {
        supabaseBrowserClient = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
        );
    }

    return supabaseBrowserClient;
}

// async function signUpNewUser(email: string, password: string, name: string) {
//   const { data, error } = await supabase.auth.signUp({
//     email: email,
//     password: password,
//     options: {
//       data: {
//         name: name,
//       },
//     },
//   })
// }

// async function signInWithEmail(email: string, password: string) {
//   const { data, error } = await supabase.auth.signInWithPassword({
//     email: email,
//     password: password,
//   })
// }

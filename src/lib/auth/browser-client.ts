"use client";

//import { createClient } from "@supabase/supabase-js";
//import type { SupabaseClient } from "@supabase/supabase-js";

import {createBrowserClient } from "@supabase/ssr";



export function getSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )
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

import type { SupabaseClient, User } from "@supabase/supabase-js";

export function subscribeToAuthChanges(
  supabaseClient: SupabaseClient,
  onUserChange: (user: User | null) => void,
) {
  const { data } = supabaseClient.auth.onAuthStateChange(
    (_event, session) => {
      onUserChange(session?.user ?? null);
    },
  );

  return () => {
    data.subscription.unsubscribe();
  };
}
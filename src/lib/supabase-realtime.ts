import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseRealtimeConfigured = Boolean(supabaseUrl && supabaseKey);

let realtimeClient: ReturnType<typeof createClient> | null = null;

export function getSupabaseRealtimeClient() {
  if (!isSupabaseRealtimeConfigured) return null;
  realtimeClient ??= createClient(supabaseUrl!, supabaseKey!, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    realtime: { params: { eventsPerSecond: 10 } },
  });
  return realtimeClient;
}

import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  // Fails loudly at build/run time instead of silently breaking every
  // data call — easier to diagnose than a wall of network errors.
  console.error(
    "Missing Supabase env vars. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY " +
      "in a .env file (local) or in your host's Environment Variables settings (Vercel/Netlify)."
  );
}

export const supabase = createClient(url, anonKey);

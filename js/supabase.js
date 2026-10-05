// Supabase client for the Anmol Gawale portfolio
// IMPORTANT: Use only the Supabase Publishable key here.
// NEVER put a Supabase Secret / service_role key in browser code.

const SUPABASE_URL = "https://yzxilbadpkatirspoksv.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_wKbs9hiEb530D_GEo6ll5Q_7yDUIiKD";

if (!window.supabase || typeof window.supabase.createClient !== "function") {
    console.error("Supabase library failed to load.");
} else {
    window.supabaseClient = window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_PUBLISHABLE_KEY
    );
}

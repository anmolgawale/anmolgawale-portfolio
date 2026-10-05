const SUPABASE_URL = "https://yzxilbadpkatirspoksv.supabase.co/rest/v1/";

const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_wKbs9hiEb530D_GEo6ll5Q_7yDUIiKD";



const { createClient } = supabase;



const supabaseClient = createClient(

    SUPABASE_URL,

    SUPABASE_PUBLISHABLE_KEY

);
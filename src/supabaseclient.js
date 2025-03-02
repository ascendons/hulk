import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.PUBLIC_SUPABASE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;
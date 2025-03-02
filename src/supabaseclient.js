import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_PUBLIC_SUPABASE_KEY;


// console.log("Supabase URL:", supabaseUrl);
// console.log("Supabase Key:", supabaseKey);

const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;


// REACT_APP_PUBLIC_SUPABASE_URL=https://zwhghrbteuilgntrcrjr.supabase.co/storage/v1/s3
// REACT_APP_PUBLIC_SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3aGdocmJ0ZXVpbGdudHJjcmpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA1OTI3MjIsImV4cCI6MjA1NjE2ODcyMn0.2qGY82rbJnbhLELjL_QArHUsxsPv-b8Y8yVaY7bpCjo

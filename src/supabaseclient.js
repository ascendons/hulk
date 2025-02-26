import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zwhghrbteuilgntrcrjr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3aGdocmJ0ZXVpbGdudHJjcmpyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MDU5MjcyMiwiZXhwIjoyMDU2MTY4NzIyfQ.0NNfE6vNLZ3gmASbzG8LJIgTdv9-MOUJrck76JwLjLA';
const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;


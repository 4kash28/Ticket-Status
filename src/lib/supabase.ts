import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://pysiouplltrlxlmreood.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB5c2lvdXBsbHRybHhsbXJlb29kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2NjUwMDUsImV4cCI6MjA5MDI0MTAwNX0.rU8B23G984YCmhkv2V0XJtrIbht8OgKEqElVAF9byX0';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

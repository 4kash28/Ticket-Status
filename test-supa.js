import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pysiouplltrlxlmreood.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB5c2lvdXBsbHRybHhsbXJlb29kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2NjUwMDUsImV4cCI6MjA5MDI0MTAwNX0.rU8B23G984YCmhkv2V0XJtrIbht8OgKEqElVAF9byX0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  const { data, error } = await supabase.from('resolved_tickets').select('*').limit(1);
  console.log('resolved_tickets:', error ? error.message : 'exists');
  
  const { data: d2, error: e2 } = await supabase.from('tickets').select('status').limit(1);
  console.log('tickets.status:', e2 ? e2.message : 'exists');
}
test();

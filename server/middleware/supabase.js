import { createClient } from '@supabase/supabase-js';

// Anon role; respects RLS policies. Routes that need to read protected
// tables (e.g. /api/admin/runs) create their own service-key client.
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default supabase;

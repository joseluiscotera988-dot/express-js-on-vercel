import { createClient } from '@supabase/supabase-js';
import config from '../config/master';

if (!config.supabaseUrl || !config.supabaseKey) {
  console.warn('Atención: SUPABASE_URL o SUPABASE_KEY no están configuradas.');
}

export const supabase = createClient(
  config.supabaseUrl,
  config.supabaseKey
);

export default supabase;


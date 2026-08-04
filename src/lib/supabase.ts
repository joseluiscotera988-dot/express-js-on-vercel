// @ts-nocheck
import { createClient } from '@supabase/supabase-js';
import config from '../config/master';

const supabaseUrl = config.supabaseUrl || 'https://placeholder.supabase.co';
const supabaseKey = config.supabaseKey || 'placeholder';

const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;

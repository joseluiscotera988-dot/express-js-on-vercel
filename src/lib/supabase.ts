// @ts-nocheck
import { createClient } from '@supabase/supabase-js';
import config from './master';

const getValidUrl = (url: string) => {
  if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
    return url;
  }
  return 'https://placeholder-project.supabase.co';
};

const getValidKey = (key: string) => {
  return key && key.length > 0 ? key : 'placeholder-key';
};

export const supabase = createClient(
  getValidUrl(config.supabaseUrl),
  getValidKey(config.supabaseKey)
);

export default supabase;
                     

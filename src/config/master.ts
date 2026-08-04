// @ts-nocheck
export const MASTER_CONFIG = {
  appName: 'Express Vercel App',
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 3000,
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseKey: process.env.SUPABASE_KEY || ''
};

const config = MASTER_CONFIG;

export default config;

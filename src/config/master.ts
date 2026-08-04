export const config = {
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 3000,
  appName: process.env.APP_NAME || 'Express Vercel App',
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseKey: process.env.SUPABASE_KEY || '',
};

export default config;

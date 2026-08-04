// @ts-nocheck
export const MASTER_CONFIG: any = {
  appName: 'Express Vercel App',
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 3000,
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseKey: process.env.SUPABASE_KEY || '',
  commissionRate: Number(process.env.COMMISSION_RATE) || 0.05,
  cbu: process.env.CBU || '0000000000000000000000',
  mpAccessToken: process.env.MP_ACCESS_TOKEN || ''
};

const config: any = MASTER_CONFIG;

export default config;

// packages/db/index.ts
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types/supabase';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient<Database>(supabaseUrl, supabaseKey);

export type Tables = Database['public']['Tables'];
export type Profile = Tables['profiles']['Row'];
export type Wallet = Tables['wallets']['Row'];
export type Item = Tables['items']['Row'];
export type Inventory = Tables['inventory']['Row'];
export type Match = Tables['matches']['Row'];
export type Guild = Tables['guilds']['Row'];
export type Trade = Tables['trades']['Row'];

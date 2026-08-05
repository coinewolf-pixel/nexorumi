// =====================================================
// SUPABASE SERVICE
// =====================================================

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Env } from '../types';

let supabase: SupabaseClient | null = null;

export function getSupabase(env: Env): SupabaseClient {
  if (!supabase) {
    supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  return supabase;
}

export async function getUserById(env: Env, userId: string) {
  const sb = getSupabase(env);
  const { data, error } = await sb
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data;
}

export async function getWallet(env: Env, userId: string) {
  const sb = getSupabase(env);
  const { data, error } = await sb
    .from('wallets')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) throw error;
  return data;
}

export async function updateWalletBalance(env: Env, userId: string, amount: number, type: string) {
  const sb = getSupabase(env);

  const { data: wallet } = await sb
    .from('wallets')
    .select('nexo_balance')
    .eq('user_id', userId)
    .single();

  const newBalance = (wallet?.nexo_balance || 0) + amount;

  const { error } = await sb
    .from('wallets')
    .update({ nexo_balance: newBalance, updated_at: new Date().toISOString() })
    .eq('user_id', userId);

  if (error) throw error;

  // Record transaction
  await sb.from('transactions').insert({
    user_id: userId,
    type,
    amount,
    balance_after: newBalance,
    status: 'completed',
  });

  return newBalance;
}

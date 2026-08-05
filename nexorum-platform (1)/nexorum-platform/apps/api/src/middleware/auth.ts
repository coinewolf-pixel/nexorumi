// =====================================================
// AUTH MIDDLEWARE
// =====================================================

import { Context, Next } from 'hono';
import { jwtVerify, SignJWT } from 'jose';
import type { Env, User } from '../types';
import { getSupabase } from '../services/supabase';

const SECRET = new TextEncoder().encode('your-jwt-secret-min-32-chars-long!!');

export async function generateToken(userId: string, email: string): Promise<string> {
  return new SignJWT({ sub: userId, email })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(SECRET);
}

export async function verifyToken(token: string): Promise<{ sub: string; email: string }> {
  const { payload } = await jwtVerify(token, SECRET, { clockTolerance: 60 });
  return payload as { sub: string; email: string };
}

export async function authMiddleware(c: Context<{ Bindings: Env }>, next: Next) {
  const authHeader = c.req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized - No token provided' }, 401);
  }

  const token = authHeader.slice(7);

  try {
    const payload = await verifyToken(token);
    const sb = getSupabase(c.env);

    const { data: profile, error } = await sb
      .from('profiles')
      .select('*')
      .eq('id', payload.sub)
      .single();

    if (error || !profile) {
      return c.json({ error: 'User not found' }, 401);
    }

    c.set('user', profile as User);
    await next();
  } catch (err) {
    return c.json({ error: 'Invalid token' }, 401);
  }
}

export function getUser(c: Context): User {
  return c.get('user') as User;
}

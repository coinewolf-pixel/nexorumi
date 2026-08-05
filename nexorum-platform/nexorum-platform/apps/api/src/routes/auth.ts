// =====================================================
// AUTH ROUTES
// =====================================================

import { Hono } from 'hono';
import type { Env } from '../types';
import { getSupabase } from '../services/supabase';
import { generateToken } from '../middleware/auth';

const auth = new Hono<{ Bindings: Env }>();

// Register
auth.post('/register', async (c) => {
  const { email, password, username } = await c.req.json();
  const sb = getSupabase(c.env);

  const { data: authData, error: authError } = await sb.auth.signUp({
    email,
    password,
    options: { data: { username } }
  });

  if (authError) return c.json({ error: authError.message }, 400);

  // Create profile
  if (authData.user) {
    await sb.from('profiles').insert({
      id: authData.user.id,
      username,
      display_name: username,
    });
  }

  const token = await generateToken(authData.user!.id, email);

  return c.json({
    user: authData.user,
    token,
    message: 'Registration successful'
  });
});

// Login
auth.post('/login', async (c) => {
  const { email, password } = await c.req.json();
  const sb = getSupabase(c.env);

  const { data, error } = await sb.auth.signInWithPassword({ email, password });

  if (error) return c.json({ error: error.message }, 401);

  const token = await generateToken(data.user.id, email);

  // Update last active
  await sb.from('profiles')
    .update({ last_active_at: new Date().toISOString() })
    .eq('id', data.user.id);

  return c.json({
    user: data.user,
    token,
    message: 'Login successful'
  });
});

// Refresh token
auth.post('/refresh', async (c) => {
  const { token } = await c.req.json();
  // In production, implement proper refresh logic
  return c.json({ token });
});

export default auth;

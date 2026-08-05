// =====================================================
// MATCHMAKING ROUTES (ML-Powered)
// =====================================================

import { Hono } from 'hono';
import type { Env, MatchmakingProfile } from '../types';
import { getSupabase } from '../services/supabase';
import { authMiddleware, getUser } from '../middleware/auth';
import { findBestMatch, createBalancedTeams, calculateDistance } from '../services/matchmaking';

const matchmaking = new Hono<{ Bindings: Env }>();

matchmaking.use('*', authMiddleware);

// Get matchmaking profile
matchmaking.get('/profile', async (c) => {
  const user = getUser(c);
  const sb = getSupabase(c.env);

  const { data: leaderboard } = await sb
    .from('leaderboard_entries')
    .select('*')
    .eq('user_id', user.id);

  const { data: matches } = await sb
    .from('match_players')
    .select('*')
    .eq('user_id', user.id)
    .order('joined_at', { ascending: false })
    .limit(10);

  const { data: reports } = await sb
    .from('reports')
    .select('*')
    .eq('reported_id', user.id);

  // Build ML profile
  const toxicityScore = (reports?.length || 0) * 10;
  const activityScore = matches?.length || 0;
  const lastMatch = matches?.[0]?.joined_at;

  const profile: Record<string, any> = {};
  for (const entry of leaderboard || []) {
    profile[entry.market_type] = {
      user_id: user.id,
      elo: entry.elo,
      latency: Math.random() * 100 + 20, // Simulated - replace with real latency
      playstyle: [
        entry.wins / Math.max(entry.total_matches, 1), // Aggression
        entry.total_score / Math.max(entry.total_matches, 1) / 1000, // Efficiency
        Math.random(), // Versatility (replace with real data)
      ],
      toxicity_score: Math.min(toxicityScore, 100),
      preferred_role: 'flex',
      activity_score: Math.min(activityScore * 5, 100),
      last_match_at: lastMatch,
    };
  }

  return c.json(profile);
});

// Find match
matchmaking.post('/find', async (c) => {
  const user = getUser(c);
  const { marketType, mode, maxPlayers = 10 } = await c.req.json();
  const sb = getSupabase(c.env);

  // Check for existing waiting matches
  const { data: waitingMatches } = await sb
    .from('matches')
    .select('*, players:match_players(*)')
    .eq('market_type', marketType)
    .eq('status', 'waiting')
    .eq('mode', mode)
    .lt('current_players', maxPlayers);

  if (waitingMatches && waitingMatches.length > 0) {
    // Try to find best match based on player skill
    const { data: myLeaderboard } = await sb
      .from('leaderboard_entries')
      .select('elo')
      .eq('user_id', user.id)
      .eq('market_type', marketType)
      .single();

    let bestMatch = waitingMatches[0];
    let bestDiff = Infinity;

    for (const match of waitingMatches) {
      const playerElos = match.players?.map((p: any) => p.score || 1000) || [1000];
      const avgElo = playerElos.reduce((a: number, b: number) => a + b, 0) / playerElos.length;
      const diff = Math.abs((myLeaderboard?.elo || 1000) - avgElo);

      if (diff < bestDiff) {
        bestDiff = diff;
        bestMatch = match;
      }
    }

    // Join match
    await sb.from('match_players').insert({
      match_id: bestMatch.id,
      user_id: user.id,
    });

    return c.json({ match: bestMatch, joined: true });
  }

  // Create new match
  const { data: newMatch, error } = await sb
    .from('matches')
    .insert({
      market_type: marketType,
      mode,
      max_players: maxPlayers,
      host_id: user.id,
      status: 'waiting',
    })
    .select()
    .single();

  if (error) return c.json({ error: error.message }, 500);

  // Add host as first player
  await sb.from('match_players').insert({
    match_id: newMatch.id,
    user_id: user.id,
  });

  return c.json({ match: newMatch, created: true });
});

// Get match details
matchmaking.get('/match/:id', async (c) => {
  const matchId = c.req.param('id');
  const sb = getSupabase(c.env);

  const { data, error } = await sb
    .from('matches')
    .select('*, players:match_players(*, user:profiles(username, avatar_url, platform_level))')
    .eq('id', matchId)
    .single();

  if (error) return c.json({ error: error.message }, 404);
  return c.json(data);
});

// Start match
matchmaking.post('/match/:id/start', async (c) => {
  const user = getUser(c);
  const matchId = c.req.param('id');
  const sb = getSupabase(c.env);

  const { data: match } = await sb
    .from('matches')
    .select('*')
    .eq('id', matchId)
    .single();

  if (!match) return c.json({ error: 'Match not found' }, 404);
  if (match.host_id !== user.id) return c.json({ error: 'Only host can start' }, 403);

  await sb.from('matches')
    .update({ status: 'active', started_at: new Date().toISOString() })
    .eq('id', matchId);

  return c.json({ message: 'Match started' });
});

// Submit match results
matchmaking.post('/match/:id/results', async (c) => {
  const user = getUser(c);
  const matchId = c.req.param('id');
  const { results } = await c.req.json();
  const sb = getSupabase(c.env);

  const { data: match } = await sb
    .from('matches')
    .select('*')
    .eq('id', matchId)
    .single();

  if (!match) return c.json({ error: 'Match not found' }, 404);

  // Update each player's stats
  for (const result of results) {
    await sb.from('match_players')
      .update({
        score: result.score,
        kills: result.kills,
        deaths: result.deaths,
        assists: result.assists,
        placement: result.placement,
        reward_nexo: result.rewardNexo || 0,
      })
      .eq('match_id', matchId)
      .eq('user_id', result.userId);

    // Update leaderboard
    await sb.rpc('update_elo_after_match', {
      p_user_id: result.userId,
      p_market_type: match.market_type,
      p_won: result.won,
      p_score: result.score,
    });

    // Award NEXO
    if (result.rewardNexo > 0) {
      const { data: wallet } = await sb
        .from('wallets')
        .select('nexo_balance')
        .eq('user_id', result.userId)
        .single();

      await sb.from('wallets')
        .update({ nexo_balance: (wallet?.nexo_balance || 0) + result.rewardNexo })
        .eq('user_id', result.userId);

      await sb.from('transactions').insert({
        user_id: result.userId,
        type: 'reward',
        amount: result.rewardNexo,
        reference_id: matchId,
        reference_type: 'match',
        status: 'completed',
      });
    }

    // Add platform XP
    await sb.rpc('add_platform_xp', {
      p_user_id: result.userId,
      p_xp: result.score / 10,
    });
  }

  // Mark match finished
  await sb.from('matches')
    .update({
      status: 'finished',
      ended_at: new Date().toISOString(),
      winner_id: results.find((r: any) => r.won)?.userId || null,
    })
    .eq('id', matchId);

  return c.json({ message: 'Results recorded' });
});

// ML: Find compatible teammates
matchmaking.post('/find-team', async (c) => {
  const user = getUser(c);
  const { marketType, teamSize = 5 } = await c.req.json();
  const sb = getSupabase(c.env);

  // Get online players looking for team
  const { data: onlinePlayers } = await sb
    .from('profiles')
    .select('id, username, platform_level, status')
    .eq('status', 'online')
    .neq('id', user.id)
    .limit(50);

  // Get their leaderboard stats
  const playerIds = onlinePlayers?.map((p: any) => p.id) || [];

  const { data: leaderboards } = await sb
    .from('leaderboard_entries')
    .select('*')
    .eq('market_type', marketType)
    .in('user_id', playerIds);

  // Build matchmaking profiles
  const profiles: MatchmakingProfile[] = (leaderboards || []).map((lb: any) => ({
    user_id: lb.user_id,
    elo: lb.elo,
    latency: Math.random() * 100 + 20,
    playstyle: [
      lb.wins / Math.max(lb.total_matches, 1),
      lb.total_score / Math.max(lb.total_matches, 1) / 1000,
      0.5,
    ],
    toxicity_score: 0,
    preferred_role: 'flex',
    activity_score: Math.min(lb.total_matches * 2, 100),
    last_match_at: null,
  }));

  const { teamA, teamB, quality } = createBalancedTeams(profiles, teamSize);

  return c.json({
    suggestedTeam: teamA,
    opponentTeam: teamB,
    compatibility: quality,
    message: `Team compatibility: ${(quality * 100).toFixed(1)}%`,
  });
});

export default matchmaking;

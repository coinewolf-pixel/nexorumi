// =====================================================
// AI BOT ROUTES (OpenAI Integration)
// =====================================================

import { Hono } from 'hono';
import type { Env } from '../types';
import { generateBotResponse, generateMarketAnalysis, generateNPCDialogue } from '../services/openai';
import { authMiddleware, getUser } from '../middleware/auth';

const ai = new Hono<{ Bindings: Env }>();

ai.use('*', authMiddleware);

// Chat with AI assistant
ai.post('/chat', async (c) => {
  const { message, context = [] } = await c.req.json();

  try {
    const response = await generateBotResponse(c.env, message, context);
    return c.json({ response, type: 'assistant' });
  } catch (error) {
    return c.json({ error: 'AI service unavailable', response: 'I am currently offline. Try again later.' }, 503);
  }
});

// Market analysis
ai.get('/market-analysis/:marketType', async (c) => {
  const marketType = c.req.param('marketType');

  try {
    const analysis = await generateMarketAnalysis(c.env, marketType);
    return c.json({ market: marketType, analysis });
  } catch (error) {
    return c.json({ error: 'Analysis unavailable' }, 503);
  }
});

// NPC Dialogue
ai.get('/npc/:npcName', async (c) => {
  const npcName = c.req.param('npcName');
  const user = getUser(c);

  try {
    const dialogue = await generateNPCDialogue(c.env, npcName, user.platform_level);
    return c.json({ npc: npcName, dialogue });
  } catch (error) {
    return c.json({ error: 'NPC unavailable' }, 503);
  }
});

// AI Trading Suggestions
ai.get('/trading-suggestions', async (c) => {
  const user = getUser(c);
  const sb = getSupabase(c.env);

  // Get user's inventory and recent trades
  const { data: inventory } = await sb
    .from('inventory')
    .select('*, item:items(*)')
    .eq('user_id', user.id);

  const { data: recentTrades } = await sb
    .from('trades')
    .select('*, item:items(*)')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(20);

  // Simple rule-based suggestions (replace with ML model in production)
  const suggestions = [];

  for (const item of inventory || []) {
    const marketTrades = recentTrades?.filter((t: any) => t.item_id === item.item_id);
    const avgPrice = marketTrades?.length
      ? marketTrades.reduce((s: number, t: any) => s + t.price_nexo, 0) / marketTrades.length
      : item.item.base_price;

    if (item.quantity > 1 && avgPrice > item.item.base_price * 1.2) {
      suggestions.push({
        type: 'sell',
        item: item.item.name,
        suggestedPrice: avgPrice * 0.95,
        reason: 'High demand detected',
      });
    }
  }

  const undervalued = recentTrades?.filter((t: any) => 
    t.price_nexo < t.item.base_price * 0.8
  );

  for (const trade of undervalued?.slice(0, 3) || []) {
    suggestions.push({
      type: 'buy',
      item: trade.item.name,
      price: trade.price_nexo,
      reason: 'Below market value',
    });
  }

  return c.json({ suggestions });
});

export default ai;

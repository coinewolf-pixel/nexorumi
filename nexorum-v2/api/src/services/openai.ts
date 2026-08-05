// =====================================================
// OPENAI / AI BOT SERVICE
// =====================================================

import OpenAI from 'openai';
import type { Env } from '../types';

export function getOpenAI(env: Env): OpenAI {
  return new OpenAI({ apiKey: env.OPENAI_API_KEY });
}

export async function generateBotResponse(env: Env, message: string, context: string[] = []): Promise<string> {
  const openai = getOpenAI(env);

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `You are NEXORUM AI Assistant — a gaming ecosystem bot. You help players with:
- Game strategies for Hunt, Racing, Fishing, Farm, Survival markets
- NEXO token economy and staking advice
- Item trading and market analysis
- Guild and party management tips
- Technical support

Be concise, enthusiastic, and use gaming terminology. Max 3 sentences.`
      },
      ...context.map((c, i) => ({
        role: i % 2 === 0 ? 'user' as const : 'assistant' as const,
        content: c,
      })),
      { role: 'user', content: message },
    ],
    max_tokens: 150,
    temperature: 0.8,
  });

  return completion.choices[0]?.message?.content || 'I am processing your request...';
}

export async function generateMarketAnalysis(env: Env, marketType: string): Promise<string> {
  const openai = getOpenAI(env);

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'You are a NEXORUM market analyst. Provide brief market insights.'
      },
      {
        role: 'user',
        content: `Analyze the ${marketType} market in NEXORUM. Give 3 trading tips.`
      }
    ],
    max_tokens: 200,
    temperature: 0.7,
  });

  return completion.choices[0]?.message?.content || 'Market analysis unavailable.';
}

export async function generateNPCDialogue(env: Env, npcName: string, playerLevel: number): Promise<string> {
  const openai = getOpenAI(env);

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `You are ${npcName}, an NPC in NEXORUM. Respond in character. Player level: ${playerLevel}`
      },
      {
        role: 'user',
        content: 'Greet me and offer a quest hint.'
      }
    ],
    max_tokens: 100,
    temperature: 0.9,
  });

  return completion.choices[0]?.message?.content || '...';
}

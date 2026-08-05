// =====================================================
// WEBRTC VOICE ROUTES
// =====================================================

import { Hono } from 'hono';
import type { Env } from '../types';
import { authMiddleware, getUser } from '../middleware/auth';

const voice = new Hono<{ Bindings: Env }>();

voice.use('*', authMiddleware);

// Create or join voice room
voice.post('/room', async (c) => {
  const user = getUser(c);
  const { roomId, partyId, guildId } = await c.req.json();

  // In production, use DurableObject for stateful WebRTC signaling
  const room = roomId || `room-${Date.now()}-${Math.random().toString(36).slice(2)}`;

  return c.json({
    roomId: room,
    token: await generateVoiceToken(room, user.id),
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ],
    message: 'Join this room with the provided token',
  });
});

// Get room participants
voice.get('/room/:id/participants', async (c) => {
  const roomId = c.req.param('id');

  // In production, fetch from DurableObject state
  return c.json({
    roomId,
    participants: [],
    message: 'Use WebRTC signaling to connect',
  });
});

// Signal WebRTC offer/answer/ICE
voice.post('/signal', async (c) => {
  const user = getUser(c);
  const { roomId, targetUserId, type, data } = await c.req.json();

  // In production, broadcast via DurableObject/WebSocket
  return c.json({
    from: user.id,
    to: targetUserId,
    type,
    forwarded: true,
  });
});

async function generateVoiceToken(roomId: string, userId: string): Promise<string> {
  // Simple token generation - replace with JWT in production
  const payload = btoa(JSON.stringify({ roomId, userId, exp: Date.now() + 3600000 }));
  const signature = btoa(`${roomId}:${userId}:nexorum-secret`);
  return `${payload}.${signature}`;
}

export default voice;

// apps/api/src/durable-objects/MatchRoom.ts (WebRTC signaling added)
// Key additions to existing MatchRoom class:

// In handleMessage, add:
/*
case 'voice_join':
  this.broadcast({ type: 'voice_join', userId: player.userId, username: player.username });
  // Send existing voice peers to new joiner
  this.clients.forEach((p, ws) => {
    if (p.userId !== player.userId && p.voiceEnabled) {
      this.send(ws, { type: 'voice_peer', userId: player.userId, username: player.username });
    }
  });
  player.voiceEnabled = true;
  break;

case 'webrtc_offer':
  this.relayToUser(data.targetUserId, { ...data, userId: player.userId });
  break;

case 'webrtc_answer':
  this.relayToUser(data.targetUserId, { ...data, userId: player.userId });
  break;

case 'webrtc_ice':
  this.relayToUser(data.targetUserId, { ...data, userId: player.userId });
  break;

case 'voice_state':
  this.broadcast({ type: 'voice_state', userId: player.userId, muted: data.muted, speaking: data.speaking });
  break;

case 'voice_leave':
  player.voiceEnabled = false;
  this.broadcast({ type: 'voice_leave', userId: player.userId });
  break;
*/

// Add helper method:
/*
private relayToUser(targetUserId: string, message: any): void {
  this.clients.forEach((player, ws) => {
    if (player.userId === targetUserId) {
      this.send(ws, message);
    }
  });
}
*/

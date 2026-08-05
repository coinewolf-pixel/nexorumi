// apps/api/src/voice/webrtc-signaling.ts
export interface VoiceParticipant {
  userId: string; username: string; peerId: string; ws: WebSocket;
  muted: boolean; deafened: boolean; speaking: boolean; volume: number;
}

export class VoiceRoom {
  private participants: Map<string, VoiceParticipant> = new Map();
  private maxParticipants = 16;

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === '/voice') {
      const [client, server] = Object.values(new WebSocketPair());
      await this.handleSession(server, url);
      return new Response(null, { status: 101, webSocket: client });
    }
    if (url.pathname === '/participants') {
      return new Response(JSON.stringify(this.getList()), { headers: { 'Content-Type': 'application/json' } });
    }
    return new Response('Not found', { status: 404 });
  }

  private async handleSession(ws: WebSocket, url: URL) {
    ws.accept();
    const userId = url.searchParams.get('userId');
    const username = url.searchParams.get('username') || 'Unknown';
    const peerId = url.searchParams.get('peerId');
    if (!userId || !peerId) { ws.close(1008, 'Missing params'); return; }
    if (this.participants.size >= this.maxParticipants) { ws.close(1008, 'Room full'); return; }

    const p: VoiceParticipant = { userId, username, peerId, ws, muted: false, deafened: false, speaking: false, volume: 100 };
    this.participants.set(peerId, p);
    this.broadcast({ type: 'peer-joined', peerId, username, participants: this.getList() }, peerId);
    this.send(ws, { type: 'room-state', participants: this.getList() });

    ws.addEventListener('message', async (msg) => {
      try { await this.handleSignal(p, JSON.parse(msg.data)); } catch {}
    });
    ws.addEventListener('close', () => this.handleDisconnect(peerId));
  }

  private async handleSignal(p: VoiceParticipant, signal: any) {
    switch (signal.type) {
      case 'offer': case 'answer': case 'ice-candidate':
        if (signal.to) { const t = this.participants.get(signal.to); if (t) this.send(t.ws, { type: signal.type, from: p.peerId, payload: signal.payload }); }
        break;
      case 'mute': p.muted = true; this.broadcast({ type: 'peer-muted', peerId: p.peerId }); break;
      case 'unmute': p.muted = false; this.broadcast({ type: 'peer-unmuted', peerId: p.peerId }); break;
      case 'speaking': p.speaking = signal.payload.speaking; this.broadcast({ type: 'peer-speaking', peerId: p.peerId, speaking: p.speaking }); break;
    }
  }

  private handleDisconnect(peerId: string) {
    this.participants.delete(peerId);
    this.broadcast({ type: 'peer-left', peerId, participants: this.getList() });
  }

  private getList() { return Array.from(this.participants.values()).map(p => ({ peerId: p.peerId, username: p.username, muted: p.muted, speaking: p.speaking })); }
  private broadcast(msg: any, exclude?: string) { const d = JSON.stringify(msg); this.participants.forEach((p) => { if (p.peerId !== exclude && p.ws.readyState === 1) p.ws.send(d); }); }
  private send(ws: WebSocket, msg: any) { if (ws.readyState === 1) ws.send(JSON.stringify(msg)); }
}

export class WebRTCClient {
  private pc: RTCPeerConnection | null = null;
  private ws: WebSocket | null = null;
  private localStream: MediaStream | null = null;
  private pendingCandidates: RTCIceCandidate[] = [];

  constructor(private peerId: string, private onRemoteStream: (s: MediaStream, id: string) => void, private onUpdate: (p: any[]) => void) {}

  async connect(url: string): Promise<void> {
    this.ws = new WebSocket(`${url}&peerId=${this.peerId}`);
    return new Promise((res, rej) => { this.ws!.onopen = () => res(); this.ws!.onerror = rej; this.ws!.onmessage = (m) => this.handleMsg(JSON.parse(m.data)); });
  }

  async startVoice(): Promise<void> {
    this.localStream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }, video: false });
  }

  async joinPeer(target: string): Promise<void> {
    this.pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
    this.localStream?.getTracks().forEach(t => this.pc!.addTrack(t, this.localStream!));
    this.pc.ontrack = (e) => this.onRemoteStream(e.streams[0], target);
    this.pc.onicecandidate = (e) => { if (e.candidate) this.send('ice-candidate', target, e.candidate); };
    const offer = await this.pc.createOffer(); await this.pc.setLocalDescription(offer); this.send('offer', target, offer);
  }

  private async handleMsg(msg: any) {
    switch (msg.type) {
      case 'room-state': this.onUpdate(msg.participants); for (const p of msg.participants) if (p.peerId !== this.peerId) await this.joinPeer(p.peerId); break;
      case 'peer-joined': this.onUpdate(msg.participants); await this.joinPeer(msg.peerId); break;
      case 'peer-left': this.onUpdate(msg.participants); break;
      case 'offer': await this.handleOffer(msg.from, msg.payload); break;
      case 'answer': await this.pc?.setRemoteDescription(new RTCSessionDescription(msg.payload)); break;
      case 'ice-candidate': if (this.pc?.remoteDescription) await this.pc.addIceCandidate(new RTCIceCandidate(msg.payload)); else this.pendingCandidates.push(new RTCIceCandidate(msg.payload)); break;
    }
  }

  private async handleOffer(from: string, offer: RTCSessionDescriptionInit) {
    this.pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
    this.localStream?.getTracks().forEach(t => this.pc!.addTrack(t, this.localStream!));
    this.pc.ontrack = (e) => this.onRemoteStream(e.streams[0], from);
    this.pc.onicecandidate = (e) => { if (e.candidate) this.send('ice-candidate', from, e.candidate); };
    await this.pc.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await this.pc.createAnswer(); await this.pc.setLocalDescription(answer); this.send('answer', from, answer);
    for (const c of this.pendingCandidates) await this.pc.addIceCandidate(c); this.pendingCandidates = [];
  }

  private send(type: string, to: string, payload: any) { this.ws?.send(JSON.stringify({ type, to, payload })); }
  setMuted(muted: boolean) { this.localStream?.getAudioTracks().forEach(t => t.enabled = !muted); this.ws?.send(JSON.stringify({ type: muted ? 'mute' : 'unmute' })); }
  disconnect() { this.localStream?.getTracks().forEach(t => t.stop()); this.pc?.close(); this.ws?.close(); }
}

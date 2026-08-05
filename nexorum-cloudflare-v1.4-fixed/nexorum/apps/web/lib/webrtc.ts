// apps/web/lib/webrtc.ts
// NEXORUM WebRTC Voice Chat — Peer-to-peer voice in match rooms

export interface VoicePeer {
  userId: string;
  username: string;
  stream: MediaStream | null;
  connection: RTCPeerConnection;
  audioElement?: HTMLAudioElement;
  muted: boolean;
  speaking: boolean;
  volume: number;
}

export class VoiceChatManager {
  private localStream: MediaStream | null = null;
  private peers: Map<string, VoicePeer> = new Map();
  private ws: WebSocket | null = null;
  private roomId: string;
  private userId: string;
  private onPeerUpdate: (peers: VoicePeer[]) => void;
  private iceServers: RTCIceServer[] = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ];

  constructor(roomId: string, userId: string, onPeerUpdate: (peers: VoicePeer[]) => void) {
    this.roomId = roomId;
    this.userId = userId;
    this.onPeerUpdate = onPeerUpdate;
  }

  async init(): Promise<void> {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000,
        },
        video: false,
      });
    } catch (e) {
      console.error('Microphone access denied:', e);
      throw e;
    }
  }

  connect(signalingWs: WebSocket): void {
    this.ws = signalingWs;

    // Listen for WebRTC signaling messages
    const originalOnMessage = this.ws.onmessage;
    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === 'webrtc_offer') this.handleOffer(data);
      else if (data.type === 'webrtc_answer') this.handleAnswer(data);
      else if (data.type === 'webrtc_ice') this.handleIceCandidate(data);
      else if (data.type === 'voice_state') this.handleVoiceState(data);
      else if (originalOnMessage) originalOnMessage.call(this.ws!, event);
    };

    // Notify server we're ready for voice
    this.send({ type: 'voice_join', userId: this.userId, roomId: this.roomId });
  }

  private createPeerConnection(targetUserId: string): RTCPeerConnection {
    const pc = new RTCPeerConnection({ iceServers: this.iceServers });

    // Add local stream tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        pc.addTrack(track, this.localStream!);
      });
    }

    // Handle remote stream
    pc.ontrack = (event) => {
      const peer = this.peers.get(targetUserId);
      if (peer) {
        peer.stream = event.streams[0];

        // Create audio element
        if (!peer.audioElement) {
          peer.audioElement = document.createElement('audio');
          peer.audioElement.autoplay = true;
          peer.audioElement.srcObject = event.streams[0];
          document.body.appendChild(peer.audioElement);
        }

        // Detect speaking
        this.detectSpeaking(peer);
        this.notifyUpdate();
      }
    };

    // ICE candidate handling
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.send({
          type: 'webrtc_ice',
          targetUserId,
          candidate: event.candidate,
          userId: this.userId,
        });
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        this.removePeer(targetUserId);
      }
    };

    return pc;
  }

  async createOffer(targetUserId: string, username: string): Promise<void> {
    const pc = this.createPeerConnection(targetUserId);
    const peer: VoicePeer = {
      userId: targetUserId,
      username,
      stream: null,
      connection: pc,
      muted: false,
      speaking: false,
      volume: 1,
    };
    this.peers.set(targetUserId, peer);

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    this.send({
      type: 'webrtc_offer',
      targetUserId,
      offer,
      userId: this.userId,
      username,
    });
  }

  private async handleOffer(data: any): Promise<void> {
    const { userId: fromUserId, username, offer } = data;

    const pc = this.createPeerConnection(fromUserId);
    const peer: VoicePeer = {
      userId: fromUserId,
      username,
      stream: null,
      connection: pc,
      muted: false,
      speaking: false,
      volume: 1,
    };
    this.peers.set(fromUserId, peer);

    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    this.send({
      type: 'webrtc_answer',
      targetUserId: fromUserId,
      answer,
      userId: this.userId,
    });
  }

  private async handleAnswer(data: any): Promise<void> {
    const { userId: fromUserId, answer } = data;
    const peer = this.peers.get(fromUserId);
    if (peer) {
      await peer.connection.setRemoteDescription(new RTCSessionDescription(answer));
    }
  }

  private async handleIceCandidate(data: any): Promise<void> {
    const { userId: fromUserId, candidate } = data;
    const peer = this.peers.get(fromUserId);
    if (peer && candidate) {
      await peer.connection.addIceCandidate(new RTCIceCandidate(candidate));
    }
  }

  private handleVoiceState(data: any): void {
    const peer = this.peers.get(data.userId);
    if (peer) {
      peer.muted = data.muted;
      peer.speaking = data.speaking;
      this.notifyUpdate();
    }
  }

  private detectSpeaking(peer: VoicePeer): void {
    if (!peer.stream) return;

    const audioContext = new AudioContext();
    const source = audioContext.createMediaStreamSource(peer.stream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);

    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const checkSpeaking = () => {
      if (!this.peers.has(peer.userId)) {
        audioContext.close();
        return;
      }

      analyser.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
      const isSpeaking = average > 20;

      if (isSpeaking !== peer.speaking) {
        peer.speaking = isSpeaking;
        this.notifyUpdate();
      }

      requestAnimationFrame(checkSpeaking);
    };

    checkSpeaking();
  }

  toggleMute(): boolean {
    if (!this.localStream) return false;
    const audioTrack = this.localStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      const muted = !audioTrack.enabled;
      this.send({ type: 'voice_state', userId: this.userId, muted, speaking: false });
      return muted;
    }
    return false;
  }

  setVolume(userId: string, volume: number): void {
    const peer = this.peers.get(userId);
    if (peer && peer.audioElement) {
      peer.audioElement.volume = volume;
      peer.volume = volume;
    }
  }

  private removePeer(userId: string): void {
    const peer = this.peers.get(userId);
    if (peer) {
      peer.connection.close();
      if (peer.audioElement) {
        peer.audioElement.remove();
      }
      this.peers.delete(userId);
      this.notifyUpdate();
    }
  }

  disconnect(): void {
    this.peers.forEach((peer, userId) => this.removePeer(userId));
    this.localStream?.getTracks().forEach(track => track.stop());
    this.localStream = null;
    this.send({ type: 'voice_leave', userId: this.userId });
  }

  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  getPeers(): VoicePeer[] {
    return Array.from(this.peers.values());
  }

  private send(data: any): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  private notifyUpdate(): void {
    this.onPeerUpdate(this.getPeers());
  }
}

export default VoiceChatManager;

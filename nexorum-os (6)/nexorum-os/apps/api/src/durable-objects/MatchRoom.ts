// apps/api/src/durable-objects/MatchRoom.ts
// NEXORUM Real-time Matchmaking via Durable Objects + WebSocket

export interface Env {
  NEXORUM_CACHE: KVNamespace;
  SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
}

interface Player {
  userId: string;
  username: string;
  elo: number;
  latency: number;
  region: string;
  ws: WebSocket;
  ready: boolean;
  team: number;
}

interface MatchState {
  id: string;
  marketId: string;
  mode: string;
  mapId: string;
  status: 'waiting' | 'starting' | 'in_progress' | 'finished';
  players: Player[];
  maxPlayers: number;
  startTime?: number;
  endTime?: number;
  winnerId?: string;
  serverRegion: string;
  tick: number;
}

export class MatchRoom {
  private state: DurableObjectState;
  private env: Env;
  private match: MatchState | null = null;
  private clients: Map<WebSocket, Player> = new Map();
  private broadcastInterval: any = null;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/websocket') {
      const upgradeHeader = request.headers.get('Upgrade');
      if (upgradeHeader !== 'websocket') {
        return new Response('Expected websocket', { status: 400 });
      }

      const [client, server] = Object.values(new WebSocketPair());
      await this.handleSession(server, url);
      return new Response(null, { status: 101, webSocket: client });
    }

    if (url.pathname === '/state') {
      return new Response(JSON.stringify(this.match), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response('Not found', { status: 404 });
  }

  private async handleSession(ws: WebSocket, url: URL) {
    ws.accept();

    const userId = url.searchParams.get('userId');
    const username = url.searchParams.get('username') || 'Unknown';
    const elo = parseInt(url.searchParams.get('elo') || '1000');
    const latency = parseInt(url.searchParams.get('latency') || '50');
    const region = url.searchParams.get('region') || 'us-east';
    const marketId = url.searchParams.get('market') || 'hunt';
    const mode = url.searchParams.get('mode') || 'solo';

    if (!userId) {
      ws.close(1008, 'Missing userId');
      return;
    }

    // Initialize match if new
    if (!this.match) {
      this.match = {
        id: this.state.id.toString(),
        marketId,
        mode,
        mapId: this.selectMap(marketId),
        status: 'waiting',
        players: [],
        maxPlayers: this.getMaxPlayers(mode),
        serverRegion: region,
        tick: 0,
      };
    }

    const player: Player = {
      userId, username, elo, latency, region,
      ws, ready: false, team: 0,
    };

    this.clients.set(ws, player);
    this.match.players.push(player);

    // Assign team
    if (mode !== 'solo') {
      const teamSize = mode === 'duo' ? 2 : 4;
      player.team = Math.floor(this.match.players.length / teamSize);
    }

    // Send join confirmation
    this.send(ws, {
      type: 'joined',
      matchId: this.match.id,
      playerId: userId,
      team: player.team,
      map: this.match.mapId,
      players: this.match.players.map(p => ({
        userId: p.userId,
        username: p.username,
        elo: p.elo,
        team: p.team,
        ready: p.ready,
      })),
    });

    // Broadcast to others
    this.broadcast({
      type: 'player_join',
      player: { userId, username, elo, team: player.team },
      playerCount: this.match.players.length,
      maxPlayers: this.match.maxPlayers,
    }, ws);

    // Auto-start if full
    if (this.match.players.length >= this.match.maxPlayers) {
      this.startMatch();
    }

    // Handle messages
    ws.addEventListener('message', async (msg) => {
      try {
        const data = JSON.parse(msg.data as string);
        await this.handleMessage(ws, data);
      } catch (e) {
        this.send(ws, { type: 'error', message: 'Invalid JSON' });
      }
    });

    // Handle close
    ws.addEventListener('close', () => {
      this.handleDisconnect(ws);
    });

    // Start game loop if not running
    if (!this.broadcastInterval) {
      this.broadcastInterval = setInterval(() => this.gameTick(), 1000 / 20);
    }
  }

  private async handleMessage(ws: WebSocket, data: any) {
    const player = this.clients.get(ws);
    if (!player || !this.match) return;

    switch (data.type) {
      case 'ready':
        player.ready = true;
        this.broadcast({ type: 'player_ready', userId: player.userId });

        if (this.match.players.every(p => p.ready) && this.match.players.length >= 2) {
          this.startMatch();
        }
        break;

      case 'action':
        if (this.match.status !== 'in_progress') {
          this.send(ws, { type: 'error', message: 'Match not started' });
          return;
        }
        this.broadcast({
          type: 'action',
          userId: player.userId,
          action: data.action,
          payload: data.payload,
          timestamp: Date.now(),
        });
        break;

      case 'chat':
        this.broadcast({
          type: 'chat',
          userId: player.userId,
          username: player.username,
          message: data.message,
        });
        break;

      case 'ping':
        this.send(ws, { type: 'pong', timestamp: Date.now() });
        break;

      case 'surrender':
        this.handlePlayerLeave(player);
        break;
    }
  }

  private startMatch() {
    if (!this.match || this.match.status !== 'waiting') return;

    this.match.status = 'starting';
    this.broadcast({ type: 'match_starting', countdown: 5 });

    setTimeout(() => {
      if (!this.match) return;
      this.match.status = 'in_progress';
      this.match.startTime = Date.now();
      this.broadcast({
        type: 'match_started',
        startTime: this.match.startTime,
        duration: this.getMatchDuration(this.match.marketId),
      });
    }, 5000);
  }

  private gameTick() {
    if (!this.match) return;
    this.match.tick++;

    if (this.match.tick % 20 === 0) {
      this.broadcast({
        type: 'sync',
        tick: this.match.tick,
        status: this.match.status,
        elapsed: this.match.startTime ? Date.now() - this.match.startTime : 0,
      });
    }

    if (this.match.status === 'in_progress') {
      const duration = this.getMatchDuration(this.match.marketId);
      if (this.match.startTime && Date.now() - this.match.startTime > duration) {
        this.endMatch();
      }
    }
  }

  private endMatch() {
    if (!this.match) return;
    this.match.status = 'finished';
    this.match.endTime = Date.now();

    this.broadcast({
      type: 'match_ended',
      winnerId: this.match.winnerId,
      duration: this.match.endTime - (this.match.startTime || 0),
    });

    this.saveMatchToDatabase();

    setTimeout(() => {
      this.clients.forEach((_, ws) => ws.close(1000, 'Match ended'));
      this.clients.clear();
      if (this.broadcastInterval) {
        clearInterval(this.broadcastInterval);
        this.broadcastInterval = null;
      }
      this.match = null;
    }, 30000);
  }

  private async saveMatchToDatabase() {
    if (!this.match) return;
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(this.env.SUPABASE_URL, this.env.SUPABASE_SERVICE_KEY);

      await supabase.from('matches').insert({
        id: this.match.id,
        market_id: this.match.marketId,
        mode: this.match.mode,
        status: 'finished',
        server_region: this.match.serverRegion,
        map_id: this.match.mapId,
        winner_id: this.match.winnerId,
        start_time: new Date(this.match.startTime || 0).toISOString(),
        end_time: new Date(this.match.endTime || 0).toISOString(),
      });

      const matchPlayers = this.match.players.map(p => ({
        match_id: this.match!.id,
        user_id: p.userId,
        team: p.team,
        elo: p.elo,
        score: 0,
        is_bot: false,
      }));

      await supabase.from('match_players').insert(matchPlayers);
    } catch (e) {
      console.error('Failed to save match:', e);
    }
  }

  private handleDisconnect(ws: WebSocket) {
    const player = this.clients.get(ws);
    if (!player || !this.match) return;

    this.clients.delete(ws);
    this.match.players = this.match.players.filter(p => p.userId !== player.userId);

    this.broadcast({
      type: 'player_leave',
      userId: player.userId,
      playerCount: this.match.players.length,
    });

    if (this.match.status === 'in_progress' && this.match.players.length < 2) {
      this.match.winnerId = this.match.players[0]?.userId;
      this.endMatch();
    }
  }

  private handlePlayerLeave(player: Player) {
    if (!this.match) return;
    this.match.players = this.match.players.filter(p => p.userId !== player.userId);
    this.clients.delete(player.ws);

    this.broadcast({
      type: 'player_leave',
      userId: player.userId,
      reason: 'surrender',
    });
  }

  private broadcast(message: any, exclude?: WebSocket) {
    const data = JSON.stringify(message);
    this.clients.forEach((_, ws) => {
      if (ws !== exclude && ws.readyState === WebSocket.READY_STATE_OPEN) {
        ws.send(data);
      }
    });
  }

  private send(ws: WebSocket, message: any) {
    if (ws.readyState === WebSocket.READY_STATE_OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  private getMaxPlayers(mode: string): number {
    switch (mode) {
      case 'solo': return 8;
      case 'duo': return 8;
      case 'squad': return 16;
      case 'guild_war': return 40;
      case 'tournament': return 32;
      default: return 8;
    }
  }

  private getMatchDuration(marketId: string): number {
    const durations: Record<string, number> = {
      hunt: 15 * 60 * 1000,
      racing: 5 * 60 * 1000,
      fishing: 30 * 60 * 1000,
      farm: 60 * 60 * 1000,
      survival: 20 * 60 * 1000,
    };
    return durations[marketId] || 15 * 60 * 1000;
  }

  private selectMap(marketId: string): string {
    const maps: Record<string, string[]> = {
      hunt: ['forest', 'desert', 'arctic', 'jungle'],
      racing: ['neon_city', 'coastal', 'mountain', 'space_station'],
      fishing: ['lake', 'ocean', 'river', 'deep_sea'],
      farm: ['meadow', 'valley', 'island', 'underground'],
      survival: ['wasteland', 'island', 'bunker', 'city_ruins'],
    };
    const pool = maps[marketId] || ['default'];
    return pool[Math.floor(Math.random() * pool.length)];
  }
}

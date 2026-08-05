// apps/web/app/page.tsx
'use client';

import { useState } from 'react';

const MARKETS = [
  { id: 'hunt', name: 'Hunt Market', icon: '🎯', color: '#EF4444', players: 0, max: 100 },
  { id: 'racing', name: 'Racing Market', icon: '🏎️', color: '#3B82F6', players: 0, max: 50 },
  { id: 'fishing', name: 'Fishing Market', icon: '🎣', color: '#06B6D4', players: 0, max: 200 },
  { id: 'farm', name: 'Farm Market', icon: '🌾', color: '#22C55E', players: 0, max: 500 },
  { id: 'survival', name: 'Survival Market', icon: '⚔️', color: '#F59E0B', players: 0, max: 80 },
];

export default function Home() {
  const [activeMarket, setActiveMarket] = useState<string | null>(null);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--kimi-color-surface, #0a0a0a)', color: 'var(--kimi-color-text-primary, #fff)' }}>
      <header style={{ padding: '20px 32px', borderBottom: '1px solid var(--kimi-color-border, #333)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #6366f1, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 700 }}>N</div>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 600 }}>NEXORUM</div>
            <div style={{ fontSize: '11px', color: 'var(--kimi-color-text-secondary, #888)' }}>Multi-Game Ecosystem</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <span style={{ fontSize: '14px', color: 'var(--kimi-color-text-secondary)' }}>💠 12,450 NEXO</span>
          <span style={{ fontSize: '14px', color: 'var(--kimi-color-text-secondary)' }}>⭐ LVL 42</span>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#333' }} />
        </div>
      </header>

      <div style={{ display: 'flex' }}>
        <aside style={{ width: '240px', padding: '24px', borderRight: '1px solid var(--kimi-color-border, #333)', minHeight: 'calc(100vh - 80px)' }}>
          <div style={{ marginBottom: '24px' }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--kimi-color-text-secondary)', marginBottom: '12px' }}>Platform</div>
            {['Profile', 'Inventory', 'Friends', 'Chat', 'Achievements', 'Leaderboard', 'Settings'].map(item => (
              <div key={item} style={{ padding: '8px 12px', borderRadius: '8px', fontSize: '14px', color: 'var(--kimi-color-text-secondary)', cursor: 'pointer', marginBottom: '2px' }}>{item}</div>
            ))}
          </div>
          <div>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--kimi-color-text-secondary)', marginBottom: '12px' }}>Markets</div>
            {MARKETS.map(m => (
              <div key={m.id} onClick={() => setActiveMarket(m.id)} style={{
                padding: '10px 12px', borderRadius: '8px', fontSize: '14px', cursor: 'pointer', marginBottom: '4px',
                background: activeMarket === m.id ? `${m.color}15` : 'transparent',
                borderLeft: activeMarket === m.id ? `3px solid ${m.color}` : '3px solid transparent',
                color: activeMarket === m.id ? '#fff' : 'var(--kimi-color-text-secondary)',
              }}>
                <span style={{ marginRight: '8px' }}>{m.icon}</span>{m.name}
              </div>
            ))}
          </div>
        </aside>

        <main style={{ flex: 1, padding: '32px' }}>
          {!activeMarket ? (
            <div>
              <h1 style={{ fontSize: '32px', fontWeight: 600, margin: '0 0 8px' }}>Welcome to NEXORUM</h1>
              <p style={{ fontSize: '16px', color: 'var(--kimi-color-text-secondary)', margin: '0 0 32px' }}>Select a market to begin your journey.</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                {MARKETS.map(m => (
                  <div key={m.id} onClick={() => setActiveMarket(m.id)} style={{
                    padding: '24px', borderRadius: '12px', border: '1px solid var(--kimi-color-border, #333)',
                    background: `${m.color}08`, cursor: 'pointer', transition: 'transform 0.2s, border-color 0.2s',
                  }} onMouseEnter={e => { e.currentTarget.style.borderColor = m.color; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--kimi-color-border, #333)'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                    <div style={{ fontSize: '40px', marginBottom: '12px' }}>{m.icon}</div>
                    <div style={{ fontSize: '18px', fontWeight: 600, marginBottom: '4px' }}>{m.name}</div>
                    <div style={{ fontSize: '13px', color: 'var(--kimi-color-text-secondary)' }}>{m.max} max players</div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                  <h1 style={{ fontSize: '28px', fontWeight: 600, margin: '0' }}>{MARKETS.find(m => m.id === activeMarket)?.name}</h1>
                  <p style={{ fontSize: '14px', color: 'var(--kimi-color-text-secondary)', margin: '4px 0 0' }}>Select game mode and find a match</p>
                </div>
                <button onClick={() => setActiveMarket(null)} style={{
                  padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--kimi-color-border)',
                  background: 'transparent', color: 'var(--kimi-color-text-secondary)', cursor: 'pointer', fontSize: '14px',
                }}>Back to Markets</button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
                {['Solo', 'Duo', 'Squad', 'Ranked', 'Tournament'].map(mode => (
                  <div key={mode} style={{ padding: '20px', borderRadius: '10px', border: '1px solid var(--kimi-color-border, #333)', textAlign: 'center', cursor: 'pointer' }}>
                    <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>{mode}</div>
                    <div style={{ fontSize: '12px', color: 'var(--kimi-color-text-secondary)' }}>
                      {mode === 'Solo' ? '1 player' : mode === 'Duo' ? '2 players' : mode === 'Squad' ? '4 players' : 'Competitive'}
                    </div>
                    <button style={{ marginTop: '12px', padding: '8px 20px', borderRadius: '6px', border: 'none', background: 'var(--kimi-color-text-primary, #fff)', color: 'var(--kimi-color-surface, #000)', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>Queue</button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

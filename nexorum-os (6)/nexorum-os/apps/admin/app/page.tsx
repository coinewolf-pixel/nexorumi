// apps/admin/app/page.tsx
// NEXORUM Admin Dashboard — Full management interface

'use client';

import { useState, useEffect } from 'react';

// ─── Types ─────────────────────────────────────────────────────────

interface AdminUser {
  id: string;
  username: string;
  email: string;
  role: 'superadmin' | 'admin' | 'moderator';
  status: 'active' | 'banned' | 'muted';
  platformLevel: number;
  nexoBalance: number;
  reputation: number;
  lastActive: string;
  createdAt: string;
}

interface EconomyMetrics {
  totalSupply: number;
  circulating: number;
  staked: number;
  burned: number;
  dailyVolume: number;
  activeStakers: number;
}

interface MarketConfig {
  marketId: string;
  name: string;
  status: 'active' | 'maintenance' | 'event';
  eventName?: string;
  dropMultiplier: number;
  xpMultiplier: number;
  maxPlayers: number;
}

interface Report {
  id: string;
  reporterId: string;
  targetId: string;
  type: 'cheating' | 'harassment' | 'scam' | 'bug_abuse';
  status: 'open' | 'investigating' | 'resolved' | 'dismissed';
  description: string;
  createdAt: string;
}

// ─── Mock Data ─────────────────────────────────────────────────────

const MOCK_USERS: AdminUser[] = Array.from({ length: 20 }, (_, i) => ({
  id: `user_${i}`,
  username: `Player_${i}`,
  email: `player${i}@nexorum.game`,
  role: i === 0 ? 'superadmin' : i < 3 ? 'admin' : 'moderator',
  status: Math.random() > 0.9 ? 'banned' : 'active',
  platformLevel: Math.floor(Math.random() * 100),
  nexoBalance: Math.floor(Math.random() * 500000),
  reputation: Math.floor(Math.random() * 100),
  lastActive: new Date(Date.now() - Math.random() * 86400000 * 7).toISOString(),
  createdAt: new Date(Date.now() - Math.random() * 86400000 * 365).toISOString(),
}));

const MOCK_METRICS: EconomyMetrics = {
  totalSupply: 1_000_000_000,
  circulating: 420_000_000,
  staked: 180_000_000,
  burned: 12_450_000,
  dailyVolume: 8_500_000,
  activeStakers: 45_230,
};

const MOCK_MARKETS: MarketConfig[] = [
  { marketId: 'hunt', name: 'Hunt Market', status: 'active', dropMultiplier: 1.0, xpMultiplier: 1.0, maxPlayers: 100 },
  { marketId: 'racing', name: 'Racing Market', status: 'event', eventName: 'Neon Grand Prix', dropMultiplier: 2.0, xpMultiplier: 1.5, maxPlayers: 50 },
  { marketId: 'fishing', name: 'Fishing Market', status: 'active', dropMultiplier: 1.0, xpMultiplier: 1.0, maxPlayers: 200 },
  { marketId: 'farm', name: 'Farm Market', status: 'maintenance', dropMultiplier: 0, xpMultiplier: 0, maxPlayers: 500 },
  { marketId: 'survival', name: 'Survival Market', status: 'active', dropMultiplier: 1.0, xpMultiplier: 1.0, maxPlayers: 80 },
];

const MOCK_REPORTS: Report[] = Array.from({ length: 10 }, (_, i) => ({
  id: `report_${i}`,
  reporterId: `user_${Math.floor(Math.random() * 20)}`,
  targetId: `user_${Math.floor(Math.random() * 20)}`,
  type: ['cheating', 'harassment', 'scam', 'bug_abuse'][Math.floor(Math.random() * 4)] as Report['type'],
  status: ['open', 'investigating', 'resolved', 'dismissed'][Math.floor(Math.random() * 4)] as Report['status'],
  description: 'Reported for suspicious activity during ranked match.',
  createdAt: new Date(Date.now() - Math.random() * 86400000 * 3).toISOString(),
}));

// ─── Components ────────────────────────────────────────────────────

function Card({ title, value, change, color = 'primary' }: { title: string; value: string; change?: string; color?: string }) {
  const colorMap: Record<string, string> = {
    primary: 'var(--kimi-color-text-primary)',
    positive: 'var(--kimi-color-positive)',
    danger: 'var(--kimi-color-danger)',
    accent: 'var(--kimi-color-accent)',
  };
  return (
    <div style={{
      padding: '16px',
      borderRadius: '10px',
      border: '1px solid var(--kimi-color-border)',
      background: 'color-mix(in srgb, var(--kimi-color-text-primary) 2%, transparent)',
    }}>
      <div style={{ fontSize: '12px', color: 'var(--kimi-color-text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</div>
      <div style={{ fontSize: '28px', fontWeight: 500, color: colorMap[color] || color, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
      {change && <div style={{ fontSize: '12px', color: change.startsWith('+') ? 'var(--kimi-color-positive)' : 'var(--kimi-color-danger)', marginTop: '4px' }}>{change}</div>}
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} style={{
      padding: '8px 16px',
      borderRadius: '8px',
      border: 'none',
      background: active ? 'var(--kimi-color-text-primary)' : 'transparent',
      color: active ? 'var(--kimi-color-surface)' : 'var(--kimi-color-text-secondary)',
      fontSize: '14px',
      fontWeight: 500,
      cursor: 'pointer',
      transition: 'all 0.15s ease',
    }}>
      {children}
    </button>
  );
}

function Badge({ text, type }: { text: string; type: 'success' | 'warning' | 'danger' | 'neutral' }) {
  const colors: Record<string, string> = {
    success: 'color-mix(in srgb, var(--kimi-color-positive) 12%, transparent)',
    warning: 'color-mix(in srgb, var(--kimi-color-warning) 12%, transparent)',
    danger: 'color-mix(in srgb, var(--kimi-color-danger) 12%, transparent)',
    neutral: 'color-mix(in srgb, var(--kimi-color-text-secondary) 12%, transparent)',
  };
  const textColors: Record<string, string> = {
    success: 'var(--kimi-color-positive)',
    warning: 'var(--kimi-color-warning)',
    danger: 'var(--kimi-color-danger)',
    neutral: 'var(--kimi-color-text-secondary)',
  };
  return (
    <span style={{
      display: 'inline-flex',
      padding: '2px 8px',
      borderRadius: '6px',
      fontSize: '11px',
      fontWeight: 500,
      background: colors[type],
      color: textColors[type],
    }}>
      {text}
    </span>
  );
}

// ─── Main Dashboard ────────────────────────────────────────────────

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'economy' | 'markets' | 'reports' | 'settings'>('overview');
  const [users, setUsers] = useState(MOCK_USERS);
  const [markets, setMarkets] = useState(MOCK_MARKETS);
  const [reports, setReports] = useState(MOCK_REPORTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);

  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleBanUser = (userId: string) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: u.status === 'banned' ? 'active' : 'banned' } : u));
  };

  const handleMarketToggle = (marketId: string) => {
    setMarkets(prev => prev.map(m => m.marketId === marketId ? { ...m, status: m.status === 'active' ? 'maintenance' : 'active' } : m));
  };

  const handleReportStatus = (reportId: string, status: Report['status']) => {
    setReports(prev => prev.map(r => r.id === reportId ? { ...r, status } : r));
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'var(--kimi-font-sans)' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 500, margin: 0 }}>NEXORUM Admin</h1>
        <p style={{ fontSize: '14px', color: 'var(--kimi-color-text-secondary)', margin: '4px 0 0' }}>Platform management and analytics</p>
      </div>

      <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', padding: '4px', borderRadius: '10px', border: '1px solid var(--kimi-color-border)' }}>
        <TabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')}>Overview</TabButton>
        <TabButton active={activeTab === 'users'} onClick={() => setActiveTab('users')}>Users</TabButton>
        <TabButton active={activeTab === 'economy'} onClick={() => setActiveTab('economy')}>Economy</TabButton>
        <TabButton active={activeTab === 'markets'} onClick={() => setActiveTab('markets')}>Markets</TabButton>
        <TabButton active={activeTab === 'reports'} onClick={() => setActiveTab('reports')}>Reports</TabButton>
        <TabButton active={activeTab === 'settings'} onClick={() => setActiveTab('settings')}>Settings</TabButton>
      </div>

      {activeTab === 'overview' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px', marginBottom: '24px' }}>
            <Card title="Total Players" value="124,532" change="+3.2%" />
            <Card title="DAU" value="18,420" change="+5.1%" color="positive" />
            <Card title="NEXO Volume (24h)" value={`${MOCK_METRICS.dailyVolume.toLocaleString()} NEXO`} change="+12.4%" color="accent" />
            <Card title="Active Stakers" value={MOCK_METRICS.activeStakers.toLocaleString()} change="+1.8%" />
            <Card title="Burned Total" value={`${MOCK_METRICS.burned.toLocaleString()} NEXO`} color="danger" />
            <Card title="Open Reports" value={reports.filter(r => r.status === 'open').length.toString()} color="warning" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ padding: '16px', borderRadius: '10px', border: '1px solid var(--kimi-color-border)' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 500, margin: '0 0 12px', color: 'var(--kimi-color-text-secondary)' }}>Market Activity</h3>
              {markets.map(m => (
                <div key={m.marketId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--kimi-color-border)' }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 500 }}>{m.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--kimi-color-text-tertiary)' }}>{m.status === 'event' ? `Event: ${m.eventName}` : `${m.maxPlayers} max players`}</div>
                  </div>
                  <Badge text={m.status} type={m.status === 'active' ? 'success' : m.status === 'maintenance' ? 'danger' : 'warning'} />
                </div>
              ))}
            </div>

            <div style={{ padding: '16px', borderRadius: '10px', border: '1px solid var(--kimi-color-border)' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 500, margin: '0 0 12px', color: 'var(--kimi-color-text-secondary)' }}>Recent Reports</h3>
              {reports.slice(0, 5).map(r => (
                <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--kimi-color-border)' }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 500 }}>{r.type}</div>
                    <div style={{ fontSize: '11px', color: 'var(--kimi-color-text-tertiary)' }}>Target: {r.targetId}</div>
                  </div>
                  <Badge text={r.status} type={r.status === 'open' ? 'warning' : r.status === 'resolved' ? 'success' : 'neutral'} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                flex: 1,
                padding: '10px 14px',
                borderRadius: '10px',
                border: '1px solid var(--kimi-color-border)',
                background: 'transparent',
                color: 'var(--kimi-color-text-primary)',
                fontSize: '14px',
                fontFamily: 'var(--kimi-font-sans)',
              }}
            />
          </div>

          <div style={{ borderRadius: '10px', border: '1px solid var(--kimi-color-border)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: 'color-mix(in srgb, var(--kimi-color-text-primary) 4%, transparent)' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 500, color: 'var(--kimi-color-text-secondary)' }}>User</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 500, color: 'var(--kimi-color-text-secondary)' }}>Level</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 500, color: 'var(--kimi-color-text-secondary)' }}>NEXO</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 500, color: 'var(--kimi-color-text-secondary)' }}>Status</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 500, color: 'var(--kimi-color-text-secondary)' }}>Role</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 500, color: 'var(--kimi-color-text-secondary)' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(u => (
                  <tr key={u.id} style={{ borderTop: '1px solid var(--kimi-color-border)' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 500 }}>{u.username}</div>
                      <div style={{ fontSize: '11px', color: 'var(--kimi-color-text-tertiary)' }}>{u.email}</div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>{u.platformLevel}</td>
                    <td style={{ padding: '12px 16px', fontVariantNumeric: 'tabular-nums' }}>{u.nexoBalance.toLocaleString()}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <Badge text={u.status} type={u.status === 'active' ? 'success' : 'danger'} />
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontSize: '12px', color: 'var(--kimi-color-text-secondary)' }}>{u.role}</span>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <button
                        onClick={() => handleBanUser(u.id)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '6px',
                          border: '1px solid var(--kimi-color-border)',
                          background: u.status === 'banned' ? 'var(--kimi-color-positive)' : 'var(--kimi-color-danger)',
                          color: '#fff',
                          fontSize: '12px',
                          cursor: 'pointer',
                        }}
                      >
                        {u.status === 'banned' ? 'Unban' : 'Ban'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'economy' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px', marginBottom: '24px' }}>
            <Card title="Total Supply" value={`${MOCK_METRICS.totalSupply.toLocaleString()} NEXO`} />
            <Card title="Circulating" value={`${MOCK_METRICS.circulating.toLocaleString()} NEXO`} color="accent" />
            <Card title="Staked" value={`${MOCK_METRICS.staked.toLocaleString()} NEXO`} color="positive" />
            <Card title="Burned" value={`${MOCK_METRICS.burned.toLocaleString()} NEXO`} color="danger" />
          </div>

          <div style={{ padding: '16px', borderRadius: '10px', border: '1px solid var(--kimi-color-border)', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 500, margin: '0 0 16px' }}>Staking Tiers Configuration</h3>
            {[
              { name: 'Bronze', lock: 7, apy: 8, min: 100 },
              { name: 'Silver', lock: 30, apy: 14, min: 500 },
              { name: 'Gold', lock: 90, apy: 22, min: 2000 },
              { name: 'Platinum', lock: 180, apy: 35, min: 10000 },
              { name: 'Diamond', lock: 365, apy: 50, min: 50000 },
            ].map(tier => (
              <div key={tier.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--kimi-color-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: tier.name === 'Diamond' ? '#06B6D4' : tier.name === 'Platinum' ? '#A855F7' : tier.name === 'Gold' ? '#F59E0B' : tier.name === 'Silver' ? '#9CA3AF' : '#B45309' }} />
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 500 }}>{tier.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--kimi-color-text-tertiary)' }}>Lock: {tier.lock} days | Min: {tier.min.toLocaleString()} NEXO</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '20px', fontWeight: 500, color: 'var(--kimi-color-positive)' }}>{tier.apy}%</span>
                  <button style={{ padding: '4px 10px', borderRadius: '6px', border: '1px solid var(--kimi-color-border)', background: 'transparent', fontSize: '12px', cursor: 'pointer' }}>Edit</button>
                </div>
              </div>
            ))}
          </div>

          <div style={{ padding: '16px', borderRadius: '10px', border: '1px solid var(--kimi-color-border)' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 500, margin: '0 0 16px' }}>Emission Controls</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--kimi-color-text-secondary)', display: 'block', marginBottom: '6px' }}>Base Reward per Action</label>
                <input type="number" defaultValue={100} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--kimi-color-border)', background: 'transparent', color: 'var(--kimi-color-text-primary)', fontSize: '14px' }} />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--kimi-color-text-secondary)', display: 'block', marginBottom: '6px' }}>Burn Rate (%)</label>
                <input type="number" defaultValue={2} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--kimi-color-border)', background: 'transparent', color: 'var(--kimi-color-text-primary)', fontSize: '14px' }} />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--kimi-color-text-secondary)', display: 'block', marginBottom: '6px' }}>Cross-Market Fee (%)</label>
                <input type="number" defaultValue={1.5} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--kimi-color-border)', background: 'transparent', color: 'var(--kimi-color-text-primary)', fontSize: '14px' }} />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--kimi-color-text-secondary)', display: 'block', marginBottom: '6px' }}>Platform Fee (%)</label>
                <input type="number" defaultValue={2.5} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--kimi-color-border)', background: 'transparent', color: 'var(--kimi-color-text-primary)', fontSize: '14px' }} />
              </div>
            </div>
            <button style={{ marginTop: '16px', padding: '10px 20px', borderRadius: '8px', border: 'none', background: 'var(--kimi-color-text-primary)', color: 'var(--kimi-color-surface)', fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}>
              Save Changes
            </button>
          </div>
        </div>
      )}

      {activeTab === 'markets' && (
        <div>
          {markets.map(m => (
            <div key={m.marketId} style={{ padding: '16px', borderRadius: '10px', border: '1px solid var(--kimi-color-border)', marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div>
                  <div style={{ fontSize: '16px', fontWeight: 500 }}>{m.name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--kimi-color-text-tertiary)', marginTop: '2px' }}>ID: {m.marketId}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Badge text={m.status} type={m.status === 'active' ? 'success' : m.status === 'maintenance' ? 'danger' : 'warning'} />
                  <button
                    onClick={() => handleMarketToggle(m.marketId)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '6px',
                      border: '1px solid var(--kimi-color-border)',
                      background: m.status === 'active' ? 'var(--kimi-color-danger)' : 'var(--kimi-color-positive)',
                      color: '#fff',
                      fontSize: '12px',
                      cursor: 'pointer',
                    }}
                  >
                    {m.status === 'active' ? 'Disable' : 'Enable'}
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: 'var(--kimi-color-text-secondary)', display: 'block', marginBottom: '4px' }}>Drop Multiplier</label>
                  <input type="number" value={m.dropMultiplier} readOnly style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--kimi-color-border)', background: 'transparent', fontSize: '13px' }} />
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: 'var(--kimi-color-text-secondary)', display: 'block', marginBottom: '4px' }}>XP Multiplier</label>
                  <input type="number" value={m.xpMultiplier} readOnly style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--kimi-color-border)', background: 'transparent', fontSize: '13px' }} />
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: 'var(--kimi-color-text-secondary)', display: 'block', marginBottom: '4px' }}>Max Players</label>
                  <input type="number" value={m.maxPlayers} readOnly style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--kimi-color-border)', background: 'transparent', fontSize: '13px' }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'reports' && (
        <div>
          <div style={{ borderRadius: '10px', border: '1px solid var(--kimi-color-border)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: 'color-mix(in srgb, var(--kimi-color-text-primary) 4%, transparent)' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 500, color: 'var(--kimi-color-text-secondary)' }}>Type</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 500, color: 'var(--kimi-color-text-secondary)' }}>Reporter</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 500, color: 'var(--kimi-color-text-secondary)' }}>Target</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 500, color: 'var(--kimi-color-text-secondary)' }}>Status</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 500, color: 'var(--kimi-color-text-secondary)' }}>Created</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 500, color: 'var(--kimi-color-text-secondary)' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {reports.map(r => (
                  <tr key={r.id} style={{ borderTop: '1px solid var(--kimi-color-border)' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <Badge text={r.type} type={r.type === 'cheating' ? 'danger' : r.type === 'scam' ? 'warning' : 'neutral'} />
                    </td>
                    <td style={{ padding: '12px 16px' }}>{r.reporterId}</td>
                    <td style={{ padding: '12px 16px' }}>{r.targetId}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <Badge text={r.status} type={r.status === 'open' ? 'warning' : r.status === 'resolved' ? 'success' : 'neutral'} />
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--kimi-color-text-tertiary)' }}>
                      {new Date(r.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                        <button onClick={() => handleReportStatus(r.id, 'resolved')} style={{ padding: '4px 10px', borderRadius: '6px', border: '1px solid var(--kimi-color-border)', background: 'var(--kimi-color-positive)', color: '#fff', fontSize: '11px', cursor: 'pointer' }}>Resolve</button>
                        <button onClick={() => handleReportStatus(r.id, 'dismissed')} style={{ padding: '4px 10px', borderRadius: '6px', border: '1px solid var(--kimi-color-border)', background: 'transparent', fontSize: '11px', cursor: 'pointer' }}>Dismiss</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div style={{ maxWidth: '600px' }}>
          <div style={{ padding: '16px', borderRadius: '10px', border: '1px solid var(--kimi-color-border)', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 500, margin: '0 0 16px' }}>Platform Settings</h3>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '12px', color: 'var(--kimi-color-text-secondary)', display: 'block', marginBottom: '6px' }}>Platform Name</label>
              <input type="text" defaultValue="NEXORUM" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--kimi-color-border)', background: 'transparent', color: 'var(--kimi-color-text-primary)', fontSize: '14px' }} />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '12px', color: 'var(--kimi-color-text-secondary)', display: 'block', marginBottom: '6px' }}>Maintenance Mode</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '40px', height: '22px', borderRadius: '11px', background: 'var(--kimi-color-border)', position: 'relative', cursor: 'pointer' }}>
                  <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'var(--kimi-color-surface)', position: 'absolute', top: '2px', left: '2px', transition: 'left 0.2s' }} />
                </div>
                <span style={{ fontSize: '13px', color: 'var(--kimi-color-text-secondary)' }}>Disabled</span>
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '12px', color: 'var(--kimi-color-text-secondary)', display: 'block', marginBottom: '6px' }}>Registration</label>
              <select style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--kimi-color-border)', background: 'transparent', color: 'var(--kimi-color-text-primary)', fontSize: '14px' }}>
                <option>Open</option>
                <option>Invite Only</option>
                <option>Closed</option>
              </select>
            </div>

            <button style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: 'var(--kimi-color-text-primary)', color: 'var(--kimi-color-surface)', fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}>
              Save Settings
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

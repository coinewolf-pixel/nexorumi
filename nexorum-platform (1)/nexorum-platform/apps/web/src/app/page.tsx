'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Wallet, Users, Sword, Car, Fish, Wheat, Shield, TrendingUp, MessageCircle, Mic, ShoppingBag, Bot, ChevronRight } from 'lucide-react';

const MARKETS = [
  { id: 'hunt', name: 'Hunt Arena', icon: Sword, color: 'from-red-500 to-orange-600', players: 1240 },
  { id: 'racing', name: 'Racing Circuit', icon: Car, color: 'from-blue-500 to-cyan-600', players: 890 },
  { id: 'fishing', name: 'Fishing Waters', icon: Fish, color: 'from-teal-500 to-emerald-600', players: 650 },
  { id: 'farm', name: 'Farm Valley', icon: Wheat, color: 'from-green-500 to-lime-600', players: 420 },
  { id: 'survival', name: 'Survival Zone', icon: Shield, color: 'from-purple-500 to-pink-600', players: 1100 },
];

export default function Home() {
  const [wallet, setWallet] = useState({ nexo_balance: 0, nexo_staked: 0 });
  const [level, setLevel] = useState(1);
  const [xp, setXp] = useState(0);

  useEffect(() => { setWallet({ nexo_balance: 15420.50, nexo_staked: 5000 }); setLevel(42); setXp(8750); }, []);

  const xpNeeded = level * 1000;
  const xpProgress = (xp / xpNeeded) * 100;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <header className="sticky top-0 z-50 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <span className="text-xl font-bold">N</span>
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">NEXORUM</h1>
              <p className="text-xs text-white/40">Platform Level {level}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition"><MessageCircle className="w-5 h-5" /></button>
            <button className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition"><Mic className="w-5 h-5" /></button>
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-500/30">
              <Wallet className="w-4 h-4 text-indigo-400" />
              <span className="font-mono font-bold">{wallet.nexo_balance.toLocaleString()} NEXO</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-6 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <Wallet className="w-8 h-8 text-indigo-400" />
              <span className="text-xs text-white/40">Total Balance</span>
            </div>
            <p className="text-3xl font-bold font-mono">{(wallet.nexo_balance + wallet.nexo_staked).toLocaleString()}</p>
            <p className="text-sm text-white/40 mt-1">NEXO Tokens</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="p-6 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <Trophy className="w-8 h-8 text-amber-400" />
              <span className="text-xs text-white/40">Global Rank</span>
            </div>
            <p className="text-3xl font-bold font-mono">#1,247</p>
            <p className="text-sm text-white/40 mt-1">Top 5% of players</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="p-6 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <Users className="w-8 h-8 text-emerald-400" />
              <span className="text-xs text-white/40">Friends Online</span>
            </div>
            <p className="text-3xl font-bold font-mono">12</p>
            <p className="text-sm text-white/40 mt-1">3 in matches</p>
          </motion.div>
        </div>

        <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
          <div className="flex items-center justify-between mb-3">
            <span className="font-bold">Platform Level {level}</span>
            <span className="text-sm text-white/40">{xp.toLocaleString()} / {xpNeeded.toLocaleString()} XP</span>
          </div>
          <div className="h-3 bg-white/10 rounded-full overflow-hidden">
            <motion.div initial={{ width: 0 }} animate={{ width: `${xpProgress}%` }} transition={{ duration: 1, ease: "easeOut" }} className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full" />
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-indigo-400" />
            Game Markets
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {MARKETS.map((market, i) => (
              <motion.button key={market.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1 }}
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                className="group relative p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all overflow-hidden">
                <div className={`absolute inset-0 bg-gradient-to-br ${market.color} opacity-0 group-hover:opacity-10 transition-opacity`} />
                <div className="relative flex items-start justify-between">
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${market.color}`}><market.icon className="w-6 h-6 text-white" /></div>
                  <ChevronRight className="w-5 h-5 text-white/20 group-hover:text-white/60 transition" />
                </div>
                <h3 className="relative mt-4 text-lg font-bold">{market.name}</h3>
                <p className="relative text-sm text-white/40 mt-1">{market.players.toLocaleString()} players online</p>
              </motion.button>
            ))}
            <motion.button initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 }}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              className="group relative p-6 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 hover:border-indigo-500/50 transition-all">
              <div className="flex items-start justify-between">
                <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600"><ShoppingBag className="w-6 h-6 text-white" /></div>
                <ChevronRight className="w-5 h-5 text-white/20 group-hover:text-white/60 transition" />
              </div>
              <h3 className="mt-4 text-lg font-bold">Global Market</h3>
              <p className="text-sm text-white/40 mt-1">Trade across all markets</p>
            </motion.button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition flex flex-col items-center gap-2">
            <Bot className="w-6 h-6 text-indigo-400" /><span className="text-sm font-medium">AI Assistant</span>
          </button>
          <button className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition flex flex-col items-center gap-2">
            <Mic className="w-6 h-6 text-emerald-400" /><span className="text-sm font-medium">Voice Chat</span>
          </button>
          <button className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition flex flex-col items-center gap-2">
            <Users className="w-6 h-6 text-amber-400" /><span className="text-sm font-medium">Find Party</span>
          </button>
          <button className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition flex flex-col items-center gap-2">
            <TrendingUp className="w-6 h-6 text-rose-400" /><span className="text-sm font-medium">Staking</span>
          </button>
        </div>
      </main>
    </div>
  );
}

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const MARKETS = [
  { id: 'hunt', name: 'Hunt', icon: '🎯', color: '#EF4444', players: 842 },
  { id: 'racing', name: 'Racing', icon: '🏎️', color: '#3B82F6', players: 412 },
  { id: 'fishing', name: 'Fishing', icon: '🎣', color: '#06B6D4', players: 1205 },
  { id: 'farm', name: 'Farm', icon: '🌾', color: '#22C55E', players: 2341 },
  { id: 'survival', name: 'Survival', icon: '⚔️', color: '#F59E0B', players: 678 },
];

const QUICK_STATS = [
  { label: 'NEXO', value: '12,450', icon: 'diamond', color: '#6366f1' },
  { label: 'Level', value: '42', icon: 'star', color: '#F59E0B' },
  { label: 'Rank', value: '#1,247', icon: 'trophy', color: '#A855F7' },
];

export default function HomeScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>NEXORUM</Text>
        <Text style={styles.subtitle}>Multi-Game Ecosystem</Text>
      </View>

      <View style={styles.statsRow}>
        {QUICK_STATS.map((stat) => (
          <View key={stat.label} style={styles.statCard}>
            <Ionicons name={stat.icon as any} size={20} color={stat.color} />
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Active Markets</Text>
      <View style={styles.marketsGrid}>
        {MARKETS.map((market) => (
          <TouchableOpacity key={market.id} style={[styles.marketCard, { borderLeftColor: market.color }]}>
            <Text style={styles.marketIcon}>{market.icon}</Text>
            <Text style={styles.marketName}>{market.name}</Text>
            <Text style={styles.marketPlayers}>{market.players} online</Text>
            <View style={[styles.liveIndicator, { backgroundColor: market.color }]} />
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="people" size={24} color="#fff" />
          <Text style={styles.actionText}>Find Party</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="chatbubbles" size={24} color="#fff" />
          <Text style={styles.actionText}>Global Chat</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="gift" size={24} color="#fff" />
          <Text style={styles.actionText}>Daily Reward</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  header: { padding: 24, paddingTop: 48 },
  logo: { fontSize: 28, fontWeight: '700', color: '#fff', letterSpacing: 1 },
  subtitle: { fontSize: 13, color: '#888', marginTop: 4 },
  statsRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 8 },
  statCard: {
    flex: 1, backgroundColor: '#141414', borderRadius: 12, padding: 16,
    alignItems: 'center', borderWidth: 1, borderColor: '#222',
  },
  statValue: { fontSize: 18, fontWeight: '600', color: '#fff', marginTop: 8 },
  statLabel: { fontSize: 11, color: '#666', marginTop: 4 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#fff', marginHorizontal: 16, marginTop: 24, marginBottom: 12 },
  marketsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, gap: 8 },
  marketCard: {
    width: (width - 48) / 2, backgroundColor: '#141414', borderRadius: 12,
    padding: 16, borderLeftWidth: 3, position: 'relative',
  },
  marketIcon: { fontSize: 28 },
  marketName: { fontSize: 15, fontWeight: '600', color: '#fff', marginTop: 8 },
  marketPlayers: { fontSize: 11, color: '#666', marginTop: 2 },
  liveIndicator: { position: 'absolute', top: 12, right: 12, width: 8, height: 8, borderRadius: 4 },
  actionsRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 32 },
  actionButton: {
    flex: 1, backgroundColor: '#1a1a1a', borderRadius: 12, padding: 16,
    alignItems: 'center', borderWidth: 1, borderColor: '#222',
  },
  actionText: { fontSize: 12, color: '#fff', marginTop: 8 },
});

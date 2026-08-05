import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const TOKENS = [
  { id: 'nexo', name: 'NEXO', balance: 12450, color: '#6366f1', icon: 'diamond' },
  { id: 'hunt', name: 'HUNT', balance: 850, color: '#EF4444', icon: 'target' },
  { id: 'race', name: 'RACE', balance: 320, color: '#3B82F6', icon: 'speedometer' },
  { id: 'fish', name: 'FISH', balance: 1200, color: '#06B6D4', icon: 'water' },
  { id: 'farm', name: 'FARM', balance: 5400, color: '#22C55E', icon: 'leaf' },
  { id: 'surv', name: 'SURV', balance: 210, color: '#F59E0B', icon: 'shield' },
];

export default function WalletScreen() {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Wallet</Text>

      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>Total Value</Text>
        <Text style={styles.totalValue}>$1,245.00</Text>
        <Text style={styles.totalChange}>+5.2% today</Text>
      </View>

      <Text style={styles.sectionTitle}>Balances</Text>
      {TOKENS.map((token) => (
        <View key={token.id} style={styles.tokenRow}>
          <View style={[styles.tokenIcon, { backgroundColor: `${token.color}20` }]}>
            <Ionicons name={token.icon as any} size={20} color={token.color} />
          </View>
          <View style={styles.tokenInfo}>
            <Text style={styles.tokenName}>{token.name}</Text>
            <Text style={styles.tokenPrice}>${(token.balance * 0.1).toFixed(2)}</Text>
          </View>
          <Text style={styles.tokenBalance}>{token.balance.toLocaleString()}</Text>
        </View>
      ))}

      <TouchableOpacity style={styles.depositButton}>
        <Ionicons name="add-circle" size={20} color="#fff" />
        <Text style={styles.depositText}>Deposit Crypto</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.stakeButton}>
        <Ionicons name="lock-closed" size={20} color="#6366f1" />
        <Text style={styles.stakeText}>Stake NEXO</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a', padding: 16 },
  title: { fontSize: 24, fontWeight: '700', color: '#fff', marginBottom: 16 },
  totalCard: { backgroundColor: '#141414', borderRadius: 16, padding: 24, borderWidth: 1, borderColor: '#222', marginBottom: 16 },
  totalLabel: { fontSize: 13, color: '#888' },
  totalValue: { fontSize: 32, fontWeight: '700', color: '#fff', marginTop: 4 },
  totalChange: { fontSize: 13, color: '#22C55E', marginTop: 4 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#fff', marginBottom: 12 },
  tokenRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#141414', borderRadius: 12, padding: 16, marginBottom: 8, borderWidth: 1, borderColor: '#222' },
  tokenIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  tokenInfo: { flex: 1, marginLeft: 12 },
  tokenName: { fontSize: 15, fontWeight: '600', color: '#fff' },
  tokenPrice: { fontSize: 12, color: '#666', marginTop: 2 },
  tokenBalance: { fontSize: 16, fontWeight: '600', color: '#fff' },
  depositButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#6366f1', borderRadius: 12, padding: 16, marginTop: 16, gap: 8 },
  depositText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  stakeButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#1a1a1a', borderRadius: 12, padding: 16, marginTop: 8, gap: 8, borderWidth: 1, borderColor: '#333' },
  stakeText: { color: '#6366f1', fontSize: 16, fontWeight: '600' },
});

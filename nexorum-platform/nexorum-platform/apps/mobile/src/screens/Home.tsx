import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const MARKETS = [
  { id: 'hunt', name: 'Hunt', color: '#ef4444' },
  { id: 'racing', name: 'Racing', color: '#3b82f6' },
  { id: 'fishing', name: 'Fishing', color: '#14b8a6' },
  { id: 'farm', name: 'Farm', color: '#22c55e' },
  { id: 'survival', name: 'Survival', color: '#a855f7' },
];

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.logo}>NEXORUM</Text>
          <View style={styles.levelBadge}><Text style={styles.levelText}>LVL 42</Text></View>
        </View>

        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>NEXO Balance</Text>
          <Text style={styles.balanceValue}>15,420.50</Text>
          <View style={styles.stakedRow}>
            <Text style={styles.stakedText}>Staked: 5,000 NEXO (12.5% APY)</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Markets</Text>
        <View style={styles.marketsGrid}>
          {MARKETS.map((market) => (
            <TouchableOpacity key={market.id} style={[styles.marketCard, { borderColor: market.color }]}>
              <View style={[styles.marketIcon, { backgroundColor: market.color + '20' }]}>
                <Text style={[styles.marketIconText, { color: market.color }]}>{market.name[0]}</Text>
              </View>
              <Text style={styles.marketName}>{market.name}</Text>
              <Text style={styles.marketPlayers}>1.2k online</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionBtn}><Text style={styles.actionText}>Find Match</Text></TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn}><Text style={styles.actionText}>Create Party</Text></TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f' },
  scroll: { padding: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  logo: { fontSize: 24, fontWeight: 'bold', color: 'white' },
  levelBadge: { backgroundColor: '#6366f1', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  levelText: { color: 'white', fontWeight: 'bold', fontSize: 12 },
  balanceCard: { backgroundColor: '#13131f', padding: 20, borderRadius: 16, marginBottom: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  balanceLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 14 },
  balanceValue: { color: 'white', fontSize: 32, fontWeight: 'bold' },
  stakedRow: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' },
  stakedText: { color: '#6366f1', fontSize: 13 },
  sectionTitle: { color: 'white', fontSize: 18, fontWeight: 'bold', marginBottom: 12, marginTop: 8 },
  marketsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  marketCard: { width: '47%', backgroundColor: '#13131f', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  marketIcon: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  marketIconText: { fontSize: 18, fontWeight: 'bold' },
  marketName: { color: 'white', fontWeight: 'bold', fontSize: 15 },
  marketPlayers: { color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 4 },
  actionsRow: { flexDirection: 'row', gap: 12 },
  actionBtn: { flex: 1, backgroundColor: '#6366f1', padding: 16, borderRadius: 12, alignItems: 'center' },
  actionText: { color: 'white', fontWeight: 'bold' },
});

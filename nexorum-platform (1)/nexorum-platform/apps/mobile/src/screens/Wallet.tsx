import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function WalletScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scroll}>
        <Text style={styles.title}>Wallet</Text>
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Available</Text>
          <Text style={styles.balanceValue}>15,420.50 NEXO</Text>
        </View>
        <View style={styles.stakeCard}>
          <Text style={styles.stakeTitle}>Staking Position</Text>
          <Text style={styles.stakeAmount}>5,000 NEXO @ 12.5% APY</Text>
          <Text style={styles.stakeTime}>30 days lock - 12 days remaining</Text>
          <TouchableOpacity style={styles.stakeBtn}><Text style={styles.stakeBtnText}>Claim Rewards</Text></TouchableOpacity>
        </View>
        <Text style={styles.sectionTitle}>Recent Transactions</Text>
        {[
          { type: 'reward', amount: 150, desc: 'Match reward' },
          { type: 'purchase', amount: -250, desc: 'Bought Shadow Bow' },
          { type: 'stake', amount: -5000, desc: 'Staked NEXO' },
        ].map((tx, i) => (
          <View key={i} style={styles.txRow}>
            <View><Text style={styles.txDesc}>{tx.desc}</Text><Text style={styles.txType}>{tx.type}</Text></View>
            <Text style={[styles.txAmount, tx.amount > 0 ? styles.positive : styles.negative]}>{tx.amount > 0 ? '+' : ''}{tx.amount} NEXO</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f' },
  scroll: { padding: 16 },
  title: { color: 'white', fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  balanceCard: { backgroundColor: '#13131f', padding: 20, borderRadius: 16, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  balanceLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 14 },
  balanceValue: { color: 'white', fontSize: 28, fontWeight: 'bold', marginTop: 8 },
  stakeCard: { backgroundColor: '#13131f', padding: 20, borderRadius: 16, marginBottom: 24, borderWidth: 1, borderColor: 'rgba(99,102,241,0.3)' },
  stakeTitle: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  stakeAmount: { color: '#6366f1', fontSize: 18, fontWeight: 'bold', marginTop: 8 },
  stakeTime: { color: 'rgba(255,255,255,0.4)', marginTop: 4, fontSize: 13 },
  stakeBtn: { backgroundColor: '#6366f1', padding: 12, borderRadius: 10, marginTop: 16, alignItems: 'center' },
  stakeBtnText: { color: 'white', fontWeight: 'bold' },
  sectionTitle: { color: 'white', fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  txRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  txDesc: { color: 'white', fontSize: 15 },
  txType: { color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 2, textTransform: 'capitalize' },
  txAmount: { fontWeight: 'bold', fontSize: 15 },
  positive: { color: '#22c55e' },
  negative: { color: '#ef4444' },
});

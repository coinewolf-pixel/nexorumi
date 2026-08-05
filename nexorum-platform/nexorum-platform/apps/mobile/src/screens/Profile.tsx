import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfileScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <View style={styles.avatar}><Text style={styles.avatarText}>P</Text></View>
          <Text style={styles.username}>PlayerOne</Text>
          <Text style={styles.handle}>@playerone</Text>
        </View>
        <View style={styles.statsGrid}>
          <View style={styles.statBox}><Text style={styles.statValue}>42</Text><Text style={styles.statLabel}>Level</Text></View>
          <View style={styles.statBox}><Text style={styles.statValue}>100</Text><Text style={styles.statLabel}>Reputation</Text></View>
          <View style={styles.statBox}><Text style={styles.statValue}>1,247</Text><Text style={styles.statLabel}>Rank</Text></View>
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Achievements</Text>
          <View style={styles.achievement}><Text style={styles.achName}>First Blood</Text><Text style={styles.achDesc}>Win your first match</Text></View>
          <View style={styles.achievement}><Text style={styles.achName}>Trader</Text><Text style={styles.achDesc}>Complete 10 trades</Text></View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f' },
  header: { alignItems: 'center', padding: 24 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#6366f1', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  avatarText: { color: 'white', fontSize: 32, fontWeight: 'bold' },
  username: { color: 'white', fontSize: 22, fontWeight: 'bold' },
  handle: { color: 'rgba(255,255,255,0.4)', marginTop: 4 },
  statsGrid: { flexDirection: 'row', paddingHorizontal: 16, gap: 12, marginBottom: 24 },
  statBox: { flex: 1, backgroundColor: '#13131f', padding: 16, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  statValue: { color: 'white', fontSize: 20, fontWeight: 'bold' },
  statLabel: { color: 'rgba(255,255,255,0.4)', marginTop: 4, fontSize: 12 },
  section: { padding: 16 },
  sectionTitle: { color: 'white', fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  achievement: { backgroundColor: '#13131f', padding: 16, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  achName: { color: 'white', fontWeight: 'bold' },
  achDesc: { color: 'rgba(255,255,255,0.4)', marginTop: 4, fontSize: 13 },
});

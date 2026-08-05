import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ACHIEVEMENTS = [
  { name: 'First Blood', icon: 'flame', color: '#EF4444' },
  { name: 'Veteran', icon: 'time', color: '#F59E0B' },
  { name: 'Trader', icon: 'swap-horizontal', color: '#22C55E' },
  { name: 'Champion', icon: 'trophy', color: '#A855F7' },
];

export default function ProfileScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={40} color="#666" />
        </View>
        <Text style={styles.username}>Player_One</Text>
        <Text style={styles.userId}>ID: 8f3a2b1c</Text>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>42</Text>
          <Text style={styles.statLabel}>Level</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>1,247</Text>
          <Text style={styles.statLabel}>Global Rank</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>87</Text>
          <Text style={styles.statLabel}>Reputation</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>156</Text>
          <Text style={styles.statLabel}>Games</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Achievements</Text>
      <View style={styles.achievementsRow}>
        {ACHIEVEMENTS.map((a) => (
          <View key={a.name} style={styles.achievement}>
            <Ionicons name={a.icon as any} size={24} color={a.color} />
            <Text style={styles.achievementName}>{a.name}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Recent Activity</Text>
      {[
        { action: 'Won match in Hunt Market', time: '2 min ago', reward: '+45 NEXO' },
        { action: 'Traded with Player_42', time: '15 min ago', reward: '-120 NEXO' },
        { action: 'Completed daily quest', time: '1 hr ago', reward: '+200 NEXO' },
      ].map((item, i) => (
        <View key={i} style={styles.activityRow}>
          <View style={styles.activityDot} />
          <View style={styles.activityInfo}>
            <Text style={styles.activityText}>{item.action}</Text>
            <Text style={styles.activityTime}>{item.time}</Text>
          </View>
          <Text style={styles.activityReward}>{item.reward}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  header: { alignItems: 'center', padding: 24, paddingTop: 48 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#1a1a1a', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#333' },
  username: { fontSize: 20, fontWeight: '700', color: '#fff', marginTop: 12 },
  userId: { fontSize: 12, color: '#666', marginTop: 4 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 8 },
  statBox: { width: '48%', backgroundColor: '#141414', borderRadius: 12, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#222' },
  statNumber: { fontSize: 20, fontWeight: '700', color: '#fff' },
  statLabel: { fontSize: 11, color: '#666', marginTop: 4 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#fff', marginHorizontal: 16, marginTop: 24, marginBottom: 12 },
  achievementsRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 8 },
  achievement: { flex: 1, backgroundColor: '#141414', borderRadius: 12, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: '#222' },
  achievementName: { fontSize: 11, color: '#888', marginTop: 8 },
  activityRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' },
  activityDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#6366f1', marginRight: 12 },
  activityInfo: { flex: 1 },
  activityText: { fontSize: 13, color: '#fff' },
  activityTime: { fontSize: 11, color: '#666', marginTop: 2 },
  activityReward: { fontSize: 13, color: '#22C55E', fontWeight: '600' },
});

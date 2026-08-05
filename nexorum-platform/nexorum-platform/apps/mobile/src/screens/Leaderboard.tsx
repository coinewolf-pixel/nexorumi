import { View, Text, FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const LEADERS = [
  { rank: 1, name: 'ShadowHunter', elo: 2450, wins: 142, market: 'hunt' },
  { rank: 2, name: 'SpeedDemon', elo: 2380, wins: 128, market: 'racing' },
  { rank: 3, name: 'FishMaster', elo: 2310, wins: 115, market: 'fishing' },
  { rank: 4, name: 'FarmKing', elo: 2250, wins: 98, market: 'farm' },
  { rank: 5, name: 'SurvivorX', elo: 2200, wins: 105, market: 'survival' },
];

export default function LeaderboardScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Global Leaderboard</Text>
      <FlatList
        data={LEADERS}
        keyExtractor={(item) => item.rank.toString()}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={[styles.rank, item.rank <= 3 && styles.topRank]}>#{item.rank}</Text>
            <View style={styles.userInfo}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.market}>{item.market}</Text>
            </View>
            <View style={styles.stats}>
              <Text style={styles.elo}>{item.elo} ELO</Text>
              <Text style={styles.wins}>{item.wins} wins</Text>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f', padding: 16 },
  title: { color: 'white', fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  row: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#13131f', borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  rank: { color: 'rgba(255,255,255,0.4)', width: 40, fontWeight: 'bold' },
  topRank: { color: '#f59e0b', fontSize: 18 },
  userInfo: { flex: 1 },
  name: { color: 'white', fontWeight: 'bold', fontSize: 15 },
  market: { color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 2, textTransform: 'capitalize' },
  stats: { alignItems: 'flex-end' },
  elo: { color: '#6366f1', fontWeight: 'bold' },
  wins: { color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 2 },
});

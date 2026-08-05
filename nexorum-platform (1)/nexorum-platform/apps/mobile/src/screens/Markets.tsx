import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const ITEMS = [
  { id: '1', name: 'Shadow Bow', price: 250, rarity: 'epic', market: 'hunt' },
  { id: '2', name: 'Turbo Engine', price: 300, rarity: 'epic', market: 'racing' },
  { id: '3', name: 'Mythic Rod', price: 500, rarity: 'legendary', market: 'fishing' },
  { id: '4', name: 'Golden Seeds', price: 75, rarity: 'epic', market: 'farm' },
];

const RARITY_COLORS = { common: '#9ca3af', uncommon: '#22c55e', rare: '#3b82f6', epic: '#a855f7', legendary: '#f59e0b', mythic: '#ef4444', divine: '#6366f1' };

export default function MarketsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Marketplace</Text>
      <FlatList
        data={ITEMS}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.itemCard}>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={[styles.rarity, { color: RARITY_COLORS[item.rarity as keyof typeof RARITY_COLORS] }]}>{item.rarity.toUpperCase()}</Text>
            </View>
            <Text style={styles.price}>{item.price} NEXO</Text>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f', padding: 16 },
  title: { color: 'white', fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  itemCard: { backgroundColor: '#13131f', padding: 16, borderRadius: 12, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  itemInfo: { flex: 1 },
  itemName: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  rarity: { fontSize: 12, marginTop: 4, fontWeight: '600' },
  price: { color: '#6366f1', fontWeight: 'bold', fontSize: 16 },
});

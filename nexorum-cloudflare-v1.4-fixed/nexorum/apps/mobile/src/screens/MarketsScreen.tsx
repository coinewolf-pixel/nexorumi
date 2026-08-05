import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';

const MODES = ['Solo', 'Duo', 'Squad', 'Ranked'];

const MARKETS = [
  { id: 'hunt', name: 'Hunt Market', color: '#EF4444', description: 'Track, hunt, survive' },
  { id: 'racing', name: 'Racing Market', color: '#3B82F6', description: 'High-speed competition' },
  { id: 'fishing', name: 'Fishing Market', color: '#06B6D4', description: 'Relax and reel' },
  { id: 'farm', name: 'Farm Market', color: '#22C55E', description: 'Grow and harvest' },
  { id: 'survival', name: 'Survival Market', color: '#F59E0B', description: 'Last one standing' },
];

export default function MarketsScreen() {
  const [selectedMarket, setSelectedMarket] = useState<string | null>(null);
  const [selectedMode, setSelectedMode] = useState('Solo');

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Markets</Text>

      {!selectedMarket ? (
        <View style={styles.marketList}>
          {MARKETS.map((m) => (
            <TouchableOpacity key={m.id} style={styles.marketRow} onPress={() => setSelectedMarket(m.id)}>
              <View style={[styles.marketDot, { backgroundColor: m.color }]} />
              <View style={styles.marketInfo}>
                <Text style={styles.marketName}>{m.name}</Text>
                <Text style={styles.marketDesc}>{m.description}</Text>
              </View>
              <Text style={styles.arrow}>›</Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <View>
          <TouchableOpacity onPress={() => setSelectedMarket(null)}>
            <Text style={styles.backButton}>‹ Back to Markets</Text>
          </TouchableOpacity>

          <Text style={styles.marketTitle}>{MARKETS.find(m => m.id === selectedMarket)?.name}</Text>

          <View style={styles.modeRow}>
            {MODES.map((mode) => (
              <TouchableOpacity
                key={mode}
                style={[styles.modeButton, selectedMode === mode && styles.modeButtonActive]}
                onPress={() => setSelectedMode(mode)}
              >
                <Text style={[styles.modeText, selectedMode === mode && styles.modeTextActive]}>{mode}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.queueButton}>
            <Text style={styles.queueButtonText}>Find Match (AI Matchmaking)</Text>
          </TouchableOpacity>

          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>AI Matchmaking</Text>
            <Text style={styles.infoText}>Our ML model analyzes your playstyle, latency, and skill to find the perfect opponents and teammates.</Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a', padding: 16 },
  title: { fontSize: 24, fontWeight: '700', color: '#fff', marginBottom: 16 },
  marketList: { gap: 8 },
  marketRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#141414',
    borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#222',
  },
  marketDot: { width: 12, height: 12, borderRadius: 6, marginRight: 12 },
  marketInfo: { flex: 1 },
  marketName: { fontSize: 16, fontWeight: '600', color: '#fff' },
  marketDesc: { fontSize: 12, color: '#666', marginTop: 2 },
  arrow: { fontSize: 20, color: '#666' },
  backButton: { fontSize: 14, color: '#6366f1', marginBottom: 16 },
  marketTitle: { fontSize: 22, fontWeight: '700', color: '#fff', marginBottom: 16 },
  modeRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  modeButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: '#333' },
  modeButtonActive: { backgroundColor: '#6366f1', borderColor: '#6366f1' },
  modeText: { color: '#888', fontSize: 14 },
  modeTextActive: { color: '#fff', fontWeight: '600' },
  queueButton: { backgroundColor: '#6366f1', borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 16 },
  queueButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  infoCard: { backgroundColor: '#141414', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#222' },
  infoTitle: { fontSize: 14, fontWeight: '600', color: '#fff', marginBottom: 8 },
  infoText: { fontSize: 12, color: '#888', lineHeight: 18 },
});

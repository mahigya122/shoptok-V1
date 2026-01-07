import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useLocalInteractions } from '../store/localInteractions';
import { colors } from '../constants/colors';

export default function ProfileScreen() {
  const uploads = useLocalInteractions((s) => s.uploads);

  return (
    <View style={styles.container}>
      <Text style={styles.h}>Profile</Text>
      <Text style={styles.sub}>Your uploads</Text>
      <FlatList
        data={uploads}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={styles.title}>{item.title || item.caption || item.id}</Text>
            <Text style={styles.small}>{new Date(item.created_at).toLocaleString()}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No uploads yet.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: colors.background },
  h: { color: colors.text, fontSize: 20, fontWeight: '700' },
  sub: { color: colors.textMuted, marginBottom: 12 },
  row: { paddingVertical: 12, borderBottomWidth: 1, borderColor: '#111' },
  title: { color: colors.text, fontWeight: '600' },
  small: { color: colors.textMuted, fontSize: 12 },
  empty: { color: colors.textMuted }
});

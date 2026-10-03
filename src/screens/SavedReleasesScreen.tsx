import React, { useEffect, useRef, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { Colors } from '../theme/colors';
import { Release, subscribeToSavedReleases, getRelease } from '../firebase/firestore';
import ReleaseCard from '../components/ReleaseCard';

interface Props {
  currentUid: string;
  onOpenRelease: (release: Release) => void;
  onBack: () => void;
}

export default function SavedReleasesScreen({ currentUid, onOpenRelease, onBack }: Props) {
  const [releases, setReleases] = useState<Release[]>([]);
  const [loading, setLoading] = useState(true);
  const cache = useRef(new Map<string, Release | null>());

  useEffect(() => {
    let cancelled = false;
    const unsub = subscribeToSavedReleases(currentUid, async saved => {
      const missing = saved.map(s => s.releaseId).filter(id => !cache.current.has(id));
      const fetched = await Promise.all(missing.map(id => getRelease(id)));
      missing.forEach((id, i) => cache.current.set(id, fetched[i]));
      if (cancelled) return;
      // Saved docs arrive newest-first; skip releases that no longer exist.
      setReleases(
        saved.map(s => cache.current.get(s.releaseId)).filter((r): r is Release => !!r)
      );
      setLoading(false);
    });
    return () => {
      cancelled = true;
      unsub();
    };
  }, [currentUid]);

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={onBack} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Text style={s.backText}>←</Text>
        </TouchableOpacity>
        <Text style={s.title}>Saved</Text>
        <View style={{ width: 22 }} />
      </View>

      <FlatList
        data={releases}
        keyExtractor={r => r.id}
        renderItem={({ item }) => <ReleaseCard release={item} onPress={() => onOpenRelease(item)} />}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          loading ? null : (
            <View style={s.empty}>
              <Text style={s.emptyTitle}>Nothing saved yet.</Text>
              <Text style={s.emptyBody}>Tap the bookmark on any release to keep it here.</Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  backText: { fontSize: 22, color: Colors.cream },
  title: { fontFamily: 'BigShouldersDisplay_900Black', fontSize: 22, color: Colors.cream },
  empty: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 40 },
  emptyTitle: { fontFamily: 'BigShouldersDisplay_900Black', fontSize: 20, color: Colors.cream, marginBottom: 6 },
  emptyBody: { fontFamily: 'Inter_400Regular', fontSize: 14, color: Colors.mutedText, textAlign: 'center' },
});

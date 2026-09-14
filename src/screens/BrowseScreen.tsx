import React, { useEffect, useState } from 'react';
import {
  View, Text, Image, FlatList, TouchableOpacity, StyleSheet, SafeAreaView,
} from 'react-native';
import { Colors } from '../theme/colors';
import { Release, subscribeToWeeklyReleases } from '../firebase/firestore';

function currentWeekOf(): string {
  const d = new Date();
  const day = d.getDay();
  const diffToFriday = (day >= 5 ? day - 5 : day + 2);
  const friday = new Date(d);
  friday.setDate(d.getDate() - diffToFriday);
  return friday.toISOString().slice(0, 10);
}

function ReleaseCard({ release, onPress }: { release: Release; onPress: () => void }) {
  return (
    <TouchableOpacity style={rc.card} onPress={onPress} activeOpacity={0.85}>
      <View style={rc.art}>
        {release.coverArtUrl ? (
          <Image source={{ uri: release.coverArtUrl }} style={rc.artImage} />
        ) : (
          <Text style={rc.artFallback}>{release.artist[0]?.toUpperCase()}</Text>
        )}
      </View>
      <View style={rc.body}>
        <Text style={rc.title} numberOfLines={1}><Text style={rc.artist}>{release.artist}</Text>  {release.title}</Text>
        <View style={rc.tagRow}>
          <View style={rc.tag}><Text style={rc.tagText}>{release.format}</Text></View>
          <View style={rc.tag}><Text style={rc.tagText}>{release.tier === 'indie' ? 'INDIE' : 'MAJOR'}</Text></View>
          {release.genres[0] ? (
            <View style={rc.tag}><Text style={rc.tagText}>{release.genres[0].toUpperCase()}</Text></View>
          ) : null}
        </View>
        {release.blurb ? <Text style={rc.blurb} numberOfLines={2}>{release.blurb}</Text> : null}
        <Text style={rc.commentCount}>💬 {release.commentCount ?? 0}</Text>
      </View>
    </TouchableOpacity>
  );
}

const rc = StyleSheet.create({
  card: {
    flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  art: {
    width: 64, height: 64, backgroundColor: Colors.darkBrown,
    alignItems: 'center', justifyContent: 'center', marginRight: 14,
  },
  artImage: { width: 64, height: 64 },
  artFallback: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 26, color: Colors.olive },
  body: { flex: 1, justifyContent: 'center' },
  title: { fontFamily: 'PlayfairDisplay_400Regular', fontSize: 15, color: Colors.cream, marginBottom: 6 },
  artist: { fontFamily: 'PlayfairDisplay_700Bold' },
  tagRow: { flexDirection: 'row', gap: 6, marginBottom: 6 },
  tag: { borderWidth: 1, borderColor: Colors.olive, paddingHorizontal: 6, paddingVertical: 1 },
  tagText: { fontFamily: 'SpaceMono_400Regular', fontSize: 8, color: Colors.olive, letterSpacing: 1 },
  blurb: { fontFamily: 'System', fontSize: 12, color: Colors.mutedText, lineHeight: 17, marginBottom: 4 },
  commentCount: { fontFamily: 'SpaceMono_400Regular', fontSize: 10, color: Colors.amber },
});

interface Props {
  onOpenRelease: (release: Release) => void;
}

export default function BrowseScreen({ onOpenRelease }: Props) {
  const [releases, setReleases] = useState<Release[]>([]);

  useEffect(() => {
    const unsub = subscribeToWeeklyReleases(currentWeekOf(), setReleases);
    return unsub;
  }, []);

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.wordmark}>Browse</Text>
        <Text style={s.eyebrow}>THIS WEEK</Text>
      </View>

      <FlatList
        data={releases}
        keyExtractor={r => r.id}
        renderItem={({ item }) => (
          <ReleaseCard release={item} onPress={() => onOpenRelease(item)} />
        )}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={s.emptyTitle}>Nothing published yet.</Text>
            <Text style={s.emptyBody}>Check back Friday.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingHorizontal: 20, paddingTop: 8, paddingBottom: 14,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  wordmark: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 26, color: Colors.cream },
  eyebrow: { fontFamily: 'SpaceMono_400Regular', fontSize: 9, color: Colors.amber, letterSpacing: 3, marginTop: 4 },
  empty: { padding: 48, alignItems: 'center' },
  emptyTitle: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 20, color: Colors.cream, marginBottom: 8 },
  emptyBody: { fontFamily: 'System', fontSize: 14, color: Colors.mutedText },
});

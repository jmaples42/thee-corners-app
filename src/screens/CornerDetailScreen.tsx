import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, SafeAreaView,
} from 'react-native';
import { Colors } from '../theme/colors';
import { Font } from '../theme/typography';
import { Corner, Post, subscribeToCornerPosts } from '../firebase/firestore';
import PostCard from '../components/PostCard';

interface Props {
  corner: Corner;
  currentUid: string;
  onBack: () => void;
  onCompose: () => void;
}

export default function CornerDetailScreen({ corner, currentUid, onBack, onCompose }: Props) {
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    const unsub = subscribeToCornerPosts(corner.id, setPosts);
    return unsub;
  }, [corner.id]);

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={onBack} style={s.backBtn} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Text style={s.backText}>←</Text>
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={s.cornerName}>{corner.name}</Text>
          <Text style={s.memberCount}>
            {corner.memberUids.length} {corner.memberUids.length === 1 ? 'member' : 'members'}
          </Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={posts}
        keyExtractor={p => p.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        renderItem={({ item }) => <PostCard post={item} currentUid={currentUid} cornerId={corner.id} />}
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={s.emptyTitle}>Nothing here yet.</Text>
            <Text style={s.emptyBody}>Drop the first corner.</Text>
          </View>
        }
      />

      <TouchableOpacity style={s.fab} onPress={onCompose} activeOpacity={0.85}>
        <Text style={s.fabText}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  backBtn: { width: 40, alignItems: 'flex-start' },
  backText: { fontSize: 22, color: Colors.cream },
  headerCenter: { flex: 1, alignItems: 'center' },
  cornerName: { fontFamily: Font.display, fontSize: 16, color: Colors.cream },
  memberCount: {
    fontFamily: Font.label, fontSize: 12,
    color: Colors.mutedText, letterSpacing: 1, marginTop: 2,
  },
  empty: { padding: 48, alignItems: 'center' },
  emptyTitle: { fontFamily: Font.display, fontSize: 20, color: Colors.cream, marginBottom: 8 },
  emptyBody: { fontFamily: Font.body, fontSize: 16, color: Colors.mutedText },
  fab: {
    position: 'absolute', bottom: 24, right: 24,
    width: 52, height: 52, backgroundColor: Colors.rust,
    alignItems: 'center', justifyContent: 'center',
  },
  fabText: { fontFamily: Font.body, fontSize: 32, color: Colors.onRust, lineHeight: 38 },
});

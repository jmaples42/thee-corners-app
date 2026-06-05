import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  SafeAreaView, RefreshControl,
} from 'react-native';
import { Colors } from '../theme/colors';
import { MOCK_POSTS, Post, PostTag } from '../firebase/firestore';

const TABS: PostTag[] = ['On Rotation', 'Digging This Week', 'Recent Discovery'];
const REACTIONS = ['🔥', '🫀', '🌙', '🐘'];
const SOURCE_COLORS: Record<string, string> = {
  spotify: '#1DB954',
  bandcamp: '#1da0c3',
  youtube: '#FF0000',
  soundcloud: '#FF5500',
  other: Colors.mutedText,
};

function timeAgo(ts: number) {
  const d = Date.now() - ts;
  if (d < 3600000) return `${Math.floor(d / 60000)}m ago`;
  if (d < 86400000) return `${Math.floor(d / 3600000)}h ago`;
  return `${Math.floor(d / 86400000)}d ago`;
}

function LinkCard({ link: _link, linkMeta }: Pick<Post, 'link' | 'linkMeta'>) {
  return (
    <View style={lc.card}>
      <View style={lc.art}>
        <Text style={lc.artText}>{linkMeta.source[0].toUpperCase()}</Text>
      </View>
      <View style={lc.meta}>
        <Text style={lc.title} numberOfLines={2}>{linkMeta.title}</Text>
        <View style={[lc.sourceBadge, { borderColor: SOURCE_COLORS[linkMeta.source] }]}>
          <Text style={[lc.sourceText, { color: SOURCE_COLORS[linkMeta.source] }]}>
            {linkMeta.source.toUpperCase()}
          </Text>
        </View>
      </View>
    </View>
  );
}

const lc = StyleSheet.create({
  card: { flexDirection: 'row', backgroundColor: Colors.cardBg, borderLeftWidth: 2, borderLeftColor: Colors.rust, padding: 12, marginBottom: 12 },
  art: { width: 52, height: 52, backgroundColor: Colors.darkBrown, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  artText: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 22, color: Colors.olive },
  meta: { flex: 1, justifyContent: 'space-between' },
  title: { fontFamily: 'PlayfairDisplay_400Regular', fontSize: 14, color: Colors.cream, lineHeight: 20 },
  sourceBadge: { borderWidth: 1, paddingHorizontal: 6, paddingVertical: 2, alignSelf: 'flex-start', marginTop: 6 },
  sourceText: { fontFamily: 'SpaceMono_400Regular', fontSize: 8, letterSpacing: 1 },
});

function PostCard({ post, currentUid }: { post: Post; currentUid: string }) {
  const [reactions, setReactions] = useState(post.reactions);

  const toggleReaction = (emoji: string) => {
    setReactions(prev => {
      const current = prev[emoji] ?? [];
      const hasReacted = current.includes(currentUid);
      return {
        ...prev,
        [emoji]: hasReacted
          ? current.filter(u => u !== currentUid)
          : [...current, currentUid],
      };
    });
  };

  return (
    <View style={pc.card}>
      <View style={pc.header}>
        <View style={pc.avatar}>
          <Text style={pc.avatarText}>{post.username[0].toUpperCase()}</Text>
        </View>
        <View style={pc.headerRight}>
          <Text style={pc.username}>@{post.username}</Text>
          <View style={pc.metaRow}>
            <Text style={pc.timestamp}>{timeAgo(post.createdAt)}</Text>
            <View style={pc.genreBadge}>
              <Text style={pc.genreText}>{post.genres[0]}</Text>
            </View>
          </View>
        </View>
      </View>

      <LinkCard link={post.link} linkMeta={post.linkMeta} />

      <Text style={pc.note}>{post.text}</Text>

      <View style={pc.reactionStrip}>
        {REACTIONS.map(emoji => {
          const uids = reactions[emoji] ?? [];
          const active = uids.includes(currentUid);
          return (
            <TouchableOpacity
              key={emoji}
              style={[pc.reactionBtn, active && pc.reactionBtnActive]}
              onPress={() => toggleReaction(emoji)}
            >
              <Text style={pc.reactionEmoji}>{emoji}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={pc.divider} />
    </View>
  );
}

const pc = StyleSheet.create({
  card: { paddingHorizontal: 20, paddingTop: 18 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  avatar: { width: 34, height: 34, backgroundColor: Colors.border, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  avatarText: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 15, color: Colors.amber },
  headerRight: { flex: 1 },
  username: { fontFamily: 'SpaceMono_400Regular', fontSize: 12, color: Colors.cream },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  timestamp: { fontFamily: 'SpaceMono_400Regular', fontSize: 10, color: Colors.mutedText },
  genreBadge: { borderWidth: 1, borderColor: Colors.olive, paddingHorizontal: 6, paddingVertical: 1 },
  genreText: { fontFamily: 'SpaceMono_400Regular', fontSize: 8, color: Colors.olive, letterSpacing: 1 },
  note: { fontFamily: 'System', fontSize: 14, color: Colors.cream, lineHeight: 22, marginBottom: 14, opacity: 0.9 },
  reactionStrip: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  reactionBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.cardBg },
  reactionBtnActive: { borderColor: Colors.rust, backgroundColor: '#2a1510' },
  reactionEmoji: { fontSize: 18 },
  divider: { height: 1, backgroundColor: Colors.border },
});

export default function FeedScreen({ currentUid, onCompose }: { currentUid: string; onCompose: () => void }) {
  const [activeTab, setActiveTab] = useState<PostTag>('On Rotation');
  const [refreshing, setRefreshing] = useState(false);

  const filtered = MOCK_POSTS
    .filter(p => p.tag === activeTab)
    .sort((a, b) => b.createdAt - a.createdAt);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1200);
  }, []);

  return (
    <SafeAreaView style={fs.container}>
      <View style={fs.header}>
        <Text style={fs.wordmark}>Corners</Text>
      </View>

      {/* Tab strip */}
      <View style={fs.tabStrip}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab}
            style={[fs.tabBtn, activeTab === tab && fs.tabBtnActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[fs.tabText, activeTab === tab && fs.tabTextActive]} numberOfLines={1}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={p => p.id}
        renderItem={({ item }) => <PostCard post={item} currentUid={currentUid} />}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.amber} />}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={fs.empty}>
            <Text style={fs.emptyText}>Nothing in this corner yet.</Text>
          </View>
        }
      />

      {/* FAB */}
      <TouchableOpacity style={fs.fab} onPress={onCompose} activeOpacity={0.85}>
        <Text style={fs.fabText}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const fs = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: Colors.border },
  wordmark: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 26, color: Colors.cream },
  tabStrip: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: Colors.border },
  tabBtn: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabBtnActive: { borderBottomWidth: 2, borderBottomColor: Colors.rust },
  tabText: { fontFamily: 'SpaceMono_400Regular', fontSize: 8, color: Colors.mutedText, letterSpacing: 1 },
  tabTextActive: { color: Colors.cream },
  empty: { padding: 40, alignItems: 'center' },
  emptyText: { fontFamily: 'PlayfairDisplay_400Regular', fontSize: 16, color: Colors.mutedText },
  fab: {
    position: 'absolute', bottom: 24, right: 24,
    width: 52, height: 52, backgroundColor: Colors.rust,
    alignItems: 'center', justifyContent: 'center',
  },
  fabText: { fontFamily: 'System', fontSize: 32, color: Colors.cream, lineHeight: 38 },
});

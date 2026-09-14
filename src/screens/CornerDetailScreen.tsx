import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, SafeAreaView,
} from 'react-native';
import { Colors } from '../theme/colors';
import { Corner, Post, subscribeToCornerPosts, toggleReaction } from '../firebase/firestore';

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

function PostCard({ post, currentUid, cornerId }: { post: Post; currentUid: string; cornerId: string }) {
  const reactions = post.reactions;

  const handleToggleReaction = (emoji: string) => {
    const current = reactions[emoji] ?? [];
    const hasReacted = current.includes(currentUid);
    toggleReaction(cornerId, post.id, emoji, currentUid, hasReacted);
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
            <View style={pc.tagBadge}>
              <Text style={pc.tagText}>{post.tag}</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={pc.linkCard}>
        <View style={pc.linkArt}>
          <Text style={pc.linkArtText}>{post.linkMeta.source[0].toUpperCase()}</Text>
        </View>
        <View style={pc.linkMeta}>
          <Text style={pc.linkTitle} numberOfLines={2}>{post.linkMeta.title}</Text>
          <View style={[pc.sourceBadge, { borderColor: SOURCE_COLORS[post.linkMeta.source] }]}>
            <Text style={[pc.sourceText, { color: SOURCE_COLORS[post.linkMeta.source] }]}>
              {post.linkMeta.source.toUpperCase()}
            </Text>
          </View>
        </View>
      </View>

      <Text style={pc.note}>{post.text}</Text>

      <View style={pc.reactionStrip}>
        {REACTIONS.map(emoji => {
          const uids = reactions[emoji] ?? [];
          const active = uids.includes(currentUid);
          return (
            <TouchableOpacity
              key={emoji}
              style={[pc.reactionBtn, active && pc.reactionBtnActive]}
              onPress={() => handleToggleReaction(emoji)}
            >
              <Text style={pc.reactionEmoji}>{emoji}</Text>
              {uids.length > 0 && (
                <Text style={pc.reactionCount}>{uids.length}</Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={pc.divider} />
    </View>
  );
}

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
  cornerName: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 16, color: Colors.cream },
  memberCount: {
    fontFamily: 'SpaceMono_400Regular', fontSize: 9,
    color: Colors.mutedText, letterSpacing: 1, marginTop: 2,
  },
  empty: { padding: 48, alignItems: 'center' },
  emptyTitle: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 20, color: Colors.cream, marginBottom: 8 },
  emptyBody: { fontFamily: 'System', fontSize: 14, color: Colors.mutedText },
  fab: {
    position: 'absolute', bottom: 24, right: 24,
    width: 52, height: 52, backgroundColor: Colors.rust,
    alignItems: 'center', justifyContent: 'center',
  },
  fabText: { fontFamily: 'System', fontSize: 32, color: Colors.cream, lineHeight: 38 },
});

const pc = StyleSheet.create({
  card: { paddingHorizontal: 20, paddingTop: 18 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  avatar: {
    width: 34, height: 34, backgroundColor: Colors.border,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  avatarText: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 15, color: Colors.amber },
  headerRight: { flex: 1 },
  username: { fontFamily: 'SpaceMono_400Regular', fontSize: 12, color: Colors.cream },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  timestamp: { fontFamily: 'SpaceMono_400Regular', fontSize: 10, color: Colors.mutedText },
  tagBadge: { borderWidth: 1, borderColor: Colors.olive, paddingHorizontal: 6, paddingVertical: 1 },
  tagText: { fontFamily: 'SpaceMono_400Regular', fontSize: 8, color: Colors.olive, letterSpacing: 1 },
  linkCard: {
    flexDirection: 'row', backgroundColor: Colors.cardBg,
    borderLeftWidth: 2, borderLeftColor: Colors.rust,
    padding: 12, marginBottom: 12,
  },
  linkArt: {
    width: 52, height: 52, backgroundColor: Colors.darkBrown,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  linkArtText: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 22, color: Colors.olive },
  linkMeta: { flex: 1, justifyContent: 'space-between' },
  linkTitle: { fontFamily: 'PlayfairDisplay_400Regular', fontSize: 14, color: Colors.cream, lineHeight: 20 },
  sourceBadge: { borderWidth: 1, paddingHorizontal: 6, paddingVertical: 2, alignSelf: 'flex-start', marginTop: 6 },
  sourceText: { fontFamily: 'SpaceMono_400Regular', fontSize: 8, letterSpacing: 1 },
  note: { fontFamily: 'System', fontSize: 14, color: Colors.cream, lineHeight: 22, marginBottom: 14, opacity: 0.9 },
  reactionStrip: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  reactionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 8,
    borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.cardBg,
  },
  reactionBtnActive: { borderColor: Colors.rust, backgroundColor: '#2a1510' },
  reactionEmoji: { fontSize: 16 },
  reactionCount: { fontFamily: 'SpaceMono_400Regular', fontSize: 10, color: Colors.mutedText },
  divider: { height: 1, backgroundColor: Colors.border },
});

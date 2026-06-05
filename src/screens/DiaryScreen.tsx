import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  SafeAreaView, Share, Alert,
} from 'react-native';
import { Colors } from '../theme/colors';
import { MOCK_POSTS, Post, PostTag } from '../firebase/firestore';

const TAGS: PostTag[] = ['On Rotation', 'Digging This Week', 'Recent Discovery'];

const DUMMY_BADGES = [
  { icon: '🎙', label: 'First Corner', earned: true },
  { icon: '🔥', label: 'Seven Nights', earned: false },
];

function timeAgo(ts: number) {
  const d = Date.now() - ts;
  if (d < 3600000) return `${Math.floor(d / 60000)}m ago`;
  if (d < 86400000) return `${Math.floor(d / 3600000)}h ago`;
  return `${Math.floor(d / 86400000)}d ago`;
}

async function sharePost(post: Post) {
  // TODO: generate real deep link via dynamic links or branch.io
  const message = `"${post.text}"\n\nListening: ${post.linkMeta.title}\n\nvia Corners`;
  try {
    await Share.share({ message, url: post.link });
  } catch (_e) {
    Alert.alert('Could not share');
  }
}

function PostGroup({ tag, posts }: { tag: PostTag; posts: Post[] }) {
  if (posts.length === 0) return null;
  return (
    <View style={dg.group}>
      <Text style={dg.groupLabel}>{tag.toUpperCase()}</Text>
      {posts.map(post => (
        <View key={post.id} style={dg.card}>
          <View style={dg.cardTop}>
            <View style={dg.trackInfo}>
              <Text style={dg.trackTitle} numberOfLines={1}>{post.linkMeta.title}</Text>
              <Text style={dg.source}>{post.linkMeta.source}</Text>
            </View>
            <TouchableOpacity style={dg.shareBtn} onPress={() => sharePost(post)}>
              <Text style={dg.shareBtnText}>Share</Text>
            </TouchableOpacity>
          </View>
          <Text style={dg.note} numberOfLines={3}>{post.text}</Text>
          <Text style={dg.timestamp}>{timeAgo(post.createdAt)}</Text>
        </View>
      ))}
    </View>
  );
}

const dg = StyleSheet.create({
  group: { marginBottom: 28, paddingHorizontal: 20 },
  groupLabel: { fontFamily: 'SpaceMono_400Regular', fontSize: 8, color: Colors.amber, letterSpacing: 3, marginBottom: 12 },
  card: { backgroundColor: Colors.cardBg, borderLeftWidth: 2, borderLeftColor: Colors.rust, padding: 14, marginBottom: 10 },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  trackInfo: { flex: 1 },
  trackTitle: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 15, color: Colors.cream },
  source: { fontFamily: 'SpaceMono_400Regular', fontSize: 9, color: Colors.olive, letterSpacing: 1, marginTop: 2 },
  shareBtn: { borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 10, paddingVertical: 5, marginLeft: 12 },
  shareBtnText: { fontFamily: 'SpaceMono_400Regular', fontSize: 9, color: Colors.mutedText, letterSpacing: 1 },
  note: { fontFamily: 'System', fontSize: 13, color: Colors.cream, lineHeight: 20, opacity: 0.8, marginBottom: 8 },
  timestamp: { fontFamily: 'SpaceMono_400Regular', fontSize: 9, color: Colors.mutedText },
});

export default function DiaryScreen({ onSignOut }: { onSignOut: () => void }) {
  const allPosts: Post[] = MOCK_POSTS;

  return (
    <SafeAreaView style={s.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile header */}
        <View style={s.header}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>Y</Text>
          </View>
          <View style={s.profileInfo}>
            <Text style={s.displayName}>your_handle</Text>
            <View style={s.genreRow}>
              {['shoegaze', 'doom'].map(g => (
                <View key={g} style={s.genrePill}>
                  <Text style={s.genrePillText}>{g}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Badges */}
        <View style={s.badgesSection}>
          <Text style={s.sectionLabel}>FLAIR</Text>
          <View style={s.badges}>
            {DUMMY_BADGES.map(b => (
              <View key={b.label} style={[s.badge, !b.earned && s.badgeUnearned]}>
                <Text style={s.badgeIcon}>{b.icon}</Text>
                <Text style={[s.badgeLabel, !b.earned && s.badgeLabelUnearned]}>{b.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={s.divider} />

        {/* Post groups */}
        <View style={s.postsSection}>
          <Text style={[s.sectionLabel, { paddingHorizontal: 20 }]}>MY CORNERS</Text>
          {TAGS.map(tag => (
            <PostGroup
              key={tag}
              tag={tag}
              posts={allPosts.filter(p => p.tag === tag)}
            />
          ))}
          {allPosts.length === 0 && (
            <View style={s.empty}>
              <Text style={s.emptyText}>You haven't dropped any corners yet.</Text>
            </View>
          )}
        </View>

        {/* Sign out */}
        <View style={s.signOutArea}>
          <TouchableOpacity style={s.signOutBtn} onPress={onSignOut}>
            <Text style={s.signOutText}>SIGN OUT</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: Colors.border },
  avatar: { width: 60, height: 60, backgroundColor: Colors.darkBrown, borderWidth: 2, borderColor: Colors.rust, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  avatarText: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 28, color: Colors.amber },
  profileInfo: { flex: 1 },
  displayName: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 20, color: Colors.cream, marginBottom: 8 },
  genreRow: { flexDirection: 'row', gap: 6 },
  genrePill: { borderWidth: 1, borderColor: Colors.olive, paddingHorizontal: 8, paddingVertical: 3 },
  genrePillText: { fontFamily: 'SpaceMono_400Regular', fontSize: 8, color: Colors.olive, letterSpacing: 1 },
  badgesSection: { paddingHorizontal: 20, paddingVertical: 20 },
  sectionLabel: { fontFamily: 'SpaceMono_400Regular', fontSize: 8, color: Colors.amber, letterSpacing: 3, marginBottom: 12 },
  badges: { flexDirection: 'row', gap: 10 },
  badge: { alignItems: 'center', backgroundColor: Colors.cardBg, borderWidth: 1, borderColor: Colors.rust, padding: 12, minWidth: 80 },
  badgeUnearned: { borderColor: Colors.border, opacity: 0.4 },
  badgeIcon: { fontSize: 22, marginBottom: 6 },
  badgeLabel: { fontFamily: 'SpaceMono_400Regular', fontSize: 8, color: Colors.cream, letterSpacing: 1, textAlign: 'center' },
  badgeLabelUnearned: { color: Colors.mutedText },
  divider: { height: 1, backgroundColor: Colors.border, marginBottom: 24 },
  postsSection: { marginBottom: 8 },
  empty: { padding: 40, alignItems: 'center' },
  emptyText: { fontFamily: 'PlayfairDisplay_400Regular', fontSize: 16, color: Colors.mutedText },
  signOutArea: { alignItems: 'center', paddingVertical: 24 },
  signOutBtn: { borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 32, paddingVertical: 10 },
  signOutText: { fontFamily: 'SpaceMono_400Regular', fontSize: 9, color: Colors.mutedText, letterSpacing: 2 },
});

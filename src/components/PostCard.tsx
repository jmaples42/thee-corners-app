import React, { useEffect, useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { Font } from '../theme/typography';
import { Post, toggleReaction } from '../firebase/firestore';
import YouTubeTile from './YouTubeTile';
import { parseYouTubeId } from '../utils/youtube';
import { fetchLinkMeta, needsLinkMeta, FetchedMeta } from '../utils/linkMeta';

const REACTIONS = ['🔥', '🫀', '🌙', '🐘'];

// The brand color marks the source on the badge's border; the text stays ink so it's readable.
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

export default function PostCard({ post, currentUid, cornerId }: { post: Post; currentUid: string; cornerId: string }) {
  const reactions = post.reactions;
  const meta = post.linkMeta;
  const videoId = meta.source === 'youtube' ? parseYouTubeId(post.link) : null;

  // Older Spotify/SoundCloud/Bandcamp posts were saved with the URL's last segment as the title
  // and no art; look both up now instead of rewriting other people's posts.
  const [fetched, setFetched] = useState<FetchedMeta | null>(null);
  useEffect(() => {
    if (!needsLinkMeta(meta)) return;
    let live = true;
    fetchLinkMeta(post.link, meta.source).then(r => { if (live) setFetched(r); });
    return () => { live = false; };
  }, [post.link]);
  const title = fetched?.title ?? meta.title;
  const thumbnail = meta.thumbnail ?? fetched?.thumbnail;

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
          </View>
        </View>
      </View>

      {videoId ? (
        <YouTubeTile videoId={videoId} meta={meta} />
      ) : (
        // Opens in the source's own app when it's installed (Spotify, Bandcamp, SoundCloud).
        <TouchableOpacity
          style={pc.linkCard}
          activeOpacity={0.75}
          onPress={() => Linking.openURL(post.link)}
          accessibilityRole="link"
          accessibilityLabel={`Open ${title} in ${meta.source}`}
        >
          {thumbnail ? (
            <Image source={{ uri: thumbnail }} style={pc.linkArt} />
          ) : (
            <View style={pc.linkArt}>
              <Text style={pc.linkArtText}>{meta.source[0].toUpperCase()}</Text>
            </View>
          )}
          <View style={pc.linkMeta}>
            <Text style={pc.linkTitle} numberOfLines={2}>{title}</Text>
            <View style={[pc.sourceBadge, { borderColor: SOURCE_COLORS[meta.source] }]}>
              <Text style={pc.sourceText}>{meta.source.toUpperCase()}</Text>
            </View>
          </View>
          <Ionicons name="open-outline" size={18} color={Colors.mutedText} style={pc.openIcon} />
        </TouchableOpacity>
      )}

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

const pc = StyleSheet.create({
  card: { paddingHorizontal: 20, paddingTop: 18 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  avatar: {
    width: 34, height: 34, backgroundColor: Colors.border,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  avatarText: { fontFamily: Font.display, fontSize: 15, color: Colors.amberText },
  headerRight: { flex: 1 },
  username: { fontFamily: Font.label, fontSize: 13, color: Colors.cream },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  timestamp: { fontFamily: Font.label, fontSize: 12, color: Colors.mutedText },
  linkCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.cardBg,
    borderLeftWidth: 2, borderLeftColor: Colors.rust,
    padding: 12, marginBottom: 12,
  },
  linkArt: {
    width: 64, height: 64, backgroundColor: Colors.darkBrown,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  linkArtText: { fontFamily: Font.display, fontSize: 22, color: Colors.olive },
  linkMeta: { flex: 1, justifyContent: 'space-between' },
  linkTitle: { fontFamily: Font.body, fontSize: 16, color: Colors.cream, lineHeight: 23 },
  sourceBadge: { borderWidth: 1.5, paddingHorizontal: 6, paddingVertical: 2, alignSelf: 'flex-start', marginTop: 6 },
  sourceText: { fontFamily: Font.label, fontSize: 12, letterSpacing: 1, color: Colors.cream },
  openIcon: { marginLeft: 10 },
  note: { fontFamily: Font.body, fontSize: 16, color: Colors.cream, lineHeight: 25, marginBottom: 14, opacity: 0.9 },
  reactionStrip: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  reactionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 8,
    borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.cardBg,
  },
  reactionBtnActive: { borderColor: Colors.rust, backgroundColor: '#2a1510' },
  reactionEmoji: { fontSize: 16 },
  reactionCount: { fontFamily: Font.label, fontSize: 12, color: Colors.mutedText },
  divider: { height: 1, backgroundColor: Colors.border },
});

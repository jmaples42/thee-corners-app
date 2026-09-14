import React, { useEffect, useState } from 'react';
import {
  View, Text, Image, FlatList, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, KeyboardAvoidingView, Platform, Linking,
} from 'react-native';
import { Colors } from '../theme/colors';
import {
  Release, ReleaseComment, subscribeToReleaseComments,
  createReleaseComment, toggleCommentReaction, deleteReleaseComment,
} from '../firebase/firestore';

const REACTIONS = ['🔥', '🫀', '🌙', '🐘'];

function timeAgo(ts: number) {
  const d = Date.now() - ts;
  if (d < 3600000) return `${Math.floor(d / 60000)}m ago`;
  if (d < 86400000) return `${Math.floor(d / 3600000)}h ago`;
  return `${Math.floor(d / 86400000)}d ago`;
}

function CommentCard({
  comment, currentUid, releaseId,
}: { comment: ReleaseComment; currentUid: string; releaseId: string }) {
  const reactions = comment.reactions ?? {};
  const isMine = comment.uid === currentUid;

  const handleToggleReaction = (emoji: string) => {
    const current = reactions[emoji] ?? [];
    const hasReacted = current.includes(currentUid);
    toggleCommentReaction(releaseId, comment.id, emoji, currentUid, hasReacted);
  };

  return (
    <View style={cc.card}>
      <View style={cc.header}>
        <View style={cc.avatar}>
          <Text style={cc.avatarText}>{comment.username[0]?.toUpperCase()}</Text>
        </View>
        <View style={cc.headerRight}>
          <Text style={cc.username}>@{comment.username}</Text>
          <Text style={cc.timestamp}>{timeAgo(comment.createdAt)}</Text>
        </View>
        {isMine && (
          <TouchableOpacity onPress={() => deleteReleaseComment(releaseId, comment.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={cc.delete}>Delete</Text>
          </TouchableOpacity>
        )}
      </View>
      <Text style={cc.text}>{comment.text}</Text>
      <View style={cc.reactionStrip}>
        {REACTIONS.map(emoji => {
          const uids = reactions[emoji] ?? [];
          const active = uids.includes(currentUid);
          return (
            <TouchableOpacity
              key={emoji}
              style={[cc.reactionBtn, active && cc.reactionBtnActive]}
              onPress={() => handleToggleReaction(emoji)}
            >
              <Text style={cc.reactionEmoji}>{emoji}</Text>
              {uids.length > 0 && <Text style={cc.reactionCount}>{uids.length}</Text>}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const cc = StyleSheet.create({
  card: { paddingHorizontal: 20, paddingTop: 16 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  avatar: { width: 30, height: 30, backgroundColor: Colors.border, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  avatarText: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 13, color: Colors.amber },
  headerRight: { flex: 1 },
  username: { fontFamily: 'SpaceMono_400Regular', fontSize: 11, color: Colors.cream },
  timestamp: { fontFamily: 'SpaceMono_400Regular', fontSize: 9, color: Colors.mutedText, marginTop: 1 },
  delete: { fontFamily: 'SpaceMono_400Regular', fontSize: 9, color: Colors.mutedText, letterSpacing: 1 },
  text: { fontFamily: 'System', fontSize: 14, color: Colors.cream, lineHeight: 21, marginBottom: 10, opacity: 0.92 },
  reactionStrip: { flexDirection: 'row', gap: 6, marginBottom: 14 },
  reactionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 6,
    borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.cardBg,
  },
  reactionBtnActive: { borderColor: Colors.rust, backgroundColor: '#2a1510' },
  reactionEmoji: { fontSize: 13 },
  reactionCount: { fontFamily: 'SpaceMono_400Regular', fontSize: 9, color: Colors.mutedText },
});

interface Props {
  release: Release;
  currentUid: string;
  username: string;
  onBack: () => void;
}

export default function ReleaseDetailScreen({ release, currentUid, username, onBack }: Props) {
  const [comments, setComments] = useState<ReleaseComment[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const unsub = subscribeToReleaseComments(release.id, setComments);
    return unsub;
  }, [release.id]);

  const handleSend = async () => {
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    try {
      await createReleaseComment(release.id, {
        releaseId: release.id,
        uid: currentUid,
        username,
        text,
        createdAt: Date.now(),
        parentId: null,
        reactions: {},
      });
      setDraft('');
    } catch (e) {
      console.error(e);
    } finally {
      setSending(false);
    }
  };

  const links = Object.entries(release.links ?? {}).filter(([, url]) => !!url);

  return (
    <SafeAreaView style={s.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={s.header}>
          <TouchableOpacity onPress={onBack} style={s.backBtn} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Text style={s.backText}>←</Text>
          </TouchableOpacity>
          <View style={s.headerCenter}>
            <Text style={s.releaseTitle} numberOfLines={1}>{release.title}</Text>
            <Text style={s.releaseArtist}>{release.artist}</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        <FlatList
          data={comments}
          keyExtractor={c => c.id}
          renderItem={({ item }) => (
            <CommentCard comment={item} currentUid={currentUid} releaseId={release.id} />
          )}
          contentContainerStyle={{ paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={s.aboveFold}>
              <View style={s.art}>
                {release.coverArtUrl ? (
                  <Image source={{ uri: release.coverArtUrl }} style={s.artImage} />
                ) : null}
              </View>
              <View style={s.tagRow}>
                <View style={s.tag}><Text style={s.tagText}>{release.format}</Text></View>
                <View style={s.tag}><Text style={s.tagText}>{release.tier === 'indie' ? 'INDIE' : 'MAJOR'}</Text></View>
                {release.genres.map(g => (
                  <View style={s.tag} key={g}><Text style={s.tagText}>{g.toUpperCase()}</Text></View>
                ))}
              </View>
              {release.label ? <Text style={s.labelLine}>{release.label}</Text> : null}
              {release.blurb ? <Text style={s.blurb}>{release.blurb}</Text> : null}

              {links.length > 0 && (
                <View style={s.linkRow}>
                  {links.map(([source, url]) => (
                    <TouchableOpacity
                      key={source}
                      style={s.linkPill}
                      onPress={() => Linking.openURL(url as string)}
                    >
                      <Text style={s.linkPillText}>{source.toUpperCase()}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {release.editorsTake && (
                <View style={s.editorsTake}>
                  <View style={s.editorsHeader}>
                    <View style={s.editorsAvatar}>
                      <Text style={s.editorsAvatarText}>{release.editorsTake.username[0]?.toUpperCase()}</Text>
                    </View>
                    <View>
                      <Text style={s.editorsUsername}>{release.editorsTake.username}</Text>
                      {release.editorsTake.isEssential && (
                        <Text style={s.editorsBadge}>★ THIS WEEK'S ESSENTIAL</Text>
                      )}
                    </View>
                  </View>
                  <Text style={s.editorsText}>{release.editorsTake.text}</Text>
                </View>
              )}

              <View style={s.divider} />
            </View>
          }
          ListEmptyComponent={
            <Text style={s.emptyComments}>No comments yet. Be the first.</Text>
          }
        />

        <View style={s.composer}>
          <TextInput
            style={s.composerInput}
            value={draft}
            onChangeText={setDraft}
            placeholder="Add your take..."
            placeholderTextColor={Colors.mutedText}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[s.sendBtn, !draft.trim() && s.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!draft.trim() || sending}
          >
            <Text style={s.sendBtnText}>SEND</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
  releaseTitle: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 16, color: Colors.cream },
  releaseArtist: { fontFamily: 'SpaceMono_400Regular', fontSize: 9, color: Colors.mutedText, letterSpacing: 1, marginTop: 2 },
  aboveFold: { paddingHorizontal: 20, paddingTop: 18 },
  art: { width: '100%', height: 220, backgroundColor: Colors.darkBrown, marginBottom: 14 },
  artImage: { width: '100%', height: '100%' },
  tagRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginBottom: 10 },
  tag: { borderWidth: 1, borderColor: Colors.olive, paddingHorizontal: 6, paddingVertical: 2 },
  tagText: { fontFamily: 'SpaceMono_400Regular', fontSize: 9, color: Colors.olive, letterSpacing: 1 },
  labelLine: { fontFamily: 'System', fontSize: 12, color: Colors.mutedText, marginBottom: 4 },
  blurb: { fontFamily: 'System', fontSize: 13, color: Colors.cream, opacity: 0.85, lineHeight: 19, marginBottom: 14 },
  linkRow: { flexDirection: 'row', gap: 8, marginBottom: 18 },
  linkPill: { borderWidth: 1, borderColor: Colors.rust, paddingHorizontal: 14, paddingVertical: 8 },
  linkPillText: { fontFamily: 'SpaceMono_400Regular', fontSize: 10, color: Colors.rust, letterSpacing: 1 },
  editorsTake: {
    backgroundColor: Colors.cardBg, borderLeftWidth: 2, borderLeftColor: Colors.rust,
    padding: 14, marginBottom: 8,
  },
  editorsHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  editorsAvatar: { width: 28, height: 28, backgroundColor: Colors.border, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  editorsAvatarText: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 12, color: Colors.amber },
  editorsUsername: { fontFamily: 'SpaceMono_400Regular', fontSize: 11, color: Colors.cream },
  editorsBadge: { fontFamily: 'SpaceMono_400Regular', fontSize: 8, color: Colors.rust, letterSpacing: 1.5, marginTop: 2 },
  editorsText: { fontFamily: 'System', fontSize: 14, color: Colors.cream, lineHeight: 21, opacity: 0.92 },
  divider: { height: 1, backgroundColor: Colors.border, marginTop: 10 },
  emptyComments: { fontFamily: 'System', fontSize: 13, color: Colors.mutedText, textAlign: 'center', paddingVertical: 24 },
  composer: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 10,
    paddingHorizontal: 16, paddingVertical: 12,
    borderTopWidth: 1, borderTopColor: Colors.border, backgroundColor: Colors.background,
  },
  composerInput: {
    flex: 1, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.cardBg,
    paddingHorizontal: 12, paddingVertical: 10, fontFamily: 'System', fontSize: 14,
    color: Colors.cream, maxHeight: 100,
  },
  sendBtn: { backgroundColor: Colors.rust, paddingHorizontal: 16, paddingVertical: 12 },
  sendBtnDisabled: { backgroundColor: Colors.border },
  sendBtnText: { fontFamily: 'SpaceMono_400Regular', fontSize: 11, color: Colors.cream, letterSpacing: 1 },
});

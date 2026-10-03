import React, { useEffect, useState } from 'react';
import {
  View, Text, Image, FlatList, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, KeyboardAvoidingView, Platform, Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import {
  Release, ReleaseComment, subscribeToReleaseComments, createReleaseComment,
  subscribeToSavedReleases, saveRelease, unsaveRelease,
} from '../firebase/firestore';
import CommentCard from '../components/CommentCard';

const LINK_LABELS: Record<string, string> = { appleMusic: 'APPLE MUSIC' };

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
  const [saved, setSaved] = useState(false);
  const [savePending, setSavePending] = useState(false);

  useEffect(() => {
    const unsub = subscribeToReleaseComments(release.id, setComments);
    return unsub;
  }, [release.id]);

  useEffect(() => {
    const unsub = subscribeToSavedReleases(currentUid, saved => {
      setSaved(saved.some(s => s.releaseId === release.id));
    });
    return unsub;
  }, [currentUid, release.id]);

  const handleToggleSave = async () => {
    if (savePending) return;
    setSavePending(true);
    try {
      if (saved) {
        await unsaveRelease(currentUid, release.id);
      } else {
        await saveRelease(currentUid, release.id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSavePending(false);
    }
  };

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
          <TouchableOpacity
            onPress={handleToggleSave}
            disabled={savePending}
            style={s.saveBtn}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons
              name={saved ? 'bookmark' : 'bookmark-outline'}
              size={20}
              color={saved ? Colors.rust : Colors.cream}
            />
          </TouchableOpacity>
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

              {release.sampleUrl && (
                <TouchableOpacity
                  style={s.playBtn}
                  onPress={() => Linking.openURL(release.sampleUrl as string)}
                >
                  <Ionicons name="play" size={12} color={Colors.background} />
                  <Text style={s.playBtnText}>
                    PLAY{release.sampleTrackTitle ? ` — "${release.sampleTrackTitle}"` : ''}
                  </Text>
                </TouchableOpacity>
              )}

              {links.length > 0 && (
                <View style={s.linkRow}>
                  {links.map(([source, url]) => (
                    <TouchableOpacity
                      key={source}
                      style={s.linkPill}
                      onPress={() => Linking.openURL(url as string)}
                    >
                      <Text style={s.linkPillText}>{LINK_LABELS[source] ?? source.toUpperCase()}</Text>
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

              {release.criticsHighlight && (
                <View style={[s.editorsTake, s.criticsHighlight]}>
                  <View style={s.editorsHeader}>
                    <View>
                      <Text style={s.criticsPublication}>{release.criticsHighlight.publication}</Text>
                      {release.criticsHighlight.score && (
                        <Text style={s.criticsBadge}>{release.criticsHighlight.score}</Text>
                      )}
                    </View>
                  </View>
                  <Text style={s.editorsText}>"{release.criticsHighlight.quote}"</Text>
                  {release.criticsHighlight.url && (
                    <TouchableOpacity onPress={() => Linking.openURL(release.criticsHighlight!.url as string)}>
                      <Text style={s.criticsReadMore}>Read the full review →</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {release.userHighlight && (
                <View style={[s.editorsTake, s.userHighlight]}>
                  <View style={s.editorsHeader}>
                    <View style={[s.editorsAvatar, s.userHighlightAvatar]}>
                      <Text style={s.editorsAvatarText}>{release.userHighlight.username[0]?.toUpperCase()}</Text>
                    </View>
                    <View>
                      <Text style={s.editorsUsername}>{release.userHighlight.username}</Text>
                      <Text style={s.userHighlightBadge}>★ COMMUNITY PICK</Text>
                    </View>
                  </View>
                  <Text style={s.editorsText}>{release.userHighlight.text}</Text>
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
  saveBtn: { width: 40, alignItems: 'flex-end' },
  releaseTitle: { fontFamily: 'BigShouldersDisplay_900Black', fontSize: 16, color: Colors.cream },
  releaseArtist: { fontFamily: 'JetBrainsMono_500Medium', fontSize: 9, color: Colors.mutedText, letterSpacing: 1, marginTop: 2 },
  aboveFold: { paddingHorizontal: 20, paddingTop: 18 },
  // Cover art is consistently square at the source (Bandcamp/Spotify/Apple Music
  // all serve 1:1 images) — aspectRatio instead of a fixed height means the
  // default `cover` resizeMode no longer crops it into a wide banner shape.
  art: { width: '100%', aspectRatio: 1, backgroundColor: Colors.darkBrown, marginBottom: 14 },
  artImage: { width: '100%', height: '100%' },
  tagRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginBottom: 10 },
  tag: { borderWidth: 1, borderColor: Colors.olive, paddingHorizontal: 6, paddingVertical: 2 },
  tagText: { fontFamily: 'JetBrainsMono_500Medium', fontSize: 9, color: Colors.olive, letterSpacing: 1 },
  labelLine: { fontFamily: 'Inter_400Regular', fontSize: 12, color: Colors.mutedText, marginBottom: 4 },
  blurb: { fontFamily: 'Inter_400Regular', fontSize: 13, color: Colors.cream, opacity: 0.85, lineHeight: 19, marginBottom: 14 },
  playBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start',
    backgroundColor: Colors.cream, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 14,
  },
  playBtnText: { fontFamily: 'JetBrainsMono_500Medium', fontSize: 10, color: Colors.background, letterSpacing: 1 },
  linkRow: { flexDirection: 'row', gap: 8, marginBottom: 18 },
  linkPill: { borderWidth: 1, borderColor: Colors.rust, paddingHorizontal: 14, paddingVertical: 8 },
  linkPillText: { fontFamily: 'JetBrainsMono_500Medium', fontSize: 10, color: Colors.rust, letterSpacing: 1 },
  editorsTake: {
    backgroundColor: Colors.cardBg, borderLeftWidth: 2, borderLeftColor: Colors.rust,
    padding: 14, marginBottom: 8,
  },
  editorsHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  editorsAvatar: { width: 28, height: 28, backgroundColor: Colors.border, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  editorsAvatarText: { fontFamily: 'BigShouldersDisplay_900Black', fontSize: 12, color: Colors.amber },
  editorsUsername: { fontFamily: 'JetBrainsMono_500Medium', fontSize: 11, color: Colors.cream },
  editorsBadge: { fontFamily: 'JetBrainsMono_500Medium', fontSize: 8, color: Colors.rust, letterSpacing: 1.5, marginTop: 2 },
  editorsText: { fontFamily: 'Inter_400Regular', fontSize: 14, color: Colors.cream, lineHeight: 21, opacity: 0.92 },
  criticsHighlight: { borderLeftColor: Colors.amber },
  criticsPublication: { fontFamily: 'JetBrainsMono_500Medium', fontSize: 11, color: Colors.cream, letterSpacing: 1 },
  criticsBadge: { fontFamily: 'JetBrainsMono_500Medium', fontSize: 8, color: Colors.amber, letterSpacing: 1.5, marginTop: 2 },
  criticsReadMore: { fontFamily: 'JetBrainsMono_500Medium', fontSize: 10, color: Colors.amber, letterSpacing: 0.5, marginTop: 8 },
  userHighlight: { borderLeftColor: Colors.olive },
  userHighlightAvatar: { backgroundColor: Colors.olive },
  userHighlightBadge: { fontFamily: 'JetBrainsMono_500Medium', fontSize: 8, color: Colors.olive, letterSpacing: 1.5, marginTop: 2 },
  divider: { height: 1, backgroundColor: Colors.border, marginTop: 10 },
  emptyComments: { fontFamily: 'Inter_400Regular', fontSize: 13, color: Colors.mutedText, textAlign: 'center', paddingVertical: 24 },
  composer: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 10,
    paddingHorizontal: 16, paddingVertical: 12,
    borderTopWidth: 1, borderTopColor: Colors.border, backgroundColor: Colors.background,
  },
  composerInput: {
    flex: 1, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.cardBg,
    paddingHorizontal: 12, paddingVertical: 10, fontFamily: 'Inter_400Regular', fontSize: 14,
    color: Colors.cream, maxHeight: 100,
  },
  sendBtn: { backgroundColor: Colors.rust, paddingHorizontal: 16, paddingVertical: 12 },
  sendBtnDisabled: { backgroundColor: Colors.border },
  sendBtnText: { fontFamily: 'JetBrainsMono_500Medium', fontSize: 11, color: Colors.cream, letterSpacing: 1 },
});

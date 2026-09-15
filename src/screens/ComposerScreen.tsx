import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { Colors } from '../theme/colors';
import { createCornerPost, PostTag, LinkMeta } from '../firebase/firestore';

const TAGS: PostTag[] = ['On Rotation', 'Digging This Week', 'Recent Discovery'];
const TAG_DESCS: Record<PostTag, string> = {
  'On Rotation': "What you can't stop playing right now",
  'Digging This Week': "Something you're actively into this week",
  'Recent Discovery': 'Something you just found',
};

function detectSource(url: string): LinkMeta['source'] {
  if (url.includes('spotify.com')) return 'spotify';
  if (url.includes('bandcamp.com')) return 'bandcamp';
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
  if (url.includes('soundcloud.com')) return 'soundcloud';
  return 'other';
}

function parseTitle(url: string): string {
  // TODO: Real oEmbed fetch — stub extracts domain + path
  try {
    const u = new URL(url);
    const parts = u.pathname.split('/').filter(Boolean);
    return parts.length > 0
      ? parts[parts.length - 1].replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
      : u.hostname;
  } catch {
    return url;
  }
}

interface Props {
  currentUid: string;
  username: string;
  cornerId: string;
  cornerName: string;
  onPosted: () => void;
  onCancel: () => void;
}

export default function ComposerScreen({
  currentUid, username, cornerId, cornerName, onPosted, onCancel,
}: Props) {
  const [link, setLink] = useState('');
  const [linkMeta, setLinkMeta] = useState<LinkMeta | null>(null);
  const [text, setText] = useState('');
  const [tag, setTag] = useState<PostTag>('On Rotation');
  const [loading, setLoading] = useState(false);
  const [posted, setPosted] = useState(false);

  const handleLinkChange = (val: string) => {
    setLink(val);
    // TODO: Debounce + real oEmbed fetch
    if (val.startsWith('http')) {
      setLinkMeta({
        source: detectSource(val),
        title: parseTitle(val),
        url: val,
      });
    } else {
      setLinkMeta(null);
    }
  };

  const handlePost = async () => {
    if (!link || !text || !linkMeta) return;
    setLoading(true);
    try {
      await createCornerPost(cornerId, {
        cornerId,
        uid: currentUid,
        username,
        genres: [], // TODO: pull from user profile
        text,
        link,
        linkMeta,
        tag,
        reactions: {},
        createdAt: Date.now(),
      });
      setPosted(true);
      setTimeout(() => { onPosted(); }, 1800);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (posted) {
    return (
      <SafeAreaView style={[s.container, s.successBg]}>
        <Text style={s.successMark}>✓</Text>
        <Text style={s.successTitle}>Corner Dropped</Text>
        <Text style={s.successSub}>YOUR PEOPLE WILL HEAR IT</Text>
      </SafeAreaView>
    );
  }

  const canPost = !!link && !!text && !!linkMeta;

  return (
    <SafeAreaView style={s.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={s.navBar}>
          <TouchableOpacity onPress={onCancel}>
            <Text style={s.cancelBtn}>Cancel</Text>
          </TouchableOpacity>
          <View style={s.navCenter}>
            <Text style={s.navTitle}>Drop a Corner</Text>
            <Text style={s.navCorner}>{cornerName}</Text>
          </View>
          <View style={{ width: 50 }} />
        </View>

        <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>
          <View style={s.section}>
            <Text style={s.label}>THE LINK</Text>
            <Text style={s.hint}>Spotify · Bandcamp · YouTube · SoundCloud</Text>
            <TextInput
              style={s.linkInput}
              value={link}
              onChangeText={handleLinkChange}
              placeholder="Paste a link..."
              placeholderTextColor={Colors.mutedText}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />
          </View>

          {linkMeta && (
            <View style={s.preview}>
              <View style={s.previewArt}>
                <Text style={s.previewArtText}>{linkMeta.source[0].toUpperCase()}</Text>
              </View>
              <View style={s.previewMeta}>
                <Text style={s.previewTitle} numberOfLines={2}>{linkMeta.title}</Text>
                <Text style={s.previewSource}>{linkMeta.source.toUpperCase()}</Text>
              </View>
            </View>
          )}

          <View style={s.section}>
            <Text style={s.label}>WHY THIS?</Text>
            <TextInput
              style={s.noteInput}
              value={text}
              onChangeText={setText}
              multiline
              placeholder="The moment, the feeling, why it matters..."
              placeholderTextColor={Colors.mutedText}
              textAlignVertical="top"
              maxLength={280}
            />
            <Text style={s.charCount}>{text.length}/280</Text>
          </View>

          <View style={s.section}>
            <Text style={s.label}>TAG IT</Text>
            {TAGS.map(t => (
              <TouchableOpacity
                key={t}
                style={[s.tagRow, tag === t && s.tagRowActive]}
                onPress={() => setTag(t)}
              >
                <View style={[s.radio, tag === t && s.radioActive]} />
                <View>
                  <Text style={[s.tagLabel, tag === t && s.tagLabelActive]}>{t}</Text>
                  <Text style={s.tagDesc}>{TAG_DESCS[t]}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[s.postBtn, !canPost && s.postBtnDisabled]}
            onPress={handlePost}
            disabled={!canPost || loading}
            activeOpacity={0.8}
          >
            {loading
              ? <ActivityIndicator color={Colors.cream} />
              : <Text style={s.postBtnText}>DROP THIS CORNER</Text>}
          </TouchableOpacity>

          <View style={{ height: 60 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  successBg: { alignItems: 'center', justifyContent: 'center' },
  successMark: { fontFamily: 'BigShouldersDisplay_900Black', fontSize: 64, color: Colors.rust, marginBottom: 16 },
  successTitle: { fontFamily: 'BigShouldersDisplay_900Black', fontSize: 28, color: Colors.cream, marginBottom: 8 },
  successSub: { fontFamily: 'JetBrainsMono_500Medium', fontSize: 10, color: Colors.amber, letterSpacing: 3 },
  navBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  cancelBtn: { fontFamily: 'JetBrainsMono_500Medium', fontSize: 11, color: Colors.mutedText, letterSpacing: 1 },
  navCenter: { alignItems: 'center' },
  navTitle: { fontFamily: 'BigShouldersDisplay_900Black', fontSize: 18, color: Colors.cream },
  navCorner: { fontFamily: 'JetBrainsMono_500Medium', fontSize: 9, color: Colors.amber, letterSpacing: 1, marginTop: 2 },
  scroll: { flex: 1 },
  section: { paddingHorizontal: 20, marginTop: 24 },
  label: { fontFamily: 'JetBrainsMono_500Medium', fontSize: 9, color: Colors.amber, letterSpacing: 3, marginBottom: 6 },
  hint: { fontFamily: 'Inter_400Regular', fontSize: 12, color: Colors.mutedText, marginBottom: 10 },
  linkInput: {
    borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.cardBg,
    padding: 14, fontFamily: 'Inter_400Regular', fontSize: 14, color: Colors.cream,
  },
  preview: {
    flexDirection: 'row', backgroundColor: Colors.darkBrown,
    borderLeftWidth: 2, borderLeftColor: Colors.rust,
    marginHorizontal: 20, marginTop: 10, padding: 12,
  },
  previewArt: {
    width: 48, height: 48, backgroundColor: Colors.cardBg,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  previewArtText: { fontFamily: 'BigShouldersDisplay_900Black', fontSize: 20, color: Colors.olive },
  previewMeta: { flex: 1 },
  previewTitle: { fontFamily: 'Inter_400Regular', fontSize: 14, color: Colors.cream },
  previewSource: { fontFamily: 'JetBrainsMono_500Medium', fontSize: 9, color: Colors.amber, letterSpacing: 1, marginTop: 4 },
  noteInput: {
    borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.cardBg,
    padding: 14, fontFamily: 'Inter_400Regular', fontSize: 14, color: Colors.cream,
    minHeight: 110, lineHeight: 22,
  },
  charCount: { fontFamily: 'JetBrainsMono_500Medium', fontSize: 10, color: Colors.mutedText, textAlign: 'right', marginTop: 4 },
  tagRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  tagRowActive: { backgroundColor: Colors.darkBrown, marginHorizontal: -20, paddingHorizontal: 20 },
  radio: { width: 16, height: 16, borderWidth: 1, borderColor: Colors.border, marginTop: 2, borderRadius: 8 },
  radioActive: { borderColor: Colors.rust, backgroundColor: Colors.rust },
  tagLabel: { fontFamily: 'Inter_400Regular', fontSize: 16, color: Colors.mutedText },
  tagLabelActive: { color: Colors.cream },
  tagDesc: { fontFamily: 'Inter_400Regular', fontSize: 12, color: Colors.mutedText, marginTop: 2 },
  postBtn: {
    backgroundColor: Colors.rust, paddingVertical: 18,
    marginHorizontal: 20, alignItems: 'center', marginTop: 28,
  },
  postBtnDisabled: { backgroundColor: Colors.border },
  postBtnText: { fontFamily: 'JetBrainsMono_500Medium', fontSize: 12, color: Colors.cream, letterSpacing: 3 },
});

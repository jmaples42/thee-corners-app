import React, { useRef, useState } from 'react';
import {
  View, Text, Image, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { Colors } from '../theme/colors';
import { Font } from '../theme/typography';
import { createCornerPost, LinkMeta } from '../firebase/firestore';
import { YOUTUBE_API_KEY } from '../config/youtube';
import {
  YouTubeResult, YouTubeSearchError, searchYouTube, parseYouTubeId, youtubeThumbnail, fetchYouTubeOEmbed,
} from '../utils/youtube';

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
  const [loading, setLoading] = useState(false);
  const [posted, setPosted] = useState(false);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<YouTubeResult[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const linkSeq = useRef(0);

  const handleLinkChange = (val: string) => {
    setLink(val);
    const seq = ++linkSeq.current;
    if (!val.startsWith('http')) {
      setLinkMeta(null);
      return;
    }
    const videoId = detectSource(val) === 'youtube' ? parseYouTubeId(val) : null;
    if (videoId) {
      // Thumbnail straight away; the real title and channel follow from oEmbed.
      setLinkMeta({ source: 'youtube', title: parseTitle(val), url: val, thumbnail: youtubeThumbnail(videoId) });
      fetchYouTubeOEmbed(videoId).then(info => {
        if (info && seq === linkSeq.current) {
          setLinkMeta(m => (m ? { ...m, title: info.title || m.title, channel: info.channel } : m));
        }
      });
      return;
    }
    // TODO: oEmbed for Spotify / Bandcamp / SoundCloud
    setLinkMeta({ source: detectSource(val), title: parseTitle(val), url: val });
  };

  // Runs on submit, not per keystroke: every search spends 100 of the key's 10,000 daily units.
  const handleSearch = async () => {
    if (!query.trim() || searching) return;
    setSearching(true);
    setSearchError('');
    try {
      setResults(await searchYouTube(query));
    } catch (e) {
      setResults(null);
      setSearchError(
        e instanceof YouTubeSearchError && e.kind === 'quota'
          ? "Search is taking a break for today. Paste a link instead."
          : e instanceof YouTubeSearchError && e.kind === 'network'
            ? "Couldn't reach YouTube. Check your connection or paste a link."
            : "YouTube search isn't working right now. Paste a link instead.",
      );
    } finally {
      setSearching(false);
    }
  };

  const pickResult = (r: YouTubeResult) => {
    ++linkSeq.current;
    setLink(r.url);
    setLinkMeta({ source: 'youtube', title: r.title, url: r.url, thumbnail: r.thumbnail, channel: r.channel });
    setResults(null);
    setQuery('');
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

        <ScrollView style={s.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {!!YOUTUBE_API_KEY && (
            <View style={s.section}>
              <Text style={s.label}>SEARCH YOUTUBE</Text>
              <Text style={s.hint}>Find a clip and it plays right in the chat.</Text>
              <View style={s.searchRow}>
                <TextInput
                  style={[s.linkInput, s.searchInput]}
                  value={query}
                  onChangeText={setQuery}
                  onSubmitEditing={handleSearch}
                  placeholder="Artist, song, live set..."
                  placeholderTextColor={Colors.mutedText}
                  returnKeyType="search"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  style={[s.searchBtn, !query.trim() && s.postBtnDisabled]}
                  onPress={handleSearch}
                  disabled={!query.trim() || searching}
                >
                  {searching
                    ? <ActivityIndicator color={Colors.onRust} />
                    : <Text style={s.searchBtnText}>SEARCH</Text>}
                </TouchableOpacity>
              </View>
              {!!searchError && <Text style={s.searchError}>{searchError}</Text>}
              {results && results.length === 0 && (
                <Text style={s.searchError}>Nothing playable found. Try different words.</Text>
              )}
              {results?.map(r => (
                <TouchableOpacity key={r.videoId} style={s.result} onPress={() => pickResult(r)} activeOpacity={0.75}>
                  <Image source={{ uri: r.thumbnail }} style={s.resultThumb} />
                  <View style={s.resultMeta}>
                    <Text style={s.resultTitle} numberOfLines={2}>{r.title}</Text>
                    <Text style={s.resultChannel} numberOfLines={1}>{r.channel.toUpperCase()}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <View style={s.section}>
            <Text style={s.label}>{YOUTUBE_API_KEY ? 'OR PASTE A LINK' : 'THE LINK'}</Text>
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
              {linkMeta.thumbnail ? (
                <Image source={{ uri: linkMeta.thumbnail }} style={s.previewThumb} />
              ) : (
                <View style={s.previewArt}>
                  <Text style={s.previewArtText}>{linkMeta.source[0].toUpperCase()}</Text>
                </View>
              )}
              <View style={s.previewMeta}>
                <Text style={s.previewTitle} numberOfLines={2}>{linkMeta.title}</Text>
                <Text style={s.previewSource}>
                  {linkMeta.source.toUpperCase()}{linkMeta.channel ? `  ·  ${linkMeta.channel.toUpperCase()}` : ''}
                </Text>
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

          <TouchableOpacity
            style={[s.postBtn, !canPost && s.postBtnDisabled]}
            onPress={handlePost}
            disabled={!canPost || loading}
            activeOpacity={0.8}
          >
            {loading
              ? <ActivityIndicator color={Colors.onRust} />
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
  successMark: { fontFamily: Font.display, fontSize: 64, color: Colors.rust, marginBottom: 16 },
  successTitle: { fontFamily: Font.display, fontSize: 28, color: Colors.cream, marginBottom: 8 },
  successSub: { fontFamily: Font.label, fontSize: 12, color: Colors.amberText, letterSpacing: 1 },
  navBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  cancelBtn: { fontFamily: Font.label, fontSize: 12, color: Colors.mutedText, letterSpacing: 1 },
  navCenter: { alignItems: 'center' },
  navTitle: { fontFamily: Font.display, fontSize: 18, color: Colors.cream },
  navCorner: { fontFamily: Font.label, fontSize: 12, color: Colors.amberText, letterSpacing: 1, marginTop: 2 },
  scroll: { flex: 1 },
  section: { paddingHorizontal: 20, marginTop: 24 },
  label: { fontFamily: Font.label, fontSize: 12, color: Colors.amberText, letterSpacing: 1, marginBottom: 6 },
  hint: { fontFamily: Font.body, fontSize: 14, color: Colors.mutedText, marginBottom: 10 },
  linkInput: {
    borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.cardBg,
    padding: 14, fontFamily: Font.body, fontSize: 16, color: Colors.cream,
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
  previewArtText: { fontFamily: Font.display, fontSize: 20, color: Colors.olive },
  previewThumb: { width: 85, height: 48, marginRight: 12, backgroundColor: Colors.cardBg },
  previewMeta: { flex: 1 },
  searchRow: { flexDirection: 'row', gap: 8 },
  searchInput: { flex: 1 },
  searchBtn: { backgroundColor: Colors.rust, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center', minWidth: 84 },
  searchBtnText: { fontFamily: Font.label, fontSize: 12, color: Colors.onRust, letterSpacing: 1 },
  searchError: { fontFamily: Font.body, fontSize: 14, color: Colors.rust, marginTop: 10 },
  result: {
    flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  resultThumb: { width: 112, height: 63, backgroundColor: Colors.cardBg },
  resultMeta: { flex: 1 },
  resultTitle: { fontFamily: Font.body, fontSize: 15, color: Colors.cream, lineHeight: 21 },
  resultChannel: { fontFamily: Font.label, fontSize: 12, color: Colors.mutedText, letterSpacing: 1, marginTop: 4 },
  previewTitle: { fontFamily: Font.body, fontSize: 16, color: Colors.cream },
  previewSource: { fontFamily: Font.label, fontSize: 12, color: Colors.amberText, letterSpacing: 1, marginTop: 4 },
  noteInput: {
    borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.cardBg,
    padding: 14, fontFamily: Font.body, fontSize: 16, color: Colors.cream,
    minHeight: 110, lineHeight: 25,
  },
  charCount: { fontFamily: Font.label, fontSize: 12, color: Colors.mutedText, textAlign: 'right', marginTop: 4 },
  postBtn: {
    backgroundColor: Colors.rust, paddingVertical: 18,
    marginHorizontal: 20, alignItems: 'center', marginTop: 28,
  },
  postBtnDisabled: { opacity: 0.4 },
  postBtnText: { fontFamily: Font.label, fontSize: 13, color: Colors.onRust, letterSpacing: 1 },
});

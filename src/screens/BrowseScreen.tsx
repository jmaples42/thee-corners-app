import React, { useEffect, useState } from 'react';
import {
  View, Text, Image, FlatList, TouchableOpacity, StyleSheet, SafeAreaView,
} from 'react-native';
import { Colors } from '../theme/colors';
import { Release, subscribeToLatestReleases } from '../firebase/firestore';
import { TRENDING_2026 } from '../data/trending2026';

// subscribeToLatestReleases queries the latest published batch on or before
// this date, so it only needs today's local date — not which Friday it is.
function todayLocalDateString(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
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
  artFallback: { fontFamily: 'BigShouldersDisplay_900Black', fontSize: 26, color: Colors.olive },
  body: { flex: 1, justifyContent: 'center' },
  title: { fontFamily: 'Inter_400Regular', fontSize: 15, color: Colors.cream, marginBottom: 6 },
  artist: { fontFamily: 'BigShouldersDisplay_900Black' },
  tagRow: { flexDirection: 'row', gap: 6, marginBottom: 6 },
  tag: { borderWidth: 1, borderColor: Colors.olive, paddingHorizontal: 6, paddingVertical: 1 },
  tagText: { fontFamily: 'JetBrainsMono_500Medium', fontSize: 8, color: Colors.olive, letterSpacing: 1 },
  blurb: { fontFamily: 'Inter_400Regular', fontSize: 12, color: Colors.mutedText, lineHeight: 17, marginBottom: 4 },
  commentCount: { fontFamily: 'JetBrainsMono_500Medium', fontSize: 10, color: Colors.amber },
});

interface Props {
  onOpenRelease: (release: Release) => void;
  onOpenMethodology: () => void;
}

export default function BrowseScreen({ onOpenRelease, onOpenMethodology }: Props) {
  const [releases, setReleases] = useState<Release[]>([]);

  useEffect(() => {
    const unsub = subscribeToLatestReleases(todayLocalDateString(), setReleases);
    return unsub;
  }, []);

  const thisWeek = releases.filter(r => !r.stillInRotation);
  const rotation = releases.filter(r => r.stillInRotation);

  return (
    <SafeAreaView style={s.container}>
      <FlatList
        data={thisWeek}
        keyExtractor={r => r.id}
        renderItem={({ item }) => (
          <ReleaseCard release={item} onPress={() => onOpenRelease(item)} />
        )}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={s.header}>
            <Text style={s.wordmark}>Browse</Text>
            <View style={s.issueStrip}>
              <Text style={s.issueStripText}>ISSUE №38</Text>
              <Text style={s.issueStripSep}>·</Text>
              <Text style={s.issueStripText}>FRI 2026·09·11</Text>
              <Text style={s.issueStripSep}>·</Text>
              <Text style={s.issueStripText}>09:00 ET</Text>
            </View>
            <Text style={s.dek}>
              <Text style={s.dekLede}>Every Friday we publish a list of the week's most anticipated releases</Text>
              {' '}along with aggregated critical reception from leading music sources. Disagree? Add what you have to say about any release.
            </Text>
            <Text style={s.sectionHead}>This Week — Releases</Text>
          </View>
        }
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={s.emptyTitle}>Nothing published yet.</Text>
            <Text style={s.emptyBody}>Check back Friday.</Text>
          </View>
        }
        ListFooterComponent={
          <View>
            {rotation.length > 0 && (
              <View style={s.rotationSection}>
                <Text style={s.kicker}>FROM THE CORNERS · STILL IN ROTATION</Text>
                {rotation.map(item => (
                  <ReleaseCard key={item.id} release={item} onPress={() => onOpenRelease(item)} />
                ))}
              </View>
            )}

            <View style={s.trendingSection}>
              <Text style={s.kicker}>YEAR TO DATE · HIGHEST RATED</Text>
              <Text style={s.trendingTitle}>Still Trending — Best of 2026</Text>
              <Text style={s.trendingDek}>
                Notable releases from this year you may have missed. New studio albums only —
                no comps, live albums or reissues.
              </Text>
              {TRENDING_2026.map(t => (
                <View key={t.rank} style={s.trendingRow}>
                  <Text style={s.trendingRank}>{t.rank}</Text>
                  <View style={s.trendingInfo}>
                    <Text style={s.trendingArtist}>{t.artist}</Text>
                    <Text style={s.trendingItemTitle}>{t.title}</Text>
                    <Text style={s.trendingMeta}>{t.label} · {t.genre} · {t.releaseDate}</Text>
                  </View>
                  <View style={s.trendingScoreBox}>
                    <Text style={s.trendingScore}>{t.metacriticScore}</Text>
                    <Text style={s.trendingScoreLabel}>Metacritic</Text>
                  </View>
                </View>
              ))}
            </View>

            <TouchableOpacity style={s.methodologyLink} onPress={onOpenMethodology}>
              <Text style={s.methodologyLinkText}>How this list gets made →</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingHorizontal: 20, paddingTop: 8, paddingBottom: 18,
  },
  wordmark: { fontFamily: 'BigShouldersDisplay_900Black', fontSize: 26, color: Colors.cream, marginBottom: 12 },
  issueStrip: {
    flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8,
    backgroundColor: Colors.cream, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 16,
  },
  issueStripText: {
    fontFamily: 'JetBrainsMono_500Medium', fontSize: 10, color: Colors.background, letterSpacing: 0.5,
  },
  issueStripSep: { fontFamily: 'JetBrainsMono_500Medium', fontSize: 10, color: Colors.amber },
  dek: {
    fontFamily: 'Inter_400Regular', fontSize: 14, color: Colors.mutedText, lineHeight: 20,
    marginBottom: 20,
  },
  dekLede: { fontFamily: 'Inter_600SemiBold', color: Colors.cream },
  sectionHead: {
    fontFamily: 'BigShouldersDisplay_900Black', fontSize: 20, color: Colors.cream,
    borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 14,
  },
  empty: { padding: 48, alignItems: 'center' },
  emptyTitle: { fontFamily: 'BigShouldersDisplay_900Black', fontSize: 20, color: Colors.cream, marginBottom: 8 },
  emptyBody: { fontFamily: 'Inter_400Regular', fontSize: 14, color: Colors.mutedText },
  kicker: {
    fontFamily: 'JetBrainsMono_500Medium', fontSize: 9, color: Colors.amber,
    letterSpacing: 2, paddingHorizontal: 20, marginBottom: 4,
  },
  rotationSection: {
    marginTop: 24, borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 16,
  },
  trendingSection: {
    marginTop: 24, borderTopWidth: 1, borderTopColor: Colors.border,
    paddingTop: 16, paddingHorizontal: 20,
  },
  trendingTitle: {
    fontFamily: 'BigShouldersDisplay_900Black', fontSize: 22, color: Colors.cream, marginBottom: 6,
  },
  trendingDek: {
    fontFamily: 'Inter_400Regular', fontSize: 13, color: Colors.mutedText, lineHeight: 19,
    marginBottom: 16,
  },
  trendingRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  trendingRank: {
    fontFamily: 'BigShouldersDisplay_900Black', fontSize: 20, color: Colors.olive,
    width: 28,
  },
  trendingInfo: { flex: 1 },
  trendingArtist: { fontFamily: 'BigShouldersDisplay_900Black', fontSize: 14, color: Colors.cream },
  trendingItemTitle: { fontFamily: 'Inter_400Regular', fontSize: 13, color: Colors.cream, marginTop: 1 },
  trendingMeta: {
    fontFamily: 'JetBrainsMono_500Medium', fontSize: 9, color: Colors.mutedText,
    letterSpacing: 0.5, marginTop: 3,
  },
  trendingScoreBox: { alignItems: 'center', marginLeft: 10 },
  trendingScore: { fontFamily: 'BigShouldersDisplay_900Black', fontSize: 18, color: Colors.rust },
  trendingScoreLabel: {
    fontFamily: 'JetBrainsMono_500Medium', fontSize: 7, color: Colors.mutedText, letterSpacing: 0.5,
  },
  methodologyLink: {
    marginTop: 28, marginHorizontal: 20, paddingVertical: 16,
    borderWidth: 1, borderColor: Colors.border, alignItems: 'center',
  },
  methodologyLinkText: {
    fontFamily: 'JetBrainsMono_500Medium', fontSize: 10, color: Colors.amber, letterSpacing: 1,
  },
});

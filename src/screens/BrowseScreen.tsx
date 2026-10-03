import React, { useEffect, useState } from 'react';
import {
  View, Text, Image, FlatList, TouchableOpacity, StyleSheet, SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { Release, subscribeToLatestReleases, subscribeToBestOf } from '../firebase/firestore';
import ReleaseCard from '../components/ReleaseCard';

// subscribeToLatestReleases queries the latest published batch on or before
// this date, so it only needs today's local date — not which Friday it is.
function todayLocalDateString(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

interface Props {
  onOpenRelease: (release: Release) => void;
  onOpenMethodology: () => void;
  onOpenSaved: () => void;
}

// Issue №38 was the week of 2026-09-11; later weeks continue the weekly count.
const ISSUE_ANCHOR = { weekOf: '2026-09-11', number: 38 };
const DAY_NAMES = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

function parseLocalDate(weekOf: string): Date {
  const [y, m, d] = weekOf.split('-').map(Number);
  return new Date(y, m - 1, d);
}

const BEST_OF_YEAR = 2026;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function shortDate(weekOf: string): string {
  const d = parseLocalDate(weekOf);
  return `${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

function issueLabel(weekOf: string) {
  const weeks = Math.round(
    (parseLocalDate(weekOf).getTime() - parseLocalDate(ISSUE_ANCHOR.weekOf).getTime()) / (7 * 86400000)
  );
  return {
    number: ISSUE_ANCHOR.number + weeks,
    date: `${DAY_NAMES[parseLocalDate(weekOf).getDay()]} ${weekOf.replace(/-/g, '·')}`,
  };
}

export default function BrowseScreen({ onOpenRelease, onOpenMethodology, onOpenSaved }: Props) {
  const [releases, setReleases] = useState<Release[]>([]);
  const [bestOf, setBestOf] = useState<Release[]>([]);

  useEffect(() => {
    const unsub = subscribeToLatestReleases(todayLocalDateString(), setReleases);
    return unsub;
  }, []);

  useEffect(() => subscribeToBestOf(BEST_OF_YEAR, setBestOf), []);

  const issue = releases[0] ? issueLabel(releases[0].weekOf) : null;
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
            <View style={s.wordmarkRow}>
              <Text style={s.wordmark}>Browse</Text>
              <TouchableOpacity style={s.savedBtn} onPress={onOpenSaved}>
                <Ionicons name="bookmark-outline" size={12} color={Colors.rust} />
                <Text style={s.savedBtnText}>SAVED</Text>
              </TouchableOpacity>
            </View>
            {issue && (
              <View style={s.issueStrip}>
                <Text style={s.issueStripText}>ISSUE №{issue.number}</Text>
                <Text style={s.issueStripSep}>·</Text>
                <Text style={s.issueStripText}>{issue.date}</Text>
                <Text style={s.issueStripSep}>·</Text>
                <Text style={s.issueStripText}>09:00 ET</Text>
              </View>
            )}
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

            {bestOf.length > 0 && (
            <View style={s.trendingSection}>
              <Text style={s.kicker}>YEAR TO DATE · HIGHEST RATED</Text>
              <Text style={s.trendingTitle}>Still Trending — Best of 2026</Text>
              <Text style={s.trendingDek}>
                Notable releases from this year you may have missed. New studio albums only —
                no comps, live albums or reissues.
              </Text>
              {bestOf.map(r => (
                <TouchableOpacity
                  key={r.id}
                  style={s.trendingRow}
                  onPress={() => onOpenRelease(r)}
                  activeOpacity={0.75}
                >
                  <Text style={s.trendingRank}>{r.bestOf?.rank}</Text>
                  <View style={s.trendingInfo}>
                    <Text style={s.trendingArtist}>{r.artist}</Text>
                    <Text style={s.trendingItemTitle}>{r.title}</Text>
                    <Text style={s.trendingMeta}>
                      {[r.label, r.genres[0], shortDate(r.weekOf)].filter(Boolean).join(' · ')}
                    </Text>
                  </View>
                  <View style={s.trendingScoreBox}>
                    <Text style={s.trendingScore}>{r.bestOf?.metacriticScore}</Text>
                    <Text style={s.trendingScoreLabel}>Metacritic</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
            )}

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
  wordmarkRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  wordmark: { fontFamily: 'BigShouldersDisplay_900Black', fontSize: 26, color: Colors.cream },
  savedBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 1, borderColor: Colors.rust, paddingHorizontal: 10, paddingVertical: 6,
  },
  savedBtnText: { fontFamily: 'JetBrainsMono_500Medium', fontSize: 9, color: Colors.rust, letterSpacing: 1.5 },
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

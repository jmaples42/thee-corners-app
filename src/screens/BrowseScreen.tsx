import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, Image, FlatList, TouchableOpacity, StyleSheet, SafeAreaView, Modal, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import {
  Release, subscribeToLatestReleases, subscribeToBestOf, subscribeToIssues, subscribeToWeekReleases,
} from '../firebase/firestore';
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
  // null = the latest issue. Held by the navigator so it survives opening a release and coming back.
  week: string | null;
  onChangeWeek: (week: string | null) => void;
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

export default function BrowseScreen({
  onOpenRelease, onOpenMethodology, onOpenSaved, week, onChangeWeek,
}: Props) {
  const [releases, setReleases] = useState<Release[]>([]);
  const [bestOf, setBestOf] = useState<Release[]>([]);
  const [issues, setIssues] = useState<string[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const listRef = useRef<FlatList<Release>>(null);

  useEffect(() => {
    const unsub = week
      ? subscribeToWeekReleases(week, setReleases)
      : subscribeToLatestReleases(todayLocalDateString(), setReleases);
    return unsub;
  }, [week]);

  // Issues are newest-first; hide any dated after today, matching the latest-week query.
  useEffect(
    () => subscribeToIssues(weeks => setIssues(weeks.filter(w => w <= todayLocalDateString()))),
    []
  );

  useEffect(() => subscribeToBestOf(BEST_OF_YEAR, setBestOf), []);

  const currentWeek = week ?? releases[0]?.weekOf ?? issues[0] ?? null;
  const currentIndex = currentWeek ? issues.indexOf(currentWeek) : -1;
  const newerWeek = currentIndex > 0 ? issues[currentIndex - 1] : null;
  const olderWeek = currentIndex >= 0 ? issues[currentIndex + 1] ?? null : null;
  const isLatest = !week;

  const selectWeek = (w: string) => {
    onChangeWeek(w === issues[0] ? null : w);
    setPickerOpen(false);
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
  };

  const issue = currentWeek ? issueLabel(currentWeek) : null;
  const thisWeek = releases.filter(r => !r.stillInRotation);
  const rotation = releases.filter(r => r.stillInRotation);

  return (
    <SafeAreaView style={s.container}>
      <FlatList
        ref={listRef}
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
                <TouchableOpacity
                  disabled={!olderWeek}
                  onPress={() => olderWeek && selectWeek(olderWeek)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="chevron-back" size={16} color={olderWeek ? Colors.background : Colors.mutedText} />
                </TouchableOpacity>
                <TouchableOpacity style={s.issueStripCenter} onPress={() => setPickerOpen(true)}>
                  <Text style={s.issueStripText}>ISSUE №{issue.number}</Text>
                  <Text style={s.issueStripSep}>·</Text>
                  <Text style={s.issueStripText}>{issue.date}</Text>
                  <Ionicons name="chevron-down" size={11} color={Colors.amber} />
                </TouchableOpacity>
                <TouchableOpacity
                  disabled={!newerWeek}
                  onPress={() => newerWeek && selectWeek(newerWeek)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="chevron-forward" size={16} color={newerWeek ? Colors.background : Colors.mutedText} />
                </TouchableOpacity>
              </View>
            )}
            <Text style={s.dek}>
              <Text style={s.dekLede}>Every Friday we publish a list of the week's most anticipated releases</Text>
              {' '}along with aggregated critical reception from leading music sources. Disagree? Add what you have to say about any release.
            </Text>
            <Text style={s.sectionHead}>
              {isLatest || !currentWeek ? 'This Week — Releases' : `Week of ${shortDate(currentWeek)} — Releases`}
            </Text>
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

      <Modal visible={pickerOpen} transparent animationType="fade" onRequestClose={() => setPickerOpen(false)}>
        <TouchableOpacity style={s.modalBackdrop} activeOpacity={1} onPress={() => setPickerOpen(false)}>
          <View style={s.modalSheet}>
            <Text style={s.modalTitle}>ISSUES</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {issues.map(w => {
                const il = issueLabel(w);
                return (
                  <TouchableOpacity key={w} style={s.modalRow} onPress={() => selectWeek(w)}>
                    <Text style={[s.modalRowText, w === currentWeek && s.modalRowActive]}>
                      ISSUE №{il.number}  ·  {il.date}
                    </Text>
                    {w === currentWeek && <Ionicons name="checkmark" size={14} color={Colors.rust} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
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
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.cream, paddingHorizontal: 10, paddingVertical: 8, marginBottom: 16,
  },
  issueStripCenter: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 },
  issueStripText: {
    fontFamily: 'JetBrainsMono_500Medium', fontSize: 10, color: Colors.background, letterSpacing: 0.5,
  },
  issueStripSep: { fontFamily: 'JetBrainsMono_500Medium', fontSize: 10, color: Colors.amber },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(26,18,14,0.45)', justifyContent: 'center', padding: 24 },
  modalSheet: {
    backgroundColor: Colors.cardBg, borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: 18, paddingTop: 16, paddingBottom: 8, maxHeight: '70%',
  },
  modalTitle: {
    fontFamily: 'JetBrainsMono_500Medium', fontSize: 9, color: Colors.amber, letterSpacing: 3, marginBottom: 8,
  },
  modalRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 14, borderTopWidth: 1, borderTopColor: Colors.border,
  },
  modalRowText: { fontFamily: 'JetBrainsMono_500Medium', fontSize: 11, color: Colors.mutedText, letterSpacing: 0.5 },
  modalRowActive: { color: Colors.cream },
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

import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import { Colors } from '../theme/colors';

interface Props {
  onBack: () => void;
}

const RELEASE_SOURCES = [
  'MusicBrainz', 'Apple Music New Releases', 'Spotify New Releases (LP/EP filter)',
  'AllMusic upcoming', 'Album of the Year', 'Label PR feeds', 'Mediabase / BDS',
];

const CRITIC_PUBLICATIONS = [
  'Pitchfork', 'Stereogum', 'Hearing Things', 'AllMusic', 'AV Club',
  'Rolling Stone', 'PopMatters', 'Metacritic', 'AnyDecentMusic?',
];

const CRITIC_SUBSTACKS = [
  'Britpop (Brittany Spanos)', 'Sterlewine', 'String Theories', "Don't Rock the Inbox",
];

const LABEL_GROUPS: { heading: string; labels: string[] }[] = [
  {
    heading: 'Indie metal',
    labels: [
      'Profound Lore', 'Relapse', 'Sargent House', 'Southern Lord', 'Season of Mist',
      'Nuclear Blast', 'Century Media', 'Roadrunner', 'Sumerian', 'Rise', 'Metal Blade',
      '20 Buck Spin', 'Ipecac', 'The Flenser', 'Gilead Media', 'Closed Casket', '3DOT',
    ],
  },
  {
    heading: 'Americana / indie country / roots',
    labels: [
      'New West', 'Thirty Tigers', 'Yep Roc', 'Dualtone', 'Rounder', 'Sugar Hill',
      'Black Hen', 'ATO', 'Acony', 'Single Lock', 'Free Dirt', 'Loose Music',
      'Oh Boy', 'Continental', 'Western Vinyl',
    ],
  },
  {
    heading: 'Crossover & archival',
    labels: [
      'Third Man', 'Concord Music Group', 'Exceleration', 'Sub Pop', 'Drag City',
      'Numero Group', 'Light in the Attic', 'International Anthem', 'Bandcamp Editorial Daily',
    ],
  },
];

function ListSection({ heading, items }: { heading: string; items: string[] }) {
  return (
    <View style={s.section}>
      <Text style={s.sectionHead}>{heading}</Text>
      {items.map(item => (
        <Text key={item} style={s.listItem}>{item}</Text>
      ))}
    </View>
  );
}

export default function MethodologyScreen({ onBack }: Props) {
  return (
    <SafeAreaView style={s.container}>
      <View style={s.nav}>
        <TouchableOpacity onPress={onBack}><Text style={s.back}>← Back</Text></TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={s.inner} showsVerticalScrollIndicator={false}>
        <Text style={s.title}>How this list gets made</Text>

        <Text style={s.body}>
          An agent runs Thursday night through Friday 8:30 AM ET, scanning new-release sources and
          deduping into a canonical list of LPs and EPs only — singles are excluded from the
          headline list, even when Spotify shelves them under "releases," and instead routed into
          the The Single Life section. Off-Friday drops (Sunday/Monday/Tuesday rap and pop releases
          trying to beat leaks) are flagged separately so the canonical Friday list stays clean.
        </Text>
        <Text style={s.body}>
          Each release is tagged Major or Indie based on label parentage so readers can tune the
          feed to the side of the week they actually care about. Critical reception is aggregated
          where available, with direct links to publications and Substack curators still doing the
          work of recommending albums to the people who actually want to listen.
        </Text>

        <ListSection heading="Release sources" items={RELEASE_SOURCES} />
        <ListSection heading="Critic sources — publications" items={CRITIC_PUBLICATIONS} />
        <ListSection heading="Critic sources — Substack curators" items={CRITIC_SUBSTACKS} />

        <View style={s.section}>
          <Text style={s.sectionHead}>Labels we watch — niche-genre coverage</Text>
          <Text style={s.body}>
            A curated registry of indie labels we poll directly so the canonical list never misses
            an extreme-music, Americana, or archival release. The aggregators undersurface these by
            design — the labels don't have major-PR muscle and the metadata is messier. Carried
            forward from Gimme Metal and Gimme Country, the curatorial DNA that taught us this kind
            of editorial discipline beats algorithms.
          </Text>
        </View>

        {LABEL_GROUPS.map(g => (
          <ListSection key={g.heading} heading={g.heading} items={g.labels} />
        ))}

        <Text style={s.footer}>
          v0.2 registry · 41 labels · seed merged with Jon's first list · label-registry.json →
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  nav: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
  back: { fontFamily: 'JetBrainsMono_500Medium', fontSize: 11, color: Colors.amber, letterSpacing: 1 },
  inner: { paddingHorizontal: 20, paddingBottom: 60 },
  title: {
    fontFamily: 'BigShouldersDisplay_900Black', fontSize: 30, color: Colors.cream, marginBottom: 18,
  },
  body: {
    fontFamily: 'Inter_400Regular', fontSize: 14, color: Colors.mutedText, lineHeight: 21,
    marginBottom: 16,
  },
  section: { marginTop: 12, marginBottom: 8 },
  sectionHead: {
    fontFamily: 'JetBrainsMono_500Medium', fontSize: 10, color: Colors.amber,
    letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10,
    borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 14,
  },
  listItem: {
    fontFamily: 'Inter_400Regular', fontSize: 14, color: Colors.cream, lineHeight: 22,
  },
  footer: {
    fontFamily: 'JetBrainsMono_500Medium', fontSize: 9, color: Colors.mutedText,
    letterSpacing: 0.5, marginTop: 24, lineHeight: 16,
  },
});

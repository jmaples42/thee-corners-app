import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { Colors } from '../theme/colors';
import { Release } from '../firebase/firestore';
import ReleaseDetailScreen from '../screens/ReleaseDetailScreen';
// Editorial QA preview — reads a week's draft file directly, before it's
// published to Firestore. Point this at the same file as the WEEK_DATA_FILE
// pointer in scripts/publish-releases.ts; update both when starting a new week.
import { WEEK_RELEASES } from '../../scripts/data/releases-2026-09-25';

const QA_UID = 'qa-editor';
const QA_USERNAME = 'editor';

function toPreviewRelease(draft: (typeof WEEK_RELEASES)[number], index: number): Release {
  return {
    id: `qa-preview-${index}`,
    commentCount: 0,
    createdAt: Date.now(),
    publishedBy: 'editorial',
    ...draft,
  };
}

// Which optional fields are filled in, at a glance, before publishing.
function checklist(r: Release): string {
  const marks = [
    r.criticsHighlight ? 'critics✓' : 'critics✗',
    r.userHighlight ? 'user✓' : 'user✗',
    r.sampleUrl ? 'sample✓' : 'sample✗',
    r.editorsTake ? 'editorial✓' : 'editorial✗',
  ];
  return marks.join('  ');
}

export default function ReleaseQAScreen() {
  const releases = WEEK_RELEASES.map(toPreviewRelease);
  const [selected, setSelected] = useState<Release | null>(null);

  if (selected) {
    return (
      <ReleaseDetailScreen
        release={selected}
        currentUid={QA_UID}
        username={QA_USERNAME}
        onBack={() => setSelected(null)}
      />
    );
  }

  return (
    <SafeAreaView style={s.container}>
      <Text style={s.header}>RELEASE QA · {releases.length} DRAFTS · NOT PUBLISHED</Text>
      <FlatList
        data={releases}
        keyExtractor={r => r.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={s.row} onPress={() => setSelected(item)}>
            <Text style={s.rowTitle}>{item.artist} — {item.title}</Text>
            <Text style={s.rowMeta}>{item.format} · {item.tier} · {item.isFeatured ? 'FEATURED' : 'not featured'}</Text>
            <Text style={s.rowChecklist}>{checklist(item)}</Text>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    fontFamily: 'JetBrainsMono_500Medium', fontSize: 10, color: Colors.amber,
    letterSpacing: 2, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 10,
  },
  row: { paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.border },
  rowTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: Colors.cream },
  rowMeta: { fontFamily: 'JetBrainsMono_500Medium', fontSize: 9, color: Colors.mutedText, marginTop: 4, letterSpacing: 0.5 },
  rowChecklist: { fontFamily: 'JetBrainsMono_500Medium', fontSize: 9, color: Colors.olive, marginTop: 4, letterSpacing: 0.5 },
});

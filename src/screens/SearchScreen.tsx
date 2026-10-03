import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { Release, getAllReleases } from '../firebase/firestore';
import ReleaseCard from '../components/ReleaseCard';
import { issueLabel, shortDate } from '../utils/issues';

interface Props {
  // Held by the navigator so the query survives opening a result and coming back.
  query: string;
  onChangeQuery: (query: string) => void;
  onOpenRelease: (release: Release) => void;
  onBack: () => void;
}

// Lowercase, strip accents and punctuation so "gutierrez" finds Gutiérrez and
// "ed obrien" finds Ed O'Brien.
function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/['’`]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function matches(release: Release, tokens: string[]): boolean {
  const haystack = normalize(`${release.artist} ${release.title} ${release.label ?? ''}`);
  return tokens.every(t => haystack.includes(t));
}

function contextLabel(release: Release): string {
  if (release.bestOf) return `BEST OF ${release.bestOf.year} · #${release.bestOf.rank}`;
  return `ISSUE №${issueLabel(release.weekOf).number} · ${shortDate(release.weekOf).toUpperCase()}`;
}

export default function SearchScreen({ query, onChangeQuery, onOpenRelease, onBack }: Props) {
  const [all, setAll] = useState<Release[] | null>(null);
  const [failed, setFailed] = useState(false);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    getAllReleases().then(setAll).catch(() => setFailed(true));
  }, []);

  const tokens = useMemo(() => normalize(query).split(' ').filter(Boolean), [query]);

  const results = useMemo(() => {
    if (!all || tokens.length === 0) return [];
    return all
      .filter(r => matches(r, tokens))
      .sort((a, b) => b.weekOf.localeCompare(a.weekOf) || a.artist.localeCompare(b.artist));
  }, [all, tokens]);

  let emptyText: string | null = null;
  if (failed) emptyText = "Couldn't load releases. Check your connection and try again.";
  else if (tokens.length === 0) emptyText = 'Search by artist, title, or label.';
  else if (all && results.length === 0) emptyText = `No releases match “${query.trim()}”.`;

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={onBack} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Text style={s.backText}>←</Text>
        </TouchableOpacity>
        <View style={s.inputWrap}>
          <Ionicons name="search" size={14} color={Colors.mutedText} />
          <TextInput
            ref={inputRef}
            style={s.input}
            value={query}
            onChangeText={onChangeQuery}
            placeholder="Artist, title, or label"
            placeholderTextColor={Colors.mutedText}
            autoFocus={query.length === 0}
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="search"
            onSubmitEditing={Keyboard.dismiss}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => { onChangeQuery(''); inputRef.current?.focus(); }} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close-circle" size={16} color={Colors.mutedText} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FlatList
        data={results}
        keyExtractor={r => r.id}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        renderItem={({ item }) => (
          <View>
            <Text style={s.context}>{contextLabel(item)}</Text>
            <ReleaseCard release={item} onPress={() => onOpenRelease(item)} />
          </View>
        )}
        contentContainerStyle={{ paddingBottom: 100 }}
        ListHeaderComponent={
          results.length > 0 ? (
            <Text style={s.count}>{results.length} {results.length === 1 ? 'RESULT' : 'RESULTS'}</Text>
          ) : null
        }
        ListEmptyComponent={emptyText ? <Text style={s.empty}>{emptyText}</Text> : null}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 20, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  backText: { fontSize: 22, color: Colors.cream },
  inputWrap: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.cardBg,
    paddingHorizontal: 12, paddingVertical: 9,
  },
  input: { flex: 1, fontFamily: 'Inter_400Regular', fontSize: 14, color: Colors.cream, padding: 0 },
  count: {
    fontFamily: 'JetBrainsMono_500Medium', fontSize: 9, color: Colors.amber, letterSpacing: 2,
    paddingHorizontal: 20, paddingTop: 14, paddingBottom: 4,
  },
  context: {
    fontFamily: 'JetBrainsMono_500Medium', fontSize: 8, color: Colors.mutedText, letterSpacing: 1.5,
    paddingHorizontal: 20, paddingTop: 12,
  },
  empty: {
    fontFamily: 'Inter_400Regular', fontSize: 14, color: Colors.mutedText, textAlign: 'center',
    paddingHorizontal: 40, paddingTop: 60,
  },
});

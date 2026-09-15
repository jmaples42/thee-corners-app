import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  ScrollView, ActivityIndicator,
} from 'react-native';
import { Colors } from '../theme/colors';
import { saveUserProfile, UserProfile } from '../firebase/firestore';

const GENRES = [
  { slug: 'metal', label: 'Metal', adj: 'unrelenting' },
  { slug: 'doom', label: 'Doom', adj: 'glacial' },
  { slug: 'shoegaze', label: 'Shoegaze', adj: 'oceanic' },
  { slug: 'alt-country', label: 'Alt-Country', adj: 'lonesome' },
  { slug: 'punk', label: 'Punk', adj: 'refusal' },
  { slug: 'psych', label: 'Psych', adj: 'dissolving' },
  { slug: 'americana', label: 'Americana', adj: 'worn-in' },
  { slug: 'noise', label: 'Noise', adj: 'brutal' },
];

interface Props {
  uid: string;
  phoneNumber: string;
  username: string;
  onComplete: (profile: UserProfile) => void;
}

export default function GenrePickerScreen({ uid, phoneNumber, username, onComplete }: Props) {
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const toggle = (slug: string) => {
    setSelected(prev =>
      prev.includes(slug) ? prev.filter(s => s !== slug) : [...prev, slug]
    );
  };

  const handleEnter = async () => {
    if (selected.length === 0) return;
    setLoading(true);
    setError('');
    try {
      const profile: UserProfile = {
        uid,
        phoneNumber,
        username,
        genres: selected,
        createdAt: Date.now(),
      };
      await saveUserProfile(profile);
      onComplete(profile);
    } catch {
      setError('Could not save your profile. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.container}>
      <ScrollView contentContainerStyle={s.inner} showsVerticalScrollIndicator={false}>
        <View style={s.header}>
          <Text style={s.title}>What's your</Text>
          <Text style={s.titleItalic}>corner?</Text>
          <View style={s.rule} />
          <Text style={s.sub}>SELECT THE SOUNDS THAT DEFINE YOU</Text>
        </View>

        <View style={s.grid}>
          {GENRES.map(g => {
            const active = selected.includes(g.slug);
            return (
              <TouchableOpacity
                key={g.slug}
                style={[s.tile, active && s.tileActive]}
                onPress={() => toggle(g.slug)}
                activeOpacity={0.8}
              >
                <Text style={[s.tileLabel, active && s.tileLabelActive]}>{g.label}</Text>
                <Text style={[s.tileAdj, active && s.tileAdjActive]}>{g.adj}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={s.footer}>
          <Text style={s.selCount}>
            {selected.length > 0
              ? `${selected.length} CORNER${selected.length > 1 ? 'S' : ''} CLAIMED`
              : 'SELECT AT LEAST ONE'}
          </Text>
          {error ? <Text style={s.error}>{error}</Text> : null}
          <TouchableOpacity
            style={[s.cta, selected.length === 0 && s.ctaDisabled]}
            onPress={handleEnter}
            disabled={selected.length === 0 || loading}
            activeOpacity={0.8}
          >
            {loading
              ? <ActivityIndicator color={Colors.cream} />
              : <Text style={s.ctaText}>ENTER THE CORNERS</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  inner: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 40 },
  header: { marginBottom: 32 },
  title: { fontFamily: 'Inter_400Regular', fontSize: 36, color: Colors.cream },
  titleItalic: { fontFamily: 'BigShouldersDisplay_900Black', fontSize: 42, color: Colors.cream, marginTop: -8 },
  rule: { width: 80, height: 1, backgroundColor: Colors.rust, marginVertical: 14 },
  sub: { fontFamily: 'JetBrainsMono_500Medium', fontSize: 9, color: Colors.amber, letterSpacing: 3 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 36 },
  tile: {
    width: '47%',
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.cardBg,
    padding: 20,
    alignItems: 'flex-start',
  },
  tileActive: { borderColor: Colors.rust, backgroundColor: Colors.darkBrown },
  tileLabel: { fontFamily: 'BigShouldersDisplay_900Black', fontSize: 20, color: Colors.mutedText, marginBottom: 6 },
  tileLabelActive: { color: Colors.cream },
  tileAdj: { fontFamily: 'JetBrainsMono_500Medium', fontSize: 10, color: Colors.olive, letterSpacing: 1 },
  tileAdjActive: { color: Colors.rust },
  footer: { alignItems: 'center' },
  selCount: { fontFamily: 'JetBrainsMono_500Medium', fontSize: 9, color: Colors.amber, letterSpacing: 2, marginBottom: 16 },
  error: { fontFamily: 'Inter_400Regular', fontSize: 13, color: Colors.rust, marginBottom: 12, textAlign: 'center' },
  cta: { backgroundColor: Colors.rust, paddingVertical: 18, paddingHorizontal: 48, width: '100%', alignItems: 'center' },
  ctaDisabled: { backgroundColor: Colors.border },
  ctaText: { fontFamily: 'JetBrainsMono_500Medium', fontSize: 12, color: Colors.cream, letterSpacing: 3 },
});

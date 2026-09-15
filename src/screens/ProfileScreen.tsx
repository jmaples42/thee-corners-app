import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { Colors } from '../theme/colors';

interface Props {
  username: string;
  genres: string[];
}

export default function ProfileScreen({ username, genres }: Props) {
  return (
    <SafeAreaView style={s.container}>
      <ScrollView contentContainerStyle={s.inner} showsVerticalScrollIndicator={false}>
        <Text style={s.sectionLabel}>ME</Text>
        <View style={s.profileRow}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{username[0]?.toUpperCase() ?? '?'}</Text>
          </View>
          <View style={s.profileInfo}>
            <Text style={s.handle}>@{username}</Text>
            <View style={s.genreRow}>
              {genres.map(g => (
                <View key={g} style={s.genrePill}>
                  <Text style={s.genrePillText}>{g}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  inner: { paddingHorizontal: 20, paddingTop: 12 },
  sectionLabel: {
    fontFamily: 'JetBrainsMono_500Medium', fontSize: 8, color: Colors.amber,
    letterSpacing: 3, marginBottom: 20,
  },
  profileRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 56, height: 56, backgroundColor: Colors.darkBrown,
    borderWidth: 2, borderColor: Colors.rust,
    alignItems: 'center', justifyContent: 'center', marginRight: 16,
  },
  avatarText: { fontFamily: 'BigShouldersDisplay_900Black', fontSize: 24, color: Colors.amber },
  profileInfo: { flex: 1 },
  handle: { fontFamily: 'BigShouldersDisplay_900Black', fontSize: 20, color: Colors.cream, marginBottom: 8 },
  genreRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  genrePill: { borderWidth: 1, borderColor: Colors.olive, paddingHorizontal: 7, paddingVertical: 2 },
  genrePillText: { fontFamily: 'JetBrainsMono_500Medium', fontSize: 8, color: Colors.olive, letterSpacing: 1 },
});

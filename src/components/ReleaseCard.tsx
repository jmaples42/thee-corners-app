import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '../theme/colors';
import { Font } from '../theme/typography';
import { Release } from '../firebase/firestore';

export default function ReleaseCard({ release, onPress }: { release: Release; onPress: () => void }) {
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
        <Text style={rc.title} numberOfLines={2}><Text style={rc.artist}>{release.artist}</Text>  {release.title}</Text>
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
  artFallback: { fontFamily: Font.display, fontSize: 26, color: Colors.olive },
  body: { flex: 1, justifyContent: 'center' },
  title: { fontFamily: Font.body, fontSize: 17, color: Colors.cream, marginBottom: 6 },
  artist: { fontFamily: Font.display },
  tagRow: { flexDirection: 'row', gap: 6, marginBottom: 6 },
  tag: { borderWidth: 1, borderColor: Colors.olive, paddingHorizontal: 6, paddingVertical: 1 },
  tagText: { fontFamily: Font.label, fontSize: 12, color: Colors.olive, letterSpacing: 1 },
  blurb: { fontFamily: Font.body, fontSize: 14, color: Colors.mutedText, lineHeight: 20, marginBottom: 4 },
  commentCount: { fontFamily: Font.label, fontSize: 12, color: Colors.amberText },
});

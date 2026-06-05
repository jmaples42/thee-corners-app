import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, SafeAreaView,
} from 'react-native';
import { Colors } from '../theme/colors';
import { Corner, MOCK_CORNERS, subscribeToUserCorners } from '../firebase/firestore';

function timeAgo(ts: number) {
  const d = Date.now() - ts;
  if (d < 3600000) return `${Math.floor(d / 60000)}m ago`;
  if (d < 86400000) return `${Math.floor(d / 3600000)}h ago`;
  if (d < 7 * 86400000) return `${Math.floor(d / 86400000)}d ago`;
  return `${Math.floor(d / (7 * 86400000))}w ago`;
}

interface Props {
  currentUid: string;
  username: string;
  genres: string[];
  onOpenCorner: (corner: Corner) => void;
  onCreateCorner: () => void;
  onSignOut: () => void;
}

export default function CornersListScreen({
  currentUid, username, genres, onOpenCorner, onCreateCorner, onSignOut,
}: Props) {
  const [corners, setCorners] = useState<Corner[]>(MOCK_CORNERS);

  useEffect(() => {
    // TODO: swap mock for live subscription once auth is wired end-to-end
    // const unsub = subscribeToUserCorners(currentUid, setCorners);
    // return unsub;
  }, [currentUid]);

  return (
    <SafeAreaView style={s.container}>
      {/* Profile header */}
      <View style={s.header}>
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
          <TouchableOpacity style={s.newBtn} onPress={onCreateCorner}>
            <Text style={s.newBtnText}>+ CORNER</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={s.sectionLabel}>YOUR CORNERS</Text>

      <FlatList
        data={corners}
        keyExtractor={c => c.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 60 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={s.cornerCard}
            onPress={() => onOpenCorner(item)}
            activeOpacity={0.75}
          >
            <View style={s.cornerLeft}>
              <Text style={s.cornerName}>{item.name}</Text>
              <Text style={s.cornerMeta}>
                {item.memberUids.length} {item.memberUids.length === 1 ? 'member' : 'members'}
                {item.ownerUid === currentUid ? '  ·  yours' : ''}
              </Text>
            </View>
            <Text style={s.lastActive}>{timeAgo(item.lastActivityAt)}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={s.emptyTitle}>No corners yet.</Text>
            <Text style={s.emptyBody}>Create one and invite your people.</Text>
            <TouchableOpacity style={s.emptyBtn} onPress={onCreateCorner}>
              <Text style={s.emptyBtnText}>CREATE A CORNER</Text>
            </TouchableOpacity>
          </View>
        }
        ListFooterComponent={
          corners.length > 0 ? (
            <TouchableOpacity style={s.signOutBtn} onPress={onSignOut}>
              <Text style={s.signOutText}>SIGN OUT</Text>
            </TouchableOpacity>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 18,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  profileRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 44, height: 44, backgroundColor: Colors.darkBrown,
    borderWidth: 2, borderColor: Colors.rust,
    alignItems: 'center', justifyContent: 'center', marginRight: 14,
  },
  avatarText: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 20, color: Colors.amber },
  profileInfo: { flex: 1 },
  handle: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 16, color: Colors.cream, marginBottom: 5 },
  genreRow: { flexDirection: 'row', gap: 6 },
  genrePill: { borderWidth: 1, borderColor: Colors.olive, paddingHorizontal: 7, paddingVertical: 2 },
  genrePillText: { fontFamily: 'SpaceMono_400Regular', fontSize: 8, color: Colors.olive, letterSpacing: 1 },
  newBtn: { borderWidth: 1, borderColor: Colors.rust, paddingHorizontal: 12, paddingVertical: 7 },
  newBtnText: { fontFamily: 'SpaceMono_400Regular', fontSize: 9, color: Colors.rust, letterSpacing: 1 },
  sectionLabel: {
    fontFamily: 'SpaceMono_400Regular', fontSize: 8, color: Colors.amber,
    letterSpacing: 3, marginHorizontal: 20, marginTop: 24, marginBottom: 10,
  },
  cornerCard: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 20,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  cornerLeft: { flex: 1 },
  cornerName: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 18, color: Colors.cream, marginBottom: 4 },
  cornerMeta: { fontFamily: 'SpaceMono_400Regular', fontSize: 9, color: Colors.mutedText, letterSpacing: 1 },
  lastActive: { fontFamily: 'SpaceMono_400Regular', fontSize: 9, color: Colors.olive },
  empty: { padding: 48, alignItems: 'center' },
  emptyTitle: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 22, color: Colors.cream, marginBottom: 8 },
  emptyBody: {
    fontFamily: 'System', fontSize: 14, color: Colors.mutedText,
    marginBottom: 28, textAlign: 'center', lineHeight: 22,
  },
  emptyBtn: { borderWidth: 1, borderColor: Colors.rust, paddingHorizontal: 24, paddingVertical: 12 },
  emptyBtnText: { fontFamily: 'SpaceMono_400Regular', fontSize: 10, color: Colors.rust, letterSpacing: 2 },
  signOutBtn: { alignItems: 'center', paddingVertical: 32 },
  signOutText: { fontFamily: 'SpaceMono_400Regular', fontSize: 9, color: Colors.mutedText, letterSpacing: 2 },
});

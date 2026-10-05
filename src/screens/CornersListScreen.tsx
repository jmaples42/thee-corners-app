import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, SafeAreaView, Alert, ActivityIndicator,
} from 'react-native';
import { Colors } from '../theme/colors';
import {
  Corner, Invite, subscribeToUserCorners, subscribeToMyInvites, acceptInvite, declineInvite,
} from '../firebase/firestore';

function timeAgo(ts: number) {
  const d = Date.now() - ts;
  if (d < 3600000) return `${Math.floor(d / 60000)}m ago`;
  if (d < 86400000) return `${Math.floor(d / 3600000)}h ago`;
  if (d < 7 * 86400000) return `${Math.floor(d / 86400000)}d ago`;
  return `${Math.floor(d / (7 * 86400000))}w ago`;
}

interface Props {
  currentUid: string;
  currentPhone: string;
  onOpenCorner: (corner: Corner) => void;
  onCreateCorner: () => void;
}

export default function CornersListScreen({
  currentUid, currentPhone, onOpenCorner, onCreateCorner,
}: Props) {
  const [corners, setCorners] = useState<Corner[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [busyInvite, setBusyInvite] = useState<string | null>(null);

  useEffect(() => {
    if (!currentPhone) return;
    return subscribeToMyInvites(currentPhone, setInvites);
  }, [currentPhone]);

  const handleAccept = async (invite: Invite) => {
    setBusyInvite(invite.id);
    try {
      await acceptInvite(invite, currentUid);
    } catch (e) {
      console.error(e);
      Alert.alert(
        "Couldn't join",
        'This corner may be full (free corners hold 5 people) or the invite was withdrawn.'
      );
    } finally {
      setBusyInvite(null);
    }
  };

  const handleDecline = async (invite: Invite) => {
    setBusyInvite(invite.id);
    try {
      await declineInvite(invite);
    } catch (e) {
      console.error(e);
    } finally {
      setBusyInvite(null);
    }
  };

  useEffect(() => {
    const unsub = subscribeToUserCorners(currentUid, setCorners);
    return unsub;
  }, [currentUid]);

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.sectionLabel}>MY CORNERS</Text>
        <TouchableOpacity style={s.newBtn} onPress={onCreateCorner}>
          <Text style={s.newBtnText}>+ NEW CORNER</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={corners}
        ListHeaderComponent={
          invites.length > 0 ? (
            <View style={s.invitesSection}>
              <Text style={s.sectionLabel}>INVITATIONS</Text>
              {invites.map(inv => (
                <View key={inv.id} style={s.inviteCard}>
                  <Text style={s.inviteText}>
                    <Text style={s.inviteBold}>{inv.invitedByUsername}</Text> invited you to{' '}
                    <Text style={s.inviteBold}>{inv.cornerName}</Text>
                  </Text>
                  {busyInvite === inv.id ? (
                    <ActivityIndicator color={Colors.rust} style={{ marginTop: 12 }} />
                  ) : (
                    <View style={s.inviteActions}>
                      <TouchableOpacity style={s.acceptBtn} onPress={() => handleAccept(inv)}>
                        <Text style={s.acceptBtnText}>ACCEPT</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={s.declineBtn} onPress={() => handleDecline(inv)}>
                        <Text style={s.declineBtnText}>DECLINE</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              ))}
            </View>
          ) : null
        }
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
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  sectionLabel: {
    fontFamily: 'JetBrainsMono_500Medium', fontSize: 8, color: Colors.amber,
    letterSpacing: 3,
  },
  newBtn: { borderWidth: 1, borderColor: Colors.rust, paddingHorizontal: 12, paddingVertical: 7 },
  newBtnText: { fontFamily: 'JetBrainsMono_500Medium', fontSize: 9, color: Colors.rust, letterSpacing: 1 },
  cornerCard: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 20,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  cornerLeft: { flex: 1 },
  cornerName: { fontFamily: 'BigShouldersDisplay_900Black', fontSize: 18, color: Colors.cream, marginBottom: 4 },
  cornerMeta: { fontFamily: 'JetBrainsMono_500Medium', fontSize: 9, color: Colors.mutedText, letterSpacing: 1 },
  lastActive: { fontFamily: 'JetBrainsMono_500Medium', fontSize: 9, color: Colors.olive },
  invitesSection: {
    paddingHorizontal: 20, paddingTop: 18, paddingBottom: 8,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  inviteCard: {
    borderWidth: 1, borderColor: Colors.rust, backgroundColor: Colors.cardBg,
    padding: 14, marginTop: 10,
  },
  inviteText: { fontFamily: 'Inter_400Regular', fontSize: 14, color: Colors.cream, lineHeight: 20 },
  inviteBold: { fontFamily: 'Inter_600SemiBold' },
  inviteActions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  acceptBtn: { backgroundColor: Colors.rust, paddingHorizontal: 18, paddingVertical: 10 },
  acceptBtnText: { fontFamily: 'JetBrainsMono_500Medium', fontSize: 10, color: Colors.cream, letterSpacing: 2 },
  declineBtn: { borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 18, paddingVertical: 10 },
  declineBtnText: { fontFamily: 'JetBrainsMono_500Medium', fontSize: 10, color: Colors.mutedText, letterSpacing: 2 },
  empty: { padding: 48, alignItems: 'center' },
  emptyTitle: { fontFamily: 'BigShouldersDisplay_900Black', fontSize: 22, color: Colors.cream, marginBottom: 8 },
  emptyBody: {
    fontFamily: 'Inter_400Regular', fontSize: 14, color: Colors.mutedText,
    marginBottom: 28, textAlign: 'center', lineHeight: 22,
  },
  emptyBtn: { borderWidth: 1, borderColor: Colors.rust, paddingHorizontal: 24, paddingVertical: 12 },
  emptyBtnText: { fontFamily: 'JetBrainsMono_500Medium', fontSize: 10, color: Colors.rust, letterSpacing: 2 },
});

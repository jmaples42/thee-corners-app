import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '../theme/colors';
import {
  ReleaseComment, toggleCommentReaction, deleteReleaseComment, updateReleaseComment,
} from '../firebase/firestore';

const REACTIONS = ['🔥', '🫀', '🌙', '🐘'];

function timeAgo(ts: number) {
  const d = Date.now() - ts;
  if (d < 3600000) return `${Math.floor(d / 60000)}m ago`;
  if (d < 86400000) return `${Math.floor(d / 3600000)}h ago`;
  return `${Math.floor(d / 86400000)}d ago`;
}

interface Props {
  comment: ReleaseComment;
  currentUid: string;
  releaseId: string;
  releaseLabel?: string;
}

export default function CommentCard({ comment, currentUid, releaseId, releaseLabel }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(comment.text);
  const [saving, setSaving] = useState(false);

  const reactions = comment.reactions ?? {};
  const isMine = comment.uid === currentUid;

  const handleToggleReaction = (emoji: string) => {
    const current = reactions[emoji] ?? [];
    const hasReacted = current.includes(currentUid);
    toggleCommentReaction(releaseId, comment.id, emoji, currentUid, hasReacted);
  };

  const handleSaveEdit = async () => {
    const text = draft.trim();
    if (!text || saving) return;
    setSaving(true);
    try {
      await updateReleaseComment(releaseId, comment.id, text);
      setIsEditing(false);
    } catch (e) {
      console.error('updateReleaseComment failed:', e);
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setDraft(comment.text);
    setIsEditing(false);
  };

  return (
    <View style={cc.card}>
      {releaseLabel ? <Text style={cc.releaseLabel}>{releaseLabel}</Text> : null}
      <View style={cc.header}>
        <View style={cc.avatar}>
          <Text style={cc.avatarText}>{comment.username[0]?.toUpperCase()}</Text>
        </View>
        <View style={cc.headerRight}>
          <Text style={cc.username}>@{comment.username}</Text>
          <Text style={cc.timestamp}>
            {timeAgo(comment.createdAt)}{comment.editedAt ? ' · edited' : ''}
          </Text>
        </View>
        {isMine && !isEditing && (
          <View style={cc.ownerActions}>
            <TouchableOpacity onPress={() => setIsEditing(true)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={cc.edit}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => deleteReleaseComment(releaseId, comment.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={cc.delete}>Delete</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {isEditing ? (
        <View style={cc.editBlock}>
          <TextInput
            style={cc.editInput}
            value={draft}
            onChangeText={setDraft}
            multiline
            maxLength={500}
            autoFocus
          />
          <View style={cc.editActions}>
            <TouchableOpacity onPress={handleCancelEdit} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={cc.editCancel}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[cc.editSaveBtn, (!draft.trim() || saving) && cc.editSaveBtnDisabled]}
              onPress={handleSaveEdit}
              disabled={!draft.trim() || saving}
            >
              <Text style={cc.editSaveText}>SAVE</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <Text style={cc.text}>{comment.text}</Text>
      )}

      <View style={cc.reactionStrip}>
        {REACTIONS.map(emoji => {
          const uids = reactions[emoji] ?? [];
          const active = uids.includes(currentUid);
          return (
            <TouchableOpacity
              key={emoji}
              style={[cc.reactionBtn, active && cc.reactionBtnActive]}
              onPress={() => handleToggleReaction(emoji)}
            >
              <Text style={cc.reactionEmoji}>{emoji}</Text>
              {uids.length > 0 && <Text style={cc.reactionCount}>{uids.length}</Text>}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const cc = StyleSheet.create({
  card: { paddingHorizontal: 20, paddingTop: 16 },
  releaseLabel: { fontFamily: 'JetBrainsMono_500Medium', fontSize: 9, color: Colors.amber, letterSpacing: 1, marginBottom: 8 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  avatar: { width: 30, height: 30, backgroundColor: Colors.border, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  avatarText: { fontFamily: 'BigShouldersDisplay_900Black', fontSize: 13, color: Colors.amber },
  headerRight: { flex: 1 },
  username: { fontFamily: 'JetBrainsMono_500Medium', fontSize: 11, color: Colors.cream },
  timestamp: { fontFamily: 'JetBrainsMono_500Medium', fontSize: 9, color: Colors.mutedText, marginTop: 1 },
  ownerActions: { flexDirection: 'row', gap: 12 },
  edit: { fontFamily: 'JetBrainsMono_500Medium', fontSize: 9, color: Colors.amber, letterSpacing: 1 },
  delete: { fontFamily: 'JetBrainsMono_500Medium', fontSize: 9, color: Colors.mutedText, letterSpacing: 1 },
  text: { fontFamily: 'Inter_400Regular', fontSize: 14, color: Colors.cream, lineHeight: 21, marginBottom: 10, opacity: 0.92 },
  editBlock: { marginBottom: 10 },
  editInput: {
    borderWidth: 1, borderColor: Colors.rust, backgroundColor: Colors.cardBg,
    paddingHorizontal: 12, paddingVertical: 10, fontFamily: 'Inter_400Regular', fontSize: 14,
    color: Colors.cream, maxHeight: 120, marginBottom: 8,
  },
  editActions: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 16 },
  editCancel: { fontFamily: 'JetBrainsMono_500Medium', fontSize: 10, color: Colors.mutedText, letterSpacing: 1 },
  editSaveBtn: { backgroundColor: Colors.rust, paddingHorizontal: 14, paddingVertical: 8 },
  editSaveBtnDisabled: { backgroundColor: Colors.border },
  editSaveText: { fontFamily: 'JetBrainsMono_500Medium', fontSize: 10, color: Colors.cream, letterSpacing: 1 },
  reactionStrip: { flexDirection: 'row', gap: 6, marginBottom: 14 },
  reactionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 6,
    borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.cardBg,
  },
  reactionBtnActive: { borderColor: Colors.rust, backgroundColor: '#2a1510' },
  reactionEmoji: { fontSize: 13 },
  reactionCount: { fontFamily: 'JetBrainsMono_500Medium', fontSize: 9, color: Colors.mutedText },
});

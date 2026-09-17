import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { Colors } from '../theme/colors';
import { ReleaseComment, Release, subscribeToCommentsByUser, getRelease } from '../firebase/firestore';
import CommentCard from '../components/CommentCard';

interface Props {
  uid: string;
  username: string;
  genres: string[];
}

export default function ProfileScreen({ uid, username, genres }: Props) {
  const [reviews, setReviews] = useState<ReleaseComment[]>([]);
  const [releases, setReleases] = useState<Record<string, Release>>({});
  const [loading, setLoading] = useState(true);
  const knownReleaseIds = useRef(new Set<string>());

  useEffect(() => {
    knownReleaseIds.current = new Set();
    setReleases({});
    const unsub = subscribeToCommentsByUser(uid, comments => {
      setReviews(comments);
      setLoading(false);

      const unseenIds = [...new Set(comments.map(c => c.releaseId))]
        .filter(id => !knownReleaseIds.current.has(id));
      if (unseenIds.length === 0) return;
      unseenIds.forEach(id => knownReleaseIds.current.add(id));

      Promise.all(unseenIds.map(id => getRelease(id))).then(fetched => {
        setReleases(prev => {
          const next = { ...prev };
          fetched.forEach(r => { if (r) next[r.id] = r; });
          return next;
        });
      });
    });
    return unsub;
  }, [uid]);

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

        <Text style={[s.sectionLabel, s.reviewsLabel]}>YOUR REVIEWS</Text>
        {!loading && reviews.length === 0 ? (
          <Text style={s.empty}>You haven't left a review yet. Say something about a release in New.</Text>
        ) : (
          <View style={s.reviewsList}>
            {reviews.map(comment => {
              const release = releases[comment.releaseId];
              return (
                <CommentCard
                  key={comment.id}
                  comment={comment}
                  currentUid={uid}
                  releaseId={comment.releaseId}
                  releaseLabel={release ? `${release.artist} — ${release.title}` : undefined}
                />
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  inner: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 24 },
  sectionLabel: {
    fontFamily: 'JetBrainsMono_500Medium', fontSize: 8, color: Colors.amber,
    letterSpacing: 3, marginBottom: 20,
  },
  reviewsLabel: { marginTop: 32 },
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
  empty: { fontFamily: 'Inter_400Regular', fontSize: 13, color: Colors.mutedText, lineHeight: 19 },
  reviewsList: { marginHorizontal: -20 },
});

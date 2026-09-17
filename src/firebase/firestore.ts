import {
  collection,
  doc,
  addDoc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  arrayUnion,
  arrayRemove,
  increment,
  query,
  orderBy,
  where,
  limit,
  onSnapshot,
  collectionGroup,
} from 'firebase/firestore';
import { db, COLLECTIONS } from './config';

export interface UserProfile {
  uid: string;
  phoneNumber: string;
  username: string;
  genres: string[];
  createdAt: number;
}

export interface LinkMeta {
  title: string;
  thumbnail?: string;
  source: 'spotify' | 'bandcamp' | 'youtube' | 'soundcloud' | 'other';
  url: string;
}

export type PostTag = 'On Rotation' | 'Digging This Week' | 'Recent Discovery';

export interface Post {
  id: string;
  cornerId: string;
  uid: string;
  username: string;
  genres: string[];
  text: string;
  link: string;
  linkMeta: LinkMeta;
  tag: PostTag;
  reactions: Record<string, string[]>;
  createdAt: number;
}

export interface Corner {
  id: string;
  name: string;
  ownerUid: string;
  memberUids: string[];
  createdAt: number;
  isPublic: boolean;
  lastActivityAt: number;
}

// ─── User ────────────────────────────────────────────────────────────────────

export const saveUserProfile = async (profile: UserProfile): Promise<void> => {
  await setDoc(doc(db, COLLECTIONS.USERS, profile.uid), profile);
};

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  const snap = await getDoc(doc(db, COLLECTIONS.USERS, uid));
  return snap.exists() ? (snap.data() as UserProfile) : null;
};

export const getUserByPhone = async (phoneNumber: string): Promise<UserProfile | null> => {
  const q = query(collection(db, COLLECTIONS.USERS), where('phoneNumber', '==', phoneNumber));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return snap.docs[0].data() as UserProfile;
};

export const getUserByUsername = async (username: string): Promise<UserProfile | null> => {
  const q = query(collection(db, COLLECTIONS.USERS), where('username', '==', username));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return snap.docs[0].data() as UserProfile;
};

// ─── Corners ─────────────────────────────────────────────────────────────────

export const createCorner = async (corner: Omit<Corner, 'id'>): Promise<string> => {
  const ref = await addDoc(collection(db, COLLECTIONS.CORNERS), corner);
  return ref.id;
};

export const subscribeToUserCorners = (
  uid: string,
  onCorners: (corners: Corner[]) => void
): (() => void) => {
  const q = query(
    collection(db, COLLECTIONS.CORNERS),
    where('memberUids', 'array-contains', uid),
    orderBy('lastActivityAt', 'desc')
  );
  return onSnapshot(q, snap => {
    onCorners(snap.docs.map(d => ({ id: d.id, ...d.data() } as Corner)));
  });
};

export const addMemberToCorner = async (cornerId: string, uid: string): Promise<void> => {
  await updateDoc(doc(db, COLLECTIONS.CORNERS, cornerId), {
    memberUids: arrayUnion(uid),
  });
};

// ─── Corner Posts (subcollection) ────────────────────────────────────────────

export const createCornerPost = async (
  cornerId: string,
  post: Omit<Post, 'id'>
): Promise<string> => {
  const ref = await addDoc(
    collection(db, COLLECTIONS.CORNERS, cornerId, 'posts'),
    post
  );
  await updateDoc(doc(db, COLLECTIONS.CORNERS, cornerId), {
    lastActivityAt: Date.now(),
  });
  return ref.id;
};

export const subscribeToCornerPosts = (
  cornerId: string,
  onPosts: (posts: Post[]) => void
): (() => void) => {
  const q = query(
    collection(db, COLLECTIONS.CORNERS, cornerId, 'posts'),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, snap => {
    onPosts(snap.docs.map(d => ({ id: d.id, ...d.data() } as Post)));
  });
};

export const toggleReaction = async (
  cornerId: string,
  postId: string,
  emoji: string,
  uid: string,
  hasReacted: boolean
): Promise<void> => {
  const ref = doc(db, COLLECTIONS.CORNERS, cornerId, 'posts', postId);
  await updateDoc(ref, {
    [`reactions.${emoji}`]: hasReacted ? arrayRemove(uid) : arrayUnion(uid),
  });
};

// ─── Releases (Browse) ────────────────────────────────────────────────────────

export interface ReleaseLinks {
  spotify?: string;
  bandcamp?: string;
  appleMusic?: string;
  youtube?: string;
}

export interface EditorsTake {
  uid: string;
  username: string;
  text: string;
  isEssential?: boolean;
}

export interface Release {
  id: string;
  weekOf: string;
  artist: string;
  title: string;
  coverArtUrl: string;
  format: 'LP' | 'EP' | 'Single';
  tier: 'indie' | 'major';
  genres: string[];
  trackCount?: number;
  label?: string;
  blurb: string;
  releaseDate: number;
  links: ReleaseLinks;
  editorsTake?: EditorsTake;
  isFeatured: boolean;
  stillInRotation?: boolean;
  commentCount: number;
  createdAt: number;
  publishedBy: string;
}

// Queries the latest published batch as of `onOrBeforeDate` rather than an exact
// weekOf match, so a client-side date bug degrades to "shows last week's picks"
// instead of "shows nothing" (see commit 34606cd for the outage this replaces).
export const subscribeToLatestReleases = (
  onOrBeforeDate: string,
  onReleases: (releases: Release[]) => void
): (() => void) => {
  const q = query(
    collection(db, COLLECTIONS.RELEASES),
    where('weekOf', '<=', onOrBeforeDate),
    orderBy('weekOf', 'desc'),
    orderBy('isFeatured', 'desc'),
    limit(50)
  );
  return onSnapshot(q, snap => {
    const docs = snap.docs.map(d => ({ id: d.id, ...d.data() } as Release));
    const latestWeekOf = docs[0]?.weekOf;
    onReleases(latestWeekOf ? docs.filter(r => r.weekOf === latestWeekOf) : []);
  });
};

export const getRelease = async (releaseId: string): Promise<Release | null> => {
  const snap = await getDoc(doc(db, COLLECTIONS.RELEASES, releaseId));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Release) : null;
};

// ─── Release Comments (subcollection) ───────────────────────────────────────────

export interface ReleaseComment {
  id: string;
  releaseId: string;
  uid: string;
  username: string;
  text: string;
  createdAt: number;
  editedAt?: number;
  parentId?: string | null;
  reactions: Record<string, string[]>;
  isHidden?: boolean;
}

export const createReleaseComment = async (
  releaseId: string,
  comment: Omit<ReleaseComment, 'id'>
): Promise<string> => {
  const ref = await addDoc(
    collection(db, COLLECTIONS.RELEASES, releaseId, 'comments'),
    comment
  );
  await updateDoc(doc(db, COLLECTIONS.RELEASES, releaseId), {
    commentCount: increment(1),
  });
  return ref.id;
};

export const subscribeToReleaseComments = (
  releaseId: string,
  onComments: (comments: ReleaseComment[]) => void
): (() => void) => {
  const q = query(
    collection(db, COLLECTIONS.RELEASES, releaseId, 'comments'),
    orderBy('createdAt', 'asc')
  );
  return onSnapshot(q, snap => {
    onComments(
      snap.docs
        .map(d => ({ id: d.id, ...d.data() } as ReleaseComment))
        .filter(c => !c.isHidden)
    );
  });
};

export const updateReleaseComment = async (
  releaseId: string,
  commentId: string,
  text: string
): Promise<void> => {
  await updateDoc(doc(db, COLLECTIONS.RELEASES, releaseId, 'comments', commentId), {
    text,
    editedAt: Date.now(),
  });
};

export const subscribeToCommentsByUser = (
  uid: string,
  onComments: (comments: ReleaseComment[]) => void
): (() => void) => {
  const q = query(
    collectionGroup(db, 'comments'),
    where('uid', '==', uid),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, snap => {
    onComments(
      snap.docs
        .map(d => ({ id: d.id, ...d.data() } as ReleaseComment))
        .filter(c => !c.isHidden)
    );
  });
};

export const toggleCommentReaction = async (
  releaseId: string,
  commentId: string,
  emoji: string,
  uid: string,
  hasReacted: boolean
): Promise<void> => {
  const ref = doc(db, COLLECTIONS.RELEASES, releaseId, 'comments', commentId);
  await updateDoc(ref, {
    [`reactions.${emoji}`]: hasReacted ? arrayRemove(uid) : arrayUnion(uid),
  });
};

export const deleteReleaseComment = async (
  releaseId: string,
  commentId: string
): Promise<void> => {
  await deleteDoc(doc(db, COLLECTIONS.RELEASES, releaseId, 'comments', commentId));
  await updateDoc(doc(db, COLLECTIONS.RELEASES, releaseId), {
    commentCount: increment(-1),
  });
};

// ─── Mock data (dev only) ────────────────────────────────────────────────────

export const MOCK_UID = 'dev-uid-me';

export const MOCK_CORNERS: Corner[] = [
  {
    id: 'corner-1',
    name: 'Late Night Listening',
    ownerUid: MOCK_UID,
    memberUids: [MOCK_UID, 'uid-clara', 'uid-felix'],
    createdAt: Date.now() - 7 * 86400000,
    isPublic: false,
    lastActivityAt: Date.now() - 2 * 3600000,
  },
  {
    id: 'corner-2',
    name: 'Heavy Rotation',
    ownerUid: 'uid-felix',
    memberUids: ['uid-felix', MOCK_UID, 'uid-priya'],
    createdAt: Date.now() - 14 * 86400000,
    isPublic: false,
    lastActivityAt: Date.now() - 86400000,
  },
];

export const MOCK_POSTS: Post[] = [
  {
    id: 'seed-1',
    cornerId: 'corner-1',
    uid: 'uid-clara',
    username: 'cinder_clara',
    genres: ['shoegaze', 'psych'],
    text: "Been on a loop with this for three days. The way the guitars just dissolve into each other around the 4-minute mark — I stopped what I was doing and just stood in my kitchen.",
    link: 'https://open.spotify.com/track/example1',
    linkMeta: { title: 'Slowdive — Alison', source: 'spotify', url: 'https://open.spotify.com/track/example1' },
    tag: 'On Rotation',
    reactions: { '🔥': ['uid-felix', 'uid-marco'], '🫀': ['uid-priya'] },
    createdAt: Date.now() - 2 * 3600000,
  },
  {
    id: 'seed-2',
    cornerId: 'corner-1',
    uid: 'uid-felix',
    username: 'felix_wax',
    genres: ['doom', 'metal'],
    text: "First Church of the Electric Funeral. This riff is load-bearing. Everything else is scaffolding.",
    link: 'https://electricwizard.bandcamp.com/track/funeralopolis',
    linkMeta: { title: 'Electric Wizard — Funeralopolis', source: 'bandcamp', url: 'https://electricwizard.bandcamp.com/track/funeralopolis' },
    tag: 'On Rotation',
    reactions: { '🔥': ['uid-clara'], '🐘': ['uid-marco', 'uid-priya'] },
    createdAt: Date.now() - 5 * 3600000,
  },
  {
    id: 'seed-3',
    cornerId: 'corner-1',
    uid: 'uid-priya',
    username: 'prairie_priya',
    genres: ['alt-country', 'americana'],
    text: "Gillian Welch just makes me want to sit on a porch I've never had in a town I've never lived in.",
    link: 'https://www.youtube.com/watch?v=example3',
    linkMeta: { title: 'Gillian Welch — Everything Is Free (Live)', source: 'youtube', url: 'https://www.youtube.com/watch?v=example3' },
    tag: 'Digging This Week',
    reactions: { '🫀': ['uid-felix', 'uid-clara'] },
    createdAt: Date.now() - 9 * 3600000,
  },
];

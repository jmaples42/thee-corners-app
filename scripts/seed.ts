#!/usr/bin/env ts-node
/**
 * Seed script — populates Firestore with 8 realistic fake posts.
 *
 * USAGE:
 *   1. Fill in firebaseConfig in src/firebase/config.ts
 *   2. npm install -g ts-node (or use npx ts-node)
 *   3. npx ts-node scripts/seed.ts
 *
 * TODO: Uncomment Firestore calls below after Firebase is configured.
 */

// import * as admin from 'firebase-admin';
// import serviceAccount from '../service-account.json'; // Download from Firebase Console > Project Settings > Service Accounts
// admin.initializeApp({ credential: admin.credential.cert(serviceAccount as admin.ServiceAccount) });
// const db = admin.firestore();

const SEED_POSTS = [
  {
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
    uid: 'uid-priya',
    username: 'prairie_priya',
    genres: ['alt-country', 'americana'],
    text: "Gillian Welch just makes me want to sit on a porch I've never had in a town I've never lived in. This version especially — the room sounds like wood.",
    link: 'https://www.youtube.com/watch?v=example3',
    linkMeta: { title: 'Gillian Welch — Everything Is Free (Live)', source: 'youtube', url: 'https://www.youtube.com/watch?v=example3' },
    tag: 'Digging This Week',
    reactions: { '🫀': ['uid-felix', 'uid-clara'], '🕯️': ['uid-marco'] },
    createdAt: Date.now() - 9 * 3600000,
  },
  {
    uid: 'uid-marco',
    username: 'marco_needle',
    genres: ['punk', 'noise'],
    text: "Wire's Pink Flag is not a punk record. It's a logic problem. 21 tracks in 35 minutes because everything that isn't the song gets cut.",
    link: 'https://open.spotify.com/album/example4',
    linkMeta: { title: 'Wire — Reuters', source: 'spotify', url: 'https://open.spotify.com/album/example4' },
    tag: 'Recent Discovery',
    reactions: { '🔥': ['uid-priya'], '🧠': ['uid-felix', 'uid-clara'] },
    createdAt: Date.now() - 14 * 3600000,
  },
  {
    uid: 'uid-clara',
    username: 'cinder_clara',
    genres: ['shoegaze', 'psych'],
    text: "Dug this out after years. Mazzy Star at the peak of their haziness. Drive this at night, windows down, don't think.",
    link: 'https://open.spotify.com/track/example5',
    linkMeta: { title: 'Mazzy Star — Fade Into You', source: 'spotify', url: 'https://open.spotify.com/track/example5' },
    tag: 'Digging This Week',
    reactions: { '🌙': ['uid-felix', 'uid-marco', 'uid-priya'] },
    createdAt: Date.now() - 22 * 3600000,
  },
  {
    uid: 'uid-felix',
    username: 'felix_wax',
    genres: ['doom', 'metal'],
    text: "Sleep's Dopesmoker is not an album. It's a 63-minute riff. A single riff with variations. And somehow that's more compelling than most full discographies.",
    link: 'https://sleep.bandcamp.com/album/dopesmoker',
    linkMeta: { title: 'Sleep — Dopesmoker', source: 'bandcamp', url: 'https://sleep.bandcamp.com/album/dopesmoker' },
    tag: 'On Rotation',
    reactions: { '🐘': ['uid-clara', 'uid-priya'], '🔥': ['uid-marco'] },
    createdAt: Date.now() - 30 * 3600000,
  },
  {
    uid: 'uid-priya',
    username: 'prairie_priya',
    genres: ['alt-country', 'americana'],
    text: "Emmylou Harris covering Townes Van Zandt. Two of the most honest voices in American music, one meeting point.",
    link: 'https://www.youtube.com/watch?v=example7',
    linkMeta: { title: 'Emmylou Harris — Pancho and Lefty', source: 'youtube', url: 'https://www.youtube.com/watch?v=example7' },
    tag: 'Recent Discovery',
    reactions: { '🫀': ['uid-clara', 'uid-felix'] },
    createdAt: Date.now() - 48 * 3600000,
  },
  {
    uid: 'uid-marco',
    username: 'marco_needle',
    genres: ['punk', 'noise'],
    text: "Shellac live in a 200-person room is a religious experience. Bob Weston's bass is structural. This record is the closest document.",
    link: 'https://shellac.bandcamp.com/album/at-action-park',
    linkMeta: { title: 'Shellac — Prayer to God', source: 'bandcamp', url: 'https://shellac.bandcamp.com/album/at-action-park' },
    tag: 'Digging This Week',
    reactions: { '🧠': ['uid-priya'], '🔥': ['uid-clara', 'uid-felix'] },
    createdAt: Date.now() - 72 * 3600000,
  },
];

async function seed() {
  console.log('Seeding', SEED_POSTS.length, 'posts...\n');
  for (const post of SEED_POSTS) {
    // TODO: await db.collection('posts').add(post);
    console.log(`[DRY RUN] Would create post by @${post.username}: "${post.linkMeta.title}"`);
  }
  console.log('\nDone. Uncomment Firestore calls and run again with Firebase configured.');
}

seed().catch(console.error);

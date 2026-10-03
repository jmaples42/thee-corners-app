#!/usr/bin/env ts-node
/**
 * Publishes a week's curated release picks into Firestore.
 *
 * USAGE:
 *   1. Download a service account key from Firebase Console →
 *      Project Settings → Service Accounts → Generate new private key.
 *      Save it as service-account.json in the repo root (gitignored).
 *   2. Edit scripts/data/releases-<date>.ts with that week's picks.
 *   3. Point scripts/data/current.ts at it (also drives the QA preview).
 *   4. npm run publish-releases
 *
 * Safe to re-run mid-week — releases are keyed by slug(artist, title) and
 * written with merge:true, so editing a blurb or adding a review link is
 * just an idempotent re-run, not a duplicate.
 */

import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';
import { WEEK_RELEASES } from './data/current';

const serviceAccount = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../service-account.json'), 'utf8')
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
});
const db = admin.firestore();

function slugify(artist: string, title: string): string {
  return `${artist}-${title}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function publish() {
  console.log(`Publishing ${WEEK_RELEASES.length} releases...\n`);
  for (const release of WEEK_RELEASES) {
    const id = slugify(release.artist, release.title);
    await db.collection('releases').doc(id).set(
      {
        ...release,
        commentCount: release.commentCount ?? 0,
        createdAt: release.createdAt ?? Date.now(),
        publishedBy: 'editorial',
      },
      { merge: true }
    );
    console.log(`✓ ${release.artist} — ${release.title} (${id})`);
  }
  // Record the issue so the app can list past weeks (Best-of docs also carry a
  // weekOf, so the app can't derive the issue list from releases alone).
  const weekOf = WEEK_RELEASES[0]?.weekOf;
  if (weekOf) {
    const ref = db.collection('issues').doc(weekOf);
    const exists = (await ref.get()).exists;
    await ref.set(
      exists
        ? { weekOf, releaseCount: WEEK_RELEASES.length }
        : { weekOf, releaseCount: WEEK_RELEASES.length, publishedAt: Date.now() },
      { merge: true }
    );
    console.log(`✓ issue ${weekOf} (${WEEK_RELEASES.length} releases)`);
  }
  console.log('\nDone.');
}

publish().catch(console.error);

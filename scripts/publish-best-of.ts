#!/usr/bin/env ts-node
/**
 * Publishes a "Best of" list into the Firestore `releases` collection.
 *
 * USAGE: npm run publish-best-of   (needs service-account.json at the repo root)
 *
 * Edit scripts/data/best-of-<year>.ts, point the import below at it, re-run.
 * Docs are keyed by slug(artist, title) like the weekly publish. Unlike a naive
 * merge write, commentCount/createdAt/publishedBy are only set when the doc is
 * first created, so a re-run never resets an existing comment count.
 */

import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';
import { BEST_OF_2026 } from './data/best-of-2026';

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
  console.log(`Publishing ${BEST_OF_2026.length} best-of releases...\n`);
  for (const release of BEST_OF_2026) {
    const id = slugify(release.artist, release.title);
    const ref = db.collection('releases').doc(id);
    const exists = (await ref.get()).exists;
    await ref.set(
      exists
        ? { ...release }
        : { ...release, commentCount: 0, createdAt: Date.now(), publishedBy: 'editorial' },
      { merge: true }
    );
    console.log(`✓ #${release.bestOf?.rank} ${release.artist} — ${release.title} (${id})${exists ? ' [updated]' : ''}`);
  }
  console.log('\nDone.');
}

publish().catch(console.error);

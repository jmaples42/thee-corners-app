# Handoff — resuming on a new machine (Tahoe Mac)

Context for a fresh Claude Code session. The previous session ran into a macOS 27 beta ("Golden Gate") / Xcode 26.6 version mismatch on the original MacBook Air that made the iOS Simulator unusable (cryptex runtime wouldn't mount, simulator booted but never became interactive). Rather than downgrade that Mac, work moved here, to a Mac already on stable Tahoe.

## Repos

- **This app** (Expo/React Native + Firebase): `git@github.com:jmaples42/thee-corners-app.git` — clone this.
- **Public marketing site** (static HTML, deploys to corners.thefanlab.com): `git@github.com:jmaples42/corners.git` — separate repo, clone separately if needed.

## What Corners is

Two-pillar music app: **Share** (private group music sharing in "Corners") + **Browse** (curated weekly new-release picks with critical context). Full product brief was in the prior session's memory — ask the user or reconstruct from `README.md` / `Corners Vision Doc.pdf` at the repo root if deeper context is needed.

## What's been built this pass (3 commits: `9369243` → `1c5190d`)

1. **Real accounts + live Corners data.** Phone-number auth (`src/firebase/auth.ts`) now actually establishes a Firebase Auth session via `signInWithCredential` (it previously only stored a uid locally — `request.auth` was always null). `CornerDetailScreen.tsx` now subscribes to live Firestore data instead of mock posts, and reactions write for real.
2. **Native Browse + live comments** (`BrowseScreen.tsx`, new `ReleaseDetailScreen.tsx`). Browse used to just open `corners.thefanlab.com` in a browser — it's now a real Firestore-backed screen. Release detail has a live comment thread with reactions and self-serve delete, using the same phone-verified accounts.
3. **`firestore.rules`** written (users/corners/posts + releases/comments) but **not yet deployed** — no Firebase CLI was available in the old environment. Needs `npm install -g firebase-tools`, `firebase login`, then `firebase deploy --only firestore:rules` from the repo root (`.firebaserc`/`firebase.json` already point at the `thee-corners` project).
4. **`scripts/publish-releases.ts`** replaces the old inert `seed.ts` stub — a real weekly publish script. Needs a `service-account.json` (gitignored, download from Firebase Console → Project Settings → Service Accounts) dropped in the repo root before it can run. A sample week's data already exists at `scripts/data/releases-2026-09-11.ts`.
5. **`MODERATION.md`** — minimal v1 moderation notes.

Full implementation plan (all phases, schema, rationale) is at the end of this file, copied from the planning doc.

---

# Live comments & accounts: unify into the Expo/Firebase app

## Context

The ask started as "make the listener comment field on the weekly-issue website live." Investigation found two separate codebases: the static HTML site (`OUTPUTS/the-corners-mock/`, deployed to corners.thefanlab.com) which has zero backend, and a **real, already-invested Expo/React Native app** at the repo root (`/Users/jonmaples/TheeCorners`) with EAS builds configured, working Firebase phone-number auth, and a Firestore schema for Corners/posts — but with two live gaps: `CornerDetailScreen` still renders mock data (the real `subscribeToCornerPosts` call is written but commented out, reactions are local-only), and `BrowseScreen` isn't native at all — it just opens the static website in a browser.

Decision made with the user: keep Firebase (reject introducing Supabase) and keep Expo/React Native (reject native rewrite or Flutter) as the single stack. Comments and accounts become an **app feature**, not a website feature. The public website's role shrinks to a read-only, action-oriented teaser that drives app installs — including features and content ("easter eggs," possibly exclusive numbered picks) that are visibly present but only unlock inside the app. Exact shape of those app-exclusive hooks is intentionally left open for a follow-up design pass (see Phase 4) rather than specified now.

## Phase 1 — Fix what's already broken (ship first, smallest diff)

- [CornerDetailScreen.tsx](../../TheeCorners/src/screens/CornerDetailScreen.tsx): replace the `MOCK_POSTS` seed + commented-out `useEffect` (lines ~106–114) with a real `subscribeToCornerPosts(corner.id, setPosts)` call (already imported, just unused). Change `PostCard`'s reaction handling to render `post.reactions` directly instead of local-only `useState`, and call the real `toggleReaction(cornerId, postId, emoji, uid, hasReacted)` export on tap — the live snapshot echoes the corrected state back within ~100–300ms, no separate optimistic-state bookkeeping needed. `PostCard` needs `cornerId` added as a prop.
- [FeedScreen.tsx](../../TheeCorners/src/screens/FeedScreen.tsx) has the identical bug (mock data + local-only reactions) — fix in the same pass so Feed and Corner-detail behave consistently.
- Write `firestore.rules` (new file, repo root) covering the *existing* `users`/`corners`/`posts` collections: users can read any profile but only write their own; corner reads/writes require `request.auth.uid` in `memberUids`; posts inherit the parent corner's membership check; reaction-only updates allowed via a `diff().affectedKeys().hasOnly(['reactions'])` clause. **Before deploying these rules, verify in [auth.ts](../../TheeCorners/src/firebase/auth.ts) that `confirmVerificationCode` actually establishes a real Firebase Auth session** (e.g. exchanges the Identity Toolkit response for a client SDK sign-in) rather than just returning a local `{uid, phoneNumber}` — if `request.auth` is never populated, every rule above rejects all writes. This is the first thing to check before writing more code.

## Phase 2 — `releases` schema + native Browse (read-only)

Add to [firestore.ts](../../TheeCorners/src/firebase/firestore.ts), following the exact same shape as the existing `Corner`/`Post` types and their subscribe/create functions:

```ts
interface Release {
  id: string; weekOf: string; artist: string; title: string; coverArtUrl: string;
  format: 'LP'|'EP'|'Single'; tier: 'indie'|'major'; genres: string[];
  trackCount?: number; label?: string; blurb: string; releaseDate: number;
  links: { spotify?: string; bandcamp?: string; appleMusic?: string; youtube?: string };
  editorsTake?: { uid: string; username: string; text: string; isEssential?: boolean };
  isFeatured: boolean; commentCount: number; createdAt: number; publishedBy: string;
}
```
Doc ID = slug(`artist-title`), not auto-ID, so re-publishing mid-week (add a review link, fix a typo) is an idempotent `setDoc({merge:true})`. `subscribeToWeeklyReleases(weekOf, cb)` queries `where('weekOf','==',weekOf)`; `getRelease(id)` mirrors `getUserProfile`.

- Rewrite [BrowseScreen.tsx](../../TheeCorners/src/screens/BrowseScreen.tsx): drop the `Linking.openURL` stub, render a `FlatList` of release cards (cover art, artist/title, format/tier/genre badges, comment-count affordance) subscribed live.
- New file `src/screens/ReleaseDetailScreen.tsx` mirroring `CornerDetailScreen`'s structure: cover art, tags, source links, and (in this phase) no comment thread yet — ships as its own demoable milestone ("Browse is native and live").
- Wire into [AppNavigator.tsx](../../TheeCorners/src/navigation/AppNavigator.tsx) the same way `CornersListScreen`/`CornerDetailScreen` are wired — a local `browseView: 'list'|'detail'` + `selectedRelease` state, not a react-navigation stack (the app doesn't actually use the stack dependency despite it being installed; stay consistent with the existing hand-rolled pattern).
- Publishing bridge: repurpose the currently-inert `scripts/seed.ts` stub into `scripts/publish-releases.ts` using `firebase-admin` + a gitignored service-account key. Each week, define that week's releases as a typed array in `scripts/data/releases-<date>.ts` — this replaces hand-editing `<article class="release">` HTML blocks with editing a TypeScript array — then run `npx ts-node scripts/publish-releases.ts` once. No admin UI, no cron; matches the existing solo-editorial workflow.

## Phase 3 — Live comments (the actual point)

- Add `ReleaseComment` type + `createReleaseComment` / `subscribeToReleaseComments` / `toggleCommentReaction` / `deleteReleaseComment` to `firestore.ts`, as a `releases/{id}/comments` subcollection (mirrors `corners/{id}/posts` exactly — same `orderBy('createdAt')`, same `reactions` field shape, so it can reuse a shared `ReactionStrip`/`timeAgo` if those get extracted — see note below).
- Extend `ReleaseDetailScreen.tsx` with the comment thread (`CommentCard` list) + an inline bottom composer (`TextInput` + send button, not a full-screen modal like `ComposerScreen` — comments are single-field and short). If `editorsTake` is set on the release, render it pinned above the thread with the "★ this week's essential" badge — the native equivalent of the static site's hand-authored `.corners-post` block, but now just real comment data instead of special-cased markup.
- Extend `firestore.rules` with a `releases`/`comments` block: public read on releases+comments (unauthenticated — this is the marketing-facing content), write only via the admin SDK for releases, and signed-in-only comment creation with a text-length check (`<= 500` chars) and `uid == request.auth.uid`.
- Moderation (deliberately minimal): `isHidden?: boolean` field, filtered client-side before rendering; self-serve delete of your own comment; anything else moderated by flipping `isHidden` directly in the Firebase console — no reporting queue, no admin UI, note this in a one-paragraph `MODERATION.md`.
- Worth doing alongside this (not blocking): extract `REACTIONS`, `timeAgo()`, and a generic reaction-strip component out of the three now-near-identical copies in `FeedScreen`/`CornerDetailScreen`/new `ReleaseDetailScreen` into `src/utils/format.ts` / `src/components/shared.tsx`.

## Phase 4 — Public website redesign (follow-up, design pass needed before building)

Confirmed direction: the public site stops being a full read-only mirror and becomes an **action-oriented funnel** — visibly show what's happening (releases, editor's takes, live comment counts) but gate the actual verbs (leave a comment, save a release, and possibly access specific numbered/exclusive picks) behind "open in app" prompts, as a deliberate incentive to install rather than a limitation to hide. Concretely still open and worth a short dedicated design conversation before implementation:
- What exactly is app-exclusive (comment + save confirmed; "specific numbers" mentioned but undefined — e.g. numbered/limited picks, unlock codes, a running tally only visible in-app?).
- How the gate itself feels (tapping "Save" on web opens an app-install deep link vs. a teaser modal vs. an SMS-the-app-link flow).
- Whether the site reads Firestore directly (client-side Firebase JS SDK, still static hosting) or through a small serverless read endpoint.
This phase is explicitly not being designed in detail yet — flagged here so Phase 1–3 schema choices (e.g. `commentCount` being denormalized onto the `Release` doc) already support showing live counts on web without exposing write access.

## Verification

- Phase 1: run the Expo app (`expo start`), open a Corner with existing posts from two devices/sessions, confirm a reaction tap on one shows up live on the other; confirm `firestore.rules` deploy (`firebase deploy --only firestore:rules`) doesn't break existing reads/writes.
- Phase 2: confirm `publish-releases.ts` run populates Firestore, Browse tab shows live data (not the old external-browser button), tapping a release opens detail with real links.
- Phase 3: post a comment as one test account, confirm it appears live in a second session; confirm an unauthenticated write attempt is rejected by rules; confirm deleting your own comment decrements `commentCount`.

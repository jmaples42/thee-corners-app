# Handoff — getting a machine building (MacBook Air, returning from Xcode incompatibility)

Context for a fresh Claude Code session on the Air. The Air was previously set aside because its Xcode/OS combo made the iOS Simulator unusable (cryptex runtime wouldn't mount). The user has since adjusted the Xcode version on this machine and wants to resume building here. This doc replaces an older, stale version of itself that described work as a future plan — everything below is already built and live in production.

## Repo

`git@github.com:jmaples42/thee-corners-app.git` — clone or pull to latest `main`.

## What Corners is

Two-pillar Expo/React Native + Firebase app: **Share** (private group music sharing in "Corners") and **Browse** (curated weekly new-release picks with editorial commentary and user reviews).

## Current state (everything below is shipped, not planned)

- **Phone auth**: real Firebase `signInWithPhoneNumber`, session persisted via AsyncStorage until explicit sign-out. Real SMS delivery is confirmed working on real devices (Blaze billing + open US/CA region policy + Firebase App Check with App Attest, enforced). OTP entry auto-fills from the iOS "Code from Messages" QuickType suggestion (`textContentType="oneTimeCode"` on a single hidden input overlaying the 6 visual boxes — see `src/screens/AuthScreen.tsx`).
- **App Check**: dual-instance bridge — `@react-native-firebase/app-check` does the real App Attest handshake (native-only capability), and a `CustomProvider` in `src/firebase/appCheck.ts` forwards that token into the plain JS SDK's App Check instance, which is what `firebase/auth`'s `signInWithPhoneNumber` actually reads from. **App Attest never works in the iOS Simulator** — phone auth (real numbers and Firebase test numbers alike, once App Check enforcement is on) will fail there; test on a real device, or use a Firebase test phone number (Firebase Console → Authentication → Sign-in method → Phone → "Phone numbers for testing") knowing it'll still hit the same App Check wall in Simulator specifically.
- **Design system**: colors/fonts sourced from the live marketing site (corners-blush.vercel.app), applied via `src/theme/colors.ts` (values updated, old key names kept intentionally to avoid a large call-site rename — see task `task_3c591d43` if still open).
- **Navigation**: floating 4-tab pill bar (Home / New / Me / Settings) in `src/navigation/AppNavigator.tsx`, hand-rolled (no react-navigation stack in use despite the dependency being present).
- **Browse**: full real content synced from the marketing site — masthead, all real releases with editorial copy, "Still in Rotation," "Still Trending — Best of 2026," and a full methodology page (`src/screens/MethodologyScreen.tsx`).
- **Reviews**: free-text comments on releases with emoji reactions (`🔥🫀🌙🐘`) — **no star ratings, and none planned** (explicit product decision: reputation is earned through what you write, not a score). Users can edit their own comment (silent overwrite, marked "· edited," no history kept) from both the release page and a "Your Reviews" section on the Me tab — both are live Firestore subscriptions (`subscribeToReleaseComments`, `subscribeToCommentsByUser` in `src/firebase/firestore.ts`), so an edit made in either place reflects instantly in both.
- **Firestore rules + indexes**: deployed and current (`firestore.rules`, `firestore.indexes.json`). Comment edits are restricted server-side to the comment's own author and only the `text`/`editedAt` fields.

## Toolchain setup on a new/returning Mac

1. **Xcode**: already handled per the user on this pass — confirm `xcodebuild -version` matches what the installed Simulator runtimes support.
2. **Node**: use `nvm` (not a system/Homebrew Node). If `nvm` isn't installed: `curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash`, then `nvm install --lts` and `nvm use --lts`.
3. **CocoaPods**: try `gem install cocoapods` on system Ruby first. If that fails (old system Ruby, e.g. 2.6) **and** Homebrew won't install either (Homebrew 7.0.0+ dropped Intel support — check with `brew --version` / `arch`), the fallback that worked on the other Intel Mac this session was:
   - Install `rbenv` + `ruby-build` (via a manual git clone into `~/.rbenv` if Homebrew is unavailable, per rbenv's own README).
   - Build a modern Ruby from source: `rbenv install 3.3.6` (may need `libyaml` built manually first for the `psych` extension — see rbenv/ruby-build troubleshooting if this errors).
   - `rbenv global 3.3.6`, then `gem install cocoapods` on that Ruby.
   - Skip all of this entirely if the Air is Apple Silicon — Homebrew works fine there, just `brew install cocoapods` (or `brew install rbenv ruby-build` if you still prefer rbenv).
4. **EAS CLI**: `npm install -g eas-cli` (or `npx eas-cli`), then `eas login` (existing account/project credentials are stored server-side on Expo's servers — no local credential files needed for building or submitting).
5. **Firebase CLI** (only needed if deploying rules/indexes or running the publish script from this machine): `npm install -g firebase-tools`, then `firebase login`.
6. **`GoogleService-Info.plist`**: already committed to the repo (contains only a public client API key, no secrets) — nothing to manually place.
7. **`service-account.json`**: gitignored, NOT in the repo. Only needed to run `scripts/publish-releases.ts` locally. Download fresh from Firebase Console → Project Settings → Service Accounts → Generate new private key, drop it at the repo root. Never commit it.
8. **Install deps**: `npm install`, then `cd ios && pod install` (or just let `npx expo run:ios` do it).

## Building

- **Local Simulator/device run**: `npx expo run:ios` (add `--device "iPhone 17 Pro"` or similar to target a specific Simulator). Remember: phone auth won't complete in Simulator once App Check enforcement is on — real-device only for that flow.
- **TestFlight build**: `npx eas-cli build --platform ios --profile production --non-interactive --auto-submit` (profile + `ascAppId` already configured in `eas.json`).

## Known gotchas from this session, so they're not re-debugged from scratch

- If `npx tsc --noEmit` shows `error TS2305: Module '"firebase/auth"' has no exported member 'getReactNativePersistence'` — this is a known, harmless false-positive (plain `tsc` resolves the web build of `firebase/auth`, not the React-Native-specific export Metro picks correctly at runtime). Ignore it.
- If real SMS silently doesn't arrive (request accepted, no error, no text): check, in order — Blaze billing is active on the **Firebase Console** billing indicator specifically (bottom-left of any Firebase Console page), not just linked in Google Cloud Console; SMS region policy (Authentication → Settings → SMS region policy) includes the destination country; the number isn't sitting in Authentication → Sign-in method → Phone → "Phone numbers for testing" (a stale test-number entry silently short-circuits real SMS forever for that number). If all of that checks out and it's still silent, it may be a per-number anti-abuse flag on Google's side — Firebase Support is the only way to get visibility into that, since Google deliberately doesn't expose delivery-block reasons in any console.

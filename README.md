# Thee Corners

A music fan social platform. Warm, earthy, analog. Built for TestFlight.

## Stack

- Expo SDK (TypeScript)
- Firebase (Phone Auth + Firestore)
- React Navigation
- Expo AV (audio preview stubs)

## Local Development

```bash
cd TheeCorners
npx expo start
# Press 'i' for iOS simulator, scan QR for device
```

## Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com) and create a project named `thee-corners`
2. **iOS App:** Add an iOS app with Bundle ID `com.theecorners.app`
   - Download `GoogleService-Info.plist` → place in `ios/` directory
3. **Phone Auth:** Console → Authentication → Sign-in methods → enable Phone
4. **Firestore:** Console → Firestore Database → Create database (test mode)
5. **Config:** Copy SDK config from Console → Project Settings → Your apps → SDK setup
   - Paste into `src/firebase/config.ts` replacing each `YOUR_*` placeholder

### Firestore Collections

| Collection | Document ID | Fields |
|---|---|---|
| `users` | `{uid}` | uid, phoneNumber, username, genres, createdAt |
| `posts` | `{postId}` | uid, username, genres, text, link, linkMeta, tag, reactions, createdAt |

### Seed Data

After Firebase is configured, run the seed script to populate 8 posts:

```bash
npx ts-node scripts/seed.ts
```

Uncomment the Firestore lines in `scripts/seed.ts` first.

## EAS Build (TestFlight)

```bash
# Install EAS CLI
npm install -g eas-cli

# Log in to Expo account
eas login

# Configure project (first time)
eas build:configure

# Build for iOS (TestFlight)
eas build --platform ios --profile preview

# Submit to TestFlight
eas submit --platform ios
```

### eas.json (preview profile)

The `eas build:configure` command creates this. For TestFlight use the `preview` profile which creates an `.ipa` with internal distribution.

## Project Structure

```
TheeCorners/
├── App.tsx                    # Root: font loading + navigator
├── src/
│   ├── firebase/
│   │   ├── config.ts          # ← Fill in after Firebase setup
│   │   ├── auth.ts            # Phone auth stubs (TODO: uncomment real calls)
│   │   └── firestore.ts       # Firestore stubs + mock seed data
│   ├── navigation/
│   │   └── AppNavigator.tsx   # Stage machine: auth → genre-picker → app
│   ├── screens/
│   │   ├── AuthScreen.tsx     # Phone + OTP flow
│   │   ├── GenrePickerScreen.tsx  # Onboarding genre selection
│   │   ├── FeedScreen.tsx     # On Rotation / Digging / Discovered tabs
│   │   ├── ComposerScreen.tsx # Paste link + write note + tag
│   │   └── DiaryScreen.tsx    # Profile + own posts + share
│   └── theme/
│       ├── colors.ts
│       └── typography.ts
└── scripts/
    └── seed.ts                # Firestore seed script
```

## TODO Before TestFlight

- [ ] Fill in `src/firebase/config.ts` with real Firebase values
- [ ] Place `GoogleService-Info.plist` in `ios/`
- [ ] Uncomment real Firebase calls in `auth.ts` and `firestore.ts`
- [ ] Let users set a real username on signup
- [ ] Implement real oEmbed fetching in `ComposerScreen.tsx`
- [ ] Run `npx expo prebuild` before EAS build

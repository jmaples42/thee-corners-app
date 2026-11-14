// YouTube Data API v3 key for the composer's "Search YouTube". Read from the environment so it
// never lands in git: put EXPO_PUBLIC_YOUTUBE_API_KEY in .env.local for local runs and in the
// EAS "production" environment for builds and OTA updates. Restrict the key in Google Cloud
// (API restriction: YouTube Data API v3; application restriction: iOS bundle ID) because
// EXPO_PUBLIC_ values are bundled into the app. With no key the search box is simply hidden and
// pasting a link still works.
export const YOUTUBE_API_KEY = process.env.EXPO_PUBLIC_YOUTUBE_API_KEY ?? '';
export const IOS_BUNDLE_ID = 'com.theecorners.app';

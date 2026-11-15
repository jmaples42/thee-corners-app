import { LinkMeta } from '../firebase/firestore';
import { decodeEntities } from './youtube';

export interface FetchedMeta {
  title: string;
  thumbnail?: string;
}

// What a pasted link is called, so a post says "FMB: Cosmic Desert Jams (Vol. I)" instead of the
// last path segment of the URL. All three sources are keyless: Spotify and SoundCloud publish
// oEmbed endpoints; Bandcamp has none, so its page's Open Graph tags are read instead.
// (YouTube is handled in utils/youtube.ts.)
const cache = new Map<string, Promise<FetchedMeta | null>>();

async function getJson(url: string): Promise<any | null> {
  try {
    const res = await fetch(url);
    return res.ok ? await res.json() : null;
  } catch {
    return null;
  }
}

function ogTag(html: string, prop: string): string | undefined {
  const re = new RegExp(`<meta[^>]+property=["']og:${prop}["'][^>]*content=["']([^"']*)["']`, 'i');
  const alt = new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]*property=["']og:${prop}["']`, 'i');
  const m = html.match(re) ?? html.match(alt);
  return m ? decodeEntities(m[1]) : undefined;
}

async function load(url: string, source: LinkMeta['source']): Promise<FetchedMeta | null> {
  if (source === 'spotify') {
    const d = await getJson(`https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`);
    return d?.title ? { title: String(d.title), thumbnail: d.thumbnail_url || undefined } : null;
  }
  if (source === 'soundcloud') {
    const d = await getJson(`https://soundcloud.com/oembed?format=json&url=${encodeURIComponent(url)}`);
    return d?.title ? { title: String(d.title), thumbnail: d.thumbnail_url || undefined } : null;
  }
  if (source === 'bandcamp') {
    try {
      const res = await fetch(url);
      if (!res.ok) return null;
      const html = await res.text();
      const title = ogTag(html, 'title');
      return title ? { title, thumbnail: ogTag(html, 'image') } : null;
    } catch {
      return null;
    }
  }
  return null;
}

export function fetchLinkMeta(url: string, source: LinkMeta['source']): Promise<FetchedMeta | null> {
  let hit = cache.get(url);
  if (!hit) {
    hit = load(url, source);
    cache.set(url, hit);
    // A failed lookup shouldn't stick for the rest of the session.
    hit.then(r => { if (!r) cache.delete(url); });
  }
  return hit;
}

// Posts made before this existed carry a URL-derived title and no art.
export function needsLinkMeta(meta: LinkMeta): boolean {
  return (meta.source === 'spotify' || meta.source === 'soundcloud' || meta.source === 'bandcamp') && !meta.thumbnail;
}

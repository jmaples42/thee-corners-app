import { YOUTUBE_API_KEY, IOS_BUNDLE_ID } from '../config/youtube';

export interface YouTubeResult {
  videoId: string;
  title: string;
  channel: string;
  thumbnail: string;
  url: string;
}

const ID = /^[A-Za-z0-9_-]{11}$/;

// Video id from watch, youtu.be, shorts, embed, live and music.youtube.com links.
export function parseYouTubeId(url: string): string | null {
  let u: URL;
  try {
    u = new URL(url.trim());
  } catch {
    return null;
  }
  const host = u.hostname.replace(/^(www|m|music)\./, '');
  let id: string | null = null;
  if (host === 'youtu.be') {
    id = u.pathname.split('/')[1] ?? null;
  } else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    const [, kind, rest] = u.pathname.split('/');
    if (kind === 'watch') id = u.searchParams.get('v');
    else if (kind === 'shorts' || kind === 'embed' || kind === 'live' || kind === 'v') id = rest ?? null;
  }
  return id && ID.test(id) ? id : null;
}

// hqdefault always exists (mqdefault/maxres don't for every video) and needs no API call.
export function youtubeThumbnail(videoId: string): string {
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}

export function youtubeWatchUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

// The API returns titles HTML-escaped ("Don&#39;t Stop", "AT&amp;T").
export function decodeEntities(s: string): string {
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

export class YouTubeSearchError extends Error {
  constructor(public kind: 'quota' | 'network' | 'other') {
    super(kind);
  }
}

// Embeddable videos only: a result you can't play in the chat would be a dead tile.
// Each search costs 100 of the key's 10,000 free daily quota units.
export async function searchYouTube(query: string, signal?: AbortSignal): Promise<YouTubeResult[]> {
  const q = query.trim();
  if (!q || !YOUTUBE_API_KEY) return [];
  const params = new URLSearchParams({
    part: 'snippet',
    type: 'video',
    videoEmbeddable: 'true',
    safeSearch: 'moderate',
    maxResults: '10',
    q,
    key: YOUTUBE_API_KEY,
  });
  let res: Response;
  try {
    res = await fetch(`https://www.googleapis.com/youtube/v3/search?${params}`, {
      signal,
      // Lets a key restricted to our iOS app through.
      headers: { 'X-Ios-Bundle-Identifier': IOS_BUNDLE_ID },
    });
  } catch (e) {
    if ((e as Error).name === 'AbortError') throw e;
    throw new YouTubeSearchError('network');
  }
  if (!res.ok) {
    throw new YouTubeSearchError(res.status === 403 || res.status === 429 ? 'quota' : 'other');
  }
  const data = await res.json();
  return (data.items ?? [])
    .filter((it: any) => it?.id?.videoId)
    .map((it: any): YouTubeResult => ({
      videoId: it.id.videoId,
      title: decodeEntities(it.snippet?.title ?? ''),
      channel: decodeEntities(it.snippet?.channelTitle ?? ''),
      thumbnail: it.snippet?.thumbnails?.medium?.url ?? youtubeThumbnail(it.id.videoId),
      url: youtubeWatchUrl(it.id.videoId),
    }));
}

// Title and channel for a pasted link. oEmbed needs no API key and no quota.
export async function fetchYouTubeOEmbed(videoId: string): Promise<{ title: string; channel: string } | null> {
  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(youtubeWatchUrl(videoId))}`,
    );
    if (!res.ok) return null;
    const d = await res.json();
    return { title: String(d.title ?? ''), channel: String(d.author_name ?? '') };
  } catch {
    return null;
  }
}

/*
 * "From the municipality's platforms": latest posts from sources that are public and reliable.
 *
 *  ✓ YouTube channel RSS            — public Atom feed, no key
 *  ✓ Municipality website RSS       — edm.gov.om WordPress feed
 *  ✓ Instagram (optional)           — only with INSTAGRAM_ACCESS_TOKEN (Instagram Graph API, business account)
 *  ✗ X / Twitter                    — timelines need the paid X API; the public endpoint is rate-limited
 *  ✗ Facebook posts as data         — need a Page access token; the page is shown with Facebook's own embed instead
 *
 * Server side only; cached for 30 minutes.
 */

export interface FeedItem {
  id: string;
  source: 'youtube' | 'website' | 'instagram';
  title: string;
  url: string;
  date: string;
  image?: string;
  /** YouTube video id, for playing in place */
  videoId?: string;
  category?: string;
}

export const YOUTUBE_CHANNEL_ID = 'UCp8waHfGiU5cPKU85INEnwg';
const YT_FEED = `https://www.youtube.com/feeds/videos.xml?channel_id=${YOUTUBE_CHANNEL_ID}`;
const SITE_FEED = 'https://edm.gov.om/?feed=rss2';
const TTL_MS = 30 * 60 * 1000;
/** After a failed source, try again this soon instead of waiting the full TTL */
const RETRY_MS = 2 * 60 * 1000;

const decode = (s: string) => s
  .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
  .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
  .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)))
  .replace(/&quot;/g, '"').replace(/&apos;|&#039;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
  .trim();
const tag = (xml: string, name: string) => { const m = new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`).exec(xml); return m ? decode(m[1]) : ''; };

async function text(url: string) {
  const res = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(20_000), headers: { 'User-Agent': 'DhofarPortal/1.0 (+feed reader)' } });
  if (!res.ok) throw new Error(`${url} → HTTP ${res.status}`);
  return res.text();
}

async function youtube(): Promise<FeedItem[]> {
  const xml = await text(YT_FEED);
  return xml.split('<entry>').slice(1).map(e => {
    const videoId = tag(e, 'yt:videoId');
    return { id: `yt_${videoId}`, source: 'youtube' as const, title: tag(e, 'title'), url: `https://www.youtube.com/watch?v=${videoId}`, date: tag(e, 'published'), image: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`, videoId };
  }).filter(i => i.videoId);
}

async function website(): Promise<FeedItem[]> {
  const xml = await text(SITE_FEED);
  return xml.split('<item>').slice(1).map(i => {
    const link = tag(i, 'link');
    const body = tag(i, 'content:encoded') || tag(i, 'description');
    const image = /<img[^>]+src="([^"]+)"/.exec(body)?.[1];
    return { id: `web_${link}`, source: 'website' as const, title: tag(i, 'title'), url: link, date: new Date(tag(i, 'pubDate')).toISOString(), image, category: tag(i, 'category') || undefined };
  }).filter(i => i.title && i.url);
}

async function instagram(): Promise<FeedItem[]> {
  const token = process.env.INSTAGRAM_ACCESS_TOKEN;
  if (!token) return [];
  const url = `https://graph.instagram.com/me/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp&limit=12&access_token=${encodeURIComponent(token)}`;
  const data = JSON.parse(await text(url));
  return (data.data || []).map((m: Record<string, string>) => ({
    id: `ig_${m.id}`, source: 'instagram' as const, title: (m.caption || '').split('\n')[0].slice(0, 140), url: m.permalink, date: m.timestamp,
    image: m.media_type === 'VIDEO' ? m.thumbnail_url : m.media_url,
  }));
}

export interface FeedResult { items: FeedItem[]; sources: Record<FeedItem['source'], 'ok' | 'error' | 'off'>; updatedAt: string }

let cached: { at: number; data: FeedResult } | null = null;
let inFlight: Promise<FeedResult> | null = null;

async function load(): Promise<FeedResult> {
  const [yt, web, ig] = await Promise.allSettled([youtube(), website(), instagram()]);
  const ok = <T,>(r: PromiseSettledResult<T[]>) => (r.status === 'fulfilled' ? r.value : []);
  [yt, web, ig].forEach(r => { if (r.status === 'rejected') console.warn('[social-feed]', (r.reason as Error)?.message); });
  const items = [...ok(yt), ...ok(web), ...ok(ig)].sort((a, b) => b.date.localeCompare(a.date));
  const data: FeedResult = {
    items,
    sources: {
      youtube: yt.status === 'fulfilled' ? 'ok' : 'error',
      website: web.status === 'fulfilled' ? 'ok' : 'error',
      instagram: !process.env.INSTAGRAM_ACCESS_TOKEN ? 'off' : ig.status === 'fulfilled' ? 'ok' : 'error',
    },
    updatedAt: new Date().toISOString(),
  };
  // Keep the last good items if every source failed this time
  if (!items.length && cached?.data.items.length) return { ...cached.data, sources: data.sources };
  const failed = Object.values(data.sources).includes('error');
  cached = { at: failed ? Date.now() - TTL_MS + RETRY_MS : Date.now(), data };
  return data;
}

export async function getFeed(): Promise<FeedResult> {
  if (cached && Date.now() - cached.at < TTL_MS) return cached.data;
  if (!inFlight) inFlight = load().finally(() => { inFlight = null; });
  return cached ? cached.data : inFlight;
}

/*
 * Turn any video link an admin pastes into something embeddable.
 * YouTube: watch?v=, youtu.be/, shorts/, live/, embed/ — keeps the start time (t=2s, t=1m30s, start=90).
 */

export type VideoSource =
  | { kind: 'youtube'; id: string; embedUrl: string }
  | { kind: 'file'; url: string }
  | { kind: 'unknown'; url: string };

/** "90" | "90s" | "1m30s" | "1h2m3s" → seconds */
function toSeconds(t: string | null): number {
  if (!t) return 0;
  if (/^\d+$/.test(t)) return Number(t);
  const m = /^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/.exec(t);
  return m ? Number(m[1] || 0) * 3600 + Number(m[2] || 0) * 60 + Number(m[3] || 0) : 0;
}

export function parseVideo(raw: string | undefined | null): VideoSource | null {
  const url = (raw || '').trim();
  if (!url) return null;
  let u: URL;
  try { u = new URL(url); } catch { return { kind: 'unknown', url }; }

  const host = u.hostname.replace(/^www\.|^m\./, '');
  let id: string | null = null;
  if (host === 'youtu.be') id = u.pathname.slice(1).split('/')[0];
  else if (host.endsWith('youtube.com') || host.endsWith('youtube-nocookie.com')) {
    id = u.searchParams.get('v') || (/^\/(?:embed|shorts|live|v)\/([\w-]{11})/.exec(u.pathname)?.[1] ?? null);
  }
  if (id && /^[\w-]{11}$/.test(id)) {
    const start = toSeconds(u.searchParams.get('t') || u.searchParams.get('start'));
    // Privacy-enhanced domain: no YouTube cookies until the visitor plays the video
    const embedUrl = `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1${start ? `&start=${start}` : ''}`;
    return { kind: 'youtube', id, embedUrl };
  }
  if (/\.(mp4|webm|ogg)(\?|$)/i.test(u.pathname)) return { kind: 'file', url };
  return { kind: 'unknown', url };
}

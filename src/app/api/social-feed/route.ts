import { NextResponse } from 'next/server';
import { getFeed } from '@/lib/social-feed';

export const dynamic = 'force-dynamic';

/** GET /api/social-feed — latest YouTube videos and website news (and Instagram if configured) */
export async function GET() {
  const feed = await getFeed();
  return NextResponse.json(feed, { headers: { 'Cache-Control': 'public, max-age=300, stale-while-revalidate=1800' } });
}

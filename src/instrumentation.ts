/** Runs once when the server starts: warm the open-data cache so the first visitor doesn't wait ~10 s */
export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;
  const { getSnapshot } = await import('@/lib/open-data/transactions-source');
  getSnapshot().catch(err => console.warn('[open-data] warm-up failed:', err));
}

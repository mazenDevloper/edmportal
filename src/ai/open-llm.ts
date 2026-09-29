/*
 * Open-source AI providers (no Gemini key needed).
 *
 * 1. OPEN_LLM_URL  — any OpenAI-compatible server running an open-weight model:
 *      Ollama   → OPEN_LLM_URL=http://localhost:11434/v1   OPEN_LLM_MODEL=qwen2.5:7b-instruct
 *      vLLM     → OPEN_LLM_URL=http://gpu-host:8000/v1      OPEN_LLM_MODEL=Qwen/Qwen2.5-14B-Instruct
 *      LocalAI / llama.cpp server work the same way.
 *    Used for meaning-based translation and the assistant (analyse → answer).
 * 2. LIBRETRANSLATE_URL — self-hosted LibreTranslate (Argos models). Literal but dependable;
 *    used for translation when no LLM is configured or the LLM fails.
 *
 * Everything runs on the server; the browser never sees these addresses or keys.
 */

const LLM_URL = process.env.OPEN_LLM_URL?.replace(/\/$/, '');
const LLM_MODEL = process.env.OPEN_LLM_MODEL || 'qwen2.5:7b-instruct';
const LLM_KEY = process.env.OPEN_LLM_API_KEY; // only if the server needs one
const LT_URL = process.env.LIBRETRANSLATE_URL?.replace(/\/$/, '');
const LT_KEY = process.env.LIBRETRANSLATE_API_KEY;
const TIMEOUT_MS = Number(process.env.OPEN_LLM_TIMEOUT_MS || 45_000);

export const providers = { llm: !!LLM_URL, libre: !!LT_URL, model: LLM_MODEL };

export interface ChatMessage { role: 'system' | 'user' | 'assistant'; content: string }

async function post(url: string, body: unknown, headers: Record<string, string> = {}) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(TIMEOUT_MS),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`${url} → HTTP ${res.status}`);
  return res.json();
}

/** One chat completion. json=true asks the model for a JSON object and parses it. */
export async function chat(messages: ChatMessage[], opts: { json?: boolean; temperature?: number; maxTokens?: number } = {}) {
  if (!LLM_URL) throw new Error('OPEN_LLM_URL is not set');
  const data = await post(`${LLM_URL}/chat/completions`, {
    model: LLM_MODEL,
    messages,
    temperature: opts.temperature ?? 0.2,
    max_tokens: opts.maxTokens ?? 1024,
    ...(opts.json ? { response_format: { type: 'json_object' } } : {}),
  }, LLM_KEY ? { Authorization: `Bearer ${LLM_KEY}` } : {});
  const text: string = data?.choices?.[0]?.message?.content ?? '';
  return opts.json ? parseJson(text) : text.trim();
}

/** Models sometimes wrap JSON in ```fences``` or add a sentence: take the first {...} block */
export function parseJson(text: string): any {
  const cleaned = text.replace(/```(?:json)?/gi, '').trim();
  try { return JSON.parse(cleaned); } catch { /* fall through */ }
  const start = cleaned.indexOf('{'), end = cleaned.lastIndexOf('}');
  if (start >= 0 && end > start) return JSON.parse(cleaned.slice(start, end + 1));
  throw new Error('Model did not return JSON');
}

/** LibreTranslate: several strings in one request */
export async function libreTranslate(texts: string[], source: 'ar' | 'en', target: 'ar' | 'en'): Promise<string[]> {
  if (!LT_URL) throw new Error('LIBRETRANSLATE_URL is not set');
  const data = await post(`${LT_URL}/translate`, { q: texts, source, target, format: 'text', ...(LT_KEY ? { api_key: LT_KEY } : {}) });
  const out = data?.translatedText;
  return Array.isArray(out) ? out : [String(out ?? '')];
}

// ─── Small in-memory cache so repeated strings (menus, ticker) aren't re-translated ───
const cache = new Map<string, string>();
const MAX_CACHE = 2000;
export const cacheGet = (k: string) => cache.get(k);
export function cacheSet(k: string, v: string) {
  if (cache.size >= MAX_CACHE) cache.delete(cache.keys().next().value as string);
  cache.set(k, v);
}

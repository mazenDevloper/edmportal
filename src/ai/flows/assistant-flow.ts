'use server';
/**
 * @fileOverview AI service assistant that analyses before it answers, on an open-weight model.
 *
 * Step 1 — analyse: what is being asked (intent), about which service, and is anything missing.
 * Step 2 — answer: using ONLY the facts retrieved from the portal (service guides + FAQs).
 * If no model is configured or it fails, the client falls back to the rule-based engine.
 */

import { chat, providers } from '@/ai/open-llm';
import type { RetrievedFacts } from '@/lib/assistant-engine';

export type AiIntent = 'documents' | 'fees' | 'duration' | 'conditions' | 'apply' | 'general' | 'other';

export interface AiAnalysis {
  intent: AiIntent;
  serviceId: string | null;
  needsClarification: boolean;
  restated: string;
}

export type AiReply =
  | { ok: true; analysis: AiAnalysis; answer: string }
  | { ok: false; reason: 'disabled' | 'error' };

const INTENTS: AiIntent[] = ['documents', 'fees', 'duration', 'conditions', 'apply', 'general', 'other'];
const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n)}…` : s);

export async function assistantAvailable() {
  return providers.llm;
}

export async function askAssistant(input: {
  question: string;
  isAr: boolean;
  history: { role: 'user' | 'assistant'; content: string }[];
  facts: RetrievedFacts;
}): Promise<AiReply> {
  if (!providers.llm) return { ok: false, reason: 'disabled' };
  const question = clip(input.question.trim(), 300);
  const history = input.history.slice(-4).map(m => ({ role: m.role, content: clip(m.content, 400) }));
  const lang = input.isAr ? 'Modern Standard Arabic' : 'English';
  const facts = input.facts;

  try {
    // ── Step 1: analyse ──
    const catalogue = facts.services.map(s => `- ${s.id}: ${s.guide.title}`).join('\n') || '(no matching services)';
    const raw = await chat([
      {
        role: 'system',
        content: `You analyse questions sent to the Dhofar Municipality service assistant. Do not answer the question.
Return a JSON object: {"intent": one of ${JSON.stringify(INTENTS)}, "service_id": id from the list or null, "needs_clarification": boolean, "restated_question": the question rewritten clearly and completely in ${lang}, resolving words like "it" or "and the fees?" from the conversation}.
Set needs_clarification=true only if several listed services fit equally and the conversation does not settle it.
Candidate services:\n${catalogue}`,
      },
      ...history,
      { role: 'user', content: question },
    ], { json: true, temperature: 0, maxTokens: 300 });

    const ids = new Set(facts.services.map(s => s.id));
    const analysis: AiAnalysis = {
      intent: INTENTS.includes(raw?.intent) ? raw.intent : 'general',
      serviceId: typeof raw?.service_id === 'string' && ids.has(raw.service_id) ? raw.service_id : null,
      needsClarification: raw?.needs_clarification === true,
      restated: typeof raw?.restated_question === 'string' && raw.restated_question.trim() ? clip(raw.restated_question.trim(), 300) : question,
    };

    // ── Step 2: answer from the facts only ──
    const chosen = analysis.serviceId ? facts.services.filter(s => s.id === analysis.serviceId) : facts.services;
    const factBlock = JSON.stringify({
      services: chosen.map(s => ({
        id: s.id, title: s.guide.title, description: clip(s.guide.description, 400),
        required_documents: s.guide.documents.map(d => `${d.label}${d.required ? '' : ' (optional)'}`),
        auto_fetched_data: s.guide.linked, conditions: s.guide.conditions.map(c => clip(c, 300)),
        fees: s.guide.fees, estimated_time: s.guide.duration, how_to_apply: s.guide.formSteps,
        external_service: s.guide.isExternal,
      })),
      faqs: facts.faqs,
      contact: { call_centre: '1771', whatsapp: '91484042', email: 'info@dm.gov.om' },
    });

    const answer = await chat([
      {
        role: 'system',
        content: `You are the AI service assistant of Dhofar Municipality. Reply in ${lang}.
Use ONLY the FACTS below. If the facts don't contain the answer, say so plainly and suggest the call centre 1771 — never guess fees, documents, durations or rules.
${analysis.needsClarification ? 'Several services fit: briefly list them and ask which one is meant.' : ''}
Be short and practical: one line of answer, then bullet points if listing items. No greetings, no markdown headings.
Never ask for passwords, civil numbers or payment details. Applying and tracking need a Thiqa sign-in on the portal.
If fees is null say they are set during review; if estimated_time is null say it depends on the request.
FACTS: ${factBlock}`,
      },
      ...history,
      { role: 'user', content: analysis.restated },
    ], { temperature: 0.2, maxTokens: 500 });

    if (!answer) return { ok: false, reason: 'error' };
    return { ok: true, analysis, answer: clip(answer, 1500) };
  } catch (e) {
    console.warn('[assistant] model failed:', (e as Error).message);
    return { ok: false, reason: 'error' };
  }
}

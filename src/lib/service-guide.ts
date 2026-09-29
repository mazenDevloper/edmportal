import { FormField, Service, ServiceFlow } from './types';
import { LinkedKind, linkedKind } from './linked-data';
import { SLA_SERVICES } from './footer-pages';
import { classifyActor } from './rbac';

/*
 * Everything a beneficiary should know before applying, in one shape.
 * Used by the service guide page (/services/[id]) and the floating assistant.
 */

export interface ServiceGuide {
  title: string;
  description: string;
  documents: { label: string; required: boolean }[];
  /** Data fetched automatically instead of uploaded (Thiqa, Commercial Registration) */
  linked: LinkedKind[];
  conditions: string[];
  fees: string | null;
  duration: string | null;
  /** What happens after submitting, in order: who does what */
  steps: { actor: string; title: string; kind: 'applicant' | 'staff' | 'system' }[];
  formSteps: string[];
  isExternal: boolean;
}

const norm = (s: string) => s
  .replace(/[ً-ْـ]/g, '')
  .replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي')
  .replace(/[()\-–،,.]/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();

/** Service duration from the SLA table when the service has none of its own (closest name by shared words) */
function slaDuration(service: Service, isAr: boolean): string | null {
  const words = (t: string) => new Set(norm(t).split(' ').map(w => w.replace(/^(ال|لل)(?=\S{3,})/, '')).filter(w => w.length > 1));
  const title = words(service.title);
  let best: { score: number; i: number } = { score: 0, i: -1 };
  SLA_SERVICES.forEach((s, i) => {
    const sla = words(s.nameAr);
    const shared = [...sla].filter(w => title.has(w)).length;
    // Words in common over all words used (Jaccard), so a longer name needs more matches
    const score = shared / new Set([...sla, ...title]).size;
    if (score > best.score) best = { score, i };
  });
  if (best.score < 0.6) return null;
  const hit = SLA_SERVICES[best.i];
  return isAr ? hit.durationAr : hit.durationEn;
}

const isEligibility = (f: FormField) => f.type === 'info' && (f.labelEn === 'Eligibility' || f.labelAr === 'شروط الاستفادة');

export function buildServiceGuide(service: Service, flow: ServiceFlow | null, isAr: boolean): ServiceGuide {
  const pick = (ar?: string, en?: string) => ((isAr ? ar : en || ar) || '').trim();
  const fields = flow?.steps.flatMap(s => s.fields) || [];

  const conditions = [
    ...fields.filter(isEligibility).map(f => pick(f.content?.bodyAr, f.content?.bodyEn)),
    ...pick(service.conditionsAr, service.conditionsEn).split(/\n+/),
  ].map(s => s.replace(/^[-•*\d.)\s]+/, '').trim()).filter(Boolean);

  const uploads = fields.filter(f => f.type === 'upload');
  const rawDocs = uploads.length
    ? uploads.map(f => ({ label: pick(f.labelAr, f.labelEn), ar: f.labelAr, required: f.required }))
    : (service.reqsAr || []).map((ar, i) => ({ label: isAr ? ar : service.reqsEn?.[i] || ar, ar, required: true }));
  const linked = new Set<LinkedKind>();
  const documents = rawDocs.filter(d => {
    const k = linkedKind(d.ar) || linkedKind(d.label);
    if (k) linked.add(k);
    return !k;
  }).map(({ label, required }) => ({ label, required }));
  fields.forEach(f => { const k = linkedKind(f.labelAr) || linkedKind(f.labelEn); if (k) linked.add(k); });

  const fees = pick(service.fees, service.feesEn) || null;
  const duration = pick(service.durationAr, service.durationEn) || slaDuration(service, isAr);

  const steps = (flow?.processStages || [])
    .slice().sort((a, b) => a.order - b.order)
    .map(s => ({ actor: pick(s.actorAr, s.actorEn), title: pick(s.titleAr, s.titleEn), kind: classifyActor(s) }));

  return {
    title: pick(service.title, service.titleEn),
    description: pick(service.description, service.descriptionEn),
    documents,
    linked: [...linked],
    conditions,
    fees,
    duration,
    steps,
    formSteps: (flow?.steps || []).map(s => pick(s.titleAr, s.titleEn)).filter(Boolean),
    isExternal: service.type === 'link' && !!service.linkUrl,
  };
}

export { norm as normalizeArabic };

import { blueprintFor } from './flow-blueprints';
import type { BlueprintLane, BlueprintNode, ServiceFlow, ServiceStep } from './types';

/*
 * The procedural sequence of a service, derived from its flow diagram (مخطط المسار):
 * every box of the diagram becomes a step, in order, owned by its lane (applicant, system or a
 * staff role), placed in a phase of the standard sequence, and given the screen that actor
 * works on. The request form's own steps (ServiceStep) are attached to the applicant's
 * "fill in the request" step, so the form and the diagram describe one sequence.
 */

export type Bi = { ar: string; en: string };
const bi = (ar: string, en: string): Bi => ({ ar, en });

/** The standard sequence: submit → review → approval → payment notice → e-payment → issue */
export type Phase = 'submit' | 'review' | 'approval' | 'notify_pay' | 'pay' | 'issue' | 'info' | 'reject';
export const MAIN_PHASES: Phase[] = ['submit', 'review', 'approval', 'notify_pay', 'pay', 'issue'];
export const PHASE_LABEL: Record<Phase, Bi> = {
  submit: bi('تقديم الطلب', 'Submission'),
  review: bi('المراجعة والتدقيق', 'Review & audit'),
  approval: bi('الموافقة', 'Approval'),
  notify_pay: bi('إشعار المراجع بالسداد', 'Payment notice'),
  pay: bi('السداد الإلكتروني', 'E-payment'),
  issue: bi('إصدار الخدمة / المستند', 'Issue service / document'),
  info: bi('استكمال المعلومات', 'More information'),
  reject: bi('الرفض', 'Rejection'),
};

export type ScreenType = 'catalog' | 'form' | 'inbox' | 'review' | 'visit' | 'decision' | 'fees' | 'payment' | 'notice' | 'document' | 'auto';
export interface ScreenSpec {
  type: ScreenType;
  title: Bi;
  /** What the screen shows */
  elements: Bi[];
  /** Buttons / actions available to the actor */
  actions: Bi[];
  /** What the step produces: status changes, notifications, documents */
  outputs: Bi[];
  /** Applicant form screens: the request form's own steps and fields */
  formSteps?: ServiceStep[];
}

export interface SeqLink { id: string; label: Bi; actor: Bi; via?: Bi; dashed?: boolean }
export interface SeqStep {
  id: string;
  order: number;
  num?: string;
  kind: BlueprintNode['kind'];
  lane: BlueprintLane;
  label: Bi;
  phase: Phase;
  screen: ScreenSpec;
  /** Where the request goes next (branches of a decision carry their label) */
  next: SeqLink[];
  /** Who hands the request to this step */
  from: Bi[];
  assigneeUserId?: string;
  /** Not a box of the diagram: spelled out from a payment sub-process so the sequence is complete */
  derived?: boolean;
}
export interface SeqCheck { ok: boolean; text: Bi }
export interface FlowSequence {
  steps: SeqStep[];
  lanes: BlueprintLane[];
  /** Number of steps and the actors involved per main phase */
  phases: { phase: Phase; count: number; actors: Bi[] }[];
  checks: SeqCheck[];
  /** True when the diagram was generated from the processing stages rather than drawn from the PDF */
  generated: boolean;
}

// ── Phase of a diagram box, from its wording and its lane ──
const RX = {
  reject: /رفض/,
  info: /معلومات إضافية|مستندات إضافية|توضيح|استكمال|تفاصيل أو مستندات/,
  payNotice: /(إشعار|إبلاغ|إخطار|تنبيه|رسالة).*(سداد|دفع|رسوم)|(تحديد|احتساب|تقدير).*(رسوم|تكلفة|مبلغ)/,
  pay: /سداد|دفع/,
  issue: /إصدار|موقّع رقمي|الموقع رقمي|تنزيل|(استلام|إرسال).*(تصريح|ترخيص|شهادة|الموافقة النهائية|المستند|الرخصة)|تحديث.*(السجل|قاعدة البيانات)/,
  prelim: /الموافقة (الأولية|المبدئية)/,
  approval: /اعتماد|القرار|قرار|هل تمت الموافقة|الموافقة|قبول الطلب/,
  visit: /زيارة|معاينة|ميداني/,
  report: /تقرير|توصية|محضر/,
  review: /مراجعة|تدقيق|التحقق|فحص|دراسة|استلام إشعار|استلام المهمة|إنشاء مهمة|تعيين/,
  submit: /اختيار الخدمة|تعبئة|تقديم|إدخال|إرفاق|إكمال الطلب/,
};

function phaseOf(n: BlueprintNode, lane: BlueprintLane, afterStaff: boolean): Phase {
  const s = n.labelAr;
  if (lane.kind === 'applicant' && !afterStaff && /اختيار (ال)?خدمة/.test(s)) return 'submit';
  if (RX.reject.test(s)) return 'reject';
  if (RX.payNotice.test(s)) return 'notify_pay';
  if (RX.pay.test(s)) return 'pay';
  if (RX.issue.test(s)) return 'issue';
  if (RX.info.test(s)) return 'info';
  if (lane.kind === 'staff') {
    if (RX.prelim.test(s) || (RX.approval.test(s) && !/مراجعة/.test(s))) return 'approval';
    return 'review';
  }
  if (lane.kind === 'applicant') return afterStaff ? (RX.submit.test(s) ? 'info' : 'issue') : 'submit';
  // System lane: checks before a human looks at it belong to submission; task creation starts the review
  if (/إنشاء مهمة|تعيين/.test(s)) return 'review';
  return afterStaff ? 'review' : 'submit';
}

// ── Screen for a step ──
const APPLICANT_DATA = bi('بيانات مقدم الطلب (من ثقة) وبيانات المنشأة', 'Applicant data (from Thiqa) and establishment data');
const REQUEST_DATA = bi('بيانات الطلب كما أدخلها المتقدم', 'The request data as entered by the applicant');
const ATTACHMENTS = bi('المستندات المرفقة مع إمكانية المعاينة والتنزيل', 'Attached documents, with preview and download');
const HISTORY = bi('سجل الإجراءات والملاحظات السابقة', 'History of actions and earlier notes');
const SLA = bi('المدة المتبقية حسب اتفاقية مستوى الخدمة', 'Time left under the service level agreement');
const NOTIFY_APPLICANT = bi('إشعار للمتقدم (رسالة نصية وبريد إلكتروني وفي البوابة)', 'Notice to the applicant (SMS, email and in the portal)');

function screenOf(n: BlueprintNode, lane: BlueprintLane, phase: Phase, flow: ServiceFlow, firstForm: boolean): ScreenSpec {
  const s = n.labelAr;
  const title = bi(n.labelAr, n.labelEn);

  if (lane.kind === 'system') {
    const outputs: Bi[] = [];
    if (phase === 'issue') outputs.push(bi('المستند الموقّع رقمياً برمز QR للتحقق', 'Digitally signed document with a QR code for verification'), NOTIFY_APPLICANT);
    else if (phase === 'pay' || phase === 'notify_pay') outputs.push(bi('إشعار بالمبلغ ورابط السداد', 'Notice with the amount and a payment link'), bi('إيصال السداد بعد نجاح العملية', 'Payment receipt once it succeeds'));
    else if (phase === 'reject') outputs.push(bi('إشعار بالرفض مع السبب', 'Rejection notice with the reason'));
    else if (/إنشاء مهمة|تعيين/.test(s)) outputs.push(bi('مهمة في صندوق الموظف المختص حسب عبء العمل والموقع', 'A task in the competent employee’s inbox, by workload and location'));
    else outputs.push(bi('نتيجة التحقق الآلي تُسجَّل على الطلب', 'The automatic check result is recorded on the request'));
    return { type: 'auto', title, elements: [bi('إجراء آلي يُنفَّذ دون شاشة', 'An automatic action; no screen')], actions: [], outputs };
  }

  if (lane.kind === 'applicant') {
    if (/اختيار الخدمة/.test(s)) return { type: 'catalog', title, elements: [bi('دليل الخدمة: المستندات والاشتراطات والرسوم والمدة', 'Service guide: documents, conditions, fees and time')], actions: [bi('ابدأ الخدمة (الدخول عبر ثقة)', 'Start the service (Thiqa sign-in)')], outputs: [] };
    if (phase === 'pay' || phase === 'notify_pay') {
      return { type: 'payment', title, elements: [bi('المبلغ المستحق وتفاصيل الرسوم', 'Amount due and fee details'), bi('وسائل السداد الإلكتروني المتاحة', 'Available e-payment methods')], actions: [bi('ادفع الآن', 'Pay now')], outputs: [bi('إيصال سداد إلكتروني', 'Electronic receipt')], formSteps: flow.steps.filter(x => x.actionType === 'payment') };
    }
    if (phase === 'issue') return { type: 'document', title, elements: [bi('حالة الطلب: مكتمل', 'Request status: completed'), bi('المستند الصادر مع رمز QR', 'The issued document with its QR code')], actions: [bi('تنزيل المستند', 'Download the document'), bi('طباعة', 'Print')], outputs: [] };
    if (phase === 'info') return { type: 'notice', title, elements: [bi('ملاحظة الموظف والمطلوب استكماله', 'The employee’s note and what is needed'), ATTACHMENTS], actions: [bi('إرفاق المستندات المطلوبة', 'Attach the requested documents'), bi('إرسال الرد', 'Send the reply')], outputs: [bi('يعود الطلب إلى الموظف للمراجعة', 'The request returns to the employee for review')] };
    if (phase === 'reject') return { type: 'notice', title, elements: [bi('حالة الطلب وسبب الرفض', 'Request status and rejection reason')], actions: [bi('تقديم طلب جديد', 'Submit a new request')], outputs: [] };
    if (/تقديم الطلب|إرسال/.test(s) && !/البيانات/.test(s)) return { type: 'form', title, elements: [bi('ملخص الطلب قبل الإرسال', 'Summary of the request before sending'), bi('الإقرار بصحة البيانات', 'Declaration that the data is correct')], actions: [bi('إرسال الطلب', 'Submit the request')], outputs: [bi('رقم المعاملة لتتبع الطلب', 'Transaction number to track the request'), bi('استبيان رضا المتعامل', 'Customer satisfaction survey')] };
    // Filling in the request: this is where the form's own steps live
    return {
      type: 'form', title,
      elements: [APPLICANT_DATA, bi('حقول نموذج الطلب', 'The request form fields')],
      actions: [bi('التالي / السابق', 'Next / Back'), bi('حفظ كمسودة', 'Save draft')],
      outputs: [],
      formSteps: firstForm ? flow.steps.filter(x => x.actionType !== 'payment') : undefined,
    };
  }

  // Staff
  if (/استلام إشعار|استلام المهمة/.test(s)) return { type: 'inbox', title, elements: [bi('صندوق المهام: الطلبات المسندة إليه مع الحالة والأولوية', 'Task inbox: requests assigned to them, with status and priority'), SLA, bi('بحث وتصفية برقم المعاملة أو الحالة', 'Search and filter by transaction number or status')], actions: [bi('فتح الطلب', 'Open the request')], outputs: [bi('تتحول الحالة إلى «قيد المراجعة»', 'Status becomes “in review”')] };
  if (n.kind === 'subprocess' || RX.visit.test(s)) return { type: 'visit', title, elements: [bi('موقع الطلب على الخريطة', 'The request location on the map'), bi('قائمة بنود المعاينة', 'Inspection checklist'), REQUEST_DATA], actions: [bi('تسجيل نتيجة الزيارة', 'Record the visit result'), bi('إرفاق صور من الموقع', 'Attach site photos'), bi('رفع تقرير المعاينة', 'Submit the inspection report')], outputs: [bi('تقرير الزيارة يُرفق بالطلب', 'The visit report is attached to the request')] };
  if (phase === 'notify_pay') return { type: 'fees', title, elements: [REQUEST_DATA, bi('جدول الرسوم المعتمد للخدمة', 'The approved fee schedule')], actions: [bi('تحديد المبلغ المستحق', 'Set the amount due'), bi('إرسال إشعار السداد', 'Send the payment notice')], outputs: [NOTIFY_APPLICANT] };
  if (n.kind === 'decision') {
    return { type: 'decision', title, elements: [bi('ملخص الطلب وملاحظات المراجعة', 'Request summary and review notes')], actions: [], outputs: [bi('يتحدد المسار التالي حسب الإجابة', 'The next path depends on the answer')] };
  }
  if (phase === 'approval') {
    const prelim = RX.prelim.test(s);
    return {
      type: 'decision', title,
      elements: [REQUEST_DATA, ATTACHMENTS, bi('ملاحظات وتوصية من راجع الطلب قبله', 'Notes and recommendation of the previous reviewer'), HISTORY],
      actions: prelim
        ? [bi('موافقة مبدئية', 'Preliminary approval'), bi('طلب استكمال', 'Request more information'), bi('إضافة ملاحظة', 'Add a note')]
        : [bi('اعتماد', 'Approve'), bi('رفض مع ذكر السبب', 'Reject with a reason'), bi('إعادة للاستكمال', 'Return for more information')],
      outputs: [bi(prelim ? 'ينتقل الطلب للاعتماد' : 'ينتقل الطلب للسداد أو الإصدار', prelim ? 'The request moves to approval' : 'The request moves to payment or issuing'), NOTIFY_APPLICANT],
    };
  }
  if (phase === 'reject') return { type: 'decision', title, elements: [REQUEST_DATA, HISTORY], actions: [bi('تأكيد الرفض وكتابة السبب', 'Confirm the rejection and write the reason')], outputs: [NOTIFY_APPLICANT] };
  if (phase === 'issue') return { type: 'document', title, elements: [bi('معاينة المستند قبل الإصدار', 'Preview of the document before issuing')], actions: [bi('إصدار', 'Issue')], outputs: [NOTIFY_APPLICANT] };
  return {
    type: 'review', title,
    elements: [APPLICANT_DATA, REQUEST_DATA, ATTACHMENTS, HISTORY, ...(RX.report.test(s) ? [bi('نموذج التقرير / التوصية', 'Report / recommendation form')] : [])],
    actions: [bi('إضافة ملاحظة أو توصية', 'Add a note or recommendation'), bi('طلب معلومات إضافية', 'Request more information'), bi('إحالة للخطوة التالية', 'Pass to the next step')],
    outputs: [bi('تُحفظ الملاحظات في سجل الطلب', 'Notes are saved in the request history')],
  };
}

export function buildSequence(flow: ServiceFlow): FlowSequence {
  const bp = blueprintFor(flow);
  const laneIndex = new Map(bp.lanes.map((l, i) => [l.id, i]));
  const laneOf = (id: string) => bp.lanes.find(l => l.id === id) || bp.lanes[0];
  const real = (n: BlueprintNode) => n.kind !== 'start' && n.kind !== 'end' && n.kind !== 'connector';
  const offsetRank = (n: BlueprintNode) => (n.offset === 'top' ? 0 : n.offset === 'bottom' ? 2 : 1);
  const byPlace = (a: BlueprintNode, b: BlueprintNode) => a.col - b.col || (laneIndex.get(a.lane)! - laneIndex.get(b.lane)!) || offsetRank(a) - offsetRank(b);

  // Arrows that pass through a connector (off-page reference) or reach the end are resolved to real boxes
  const byId = new Map(bp.nodes.map(n => [n.id, n]));
  const resolve = (id: string, seen = new Set<string>()): BlueprintNode[] => {
    const n = byId.get(id);
    if (!n || seen.has(id)) return [];
    if (real(n) || n.kind === 'end') return [n];
    seen.add(id);
    // A connector continues at its twin with the same label, then along its outgoing arrows
    const twins = n.kind === 'connector' ? bp.nodes.filter(x => x.kind === 'connector' && x.labelAr === n.labelAr) : [n];
    return twins.flatMap(tw => bp.edges.filter(ed => ed.from === tw.id).flatMap(ed => resolve(ed.to, seen)));
  };
  const actor = (l: BlueprintLane): Bi => bi(l.labelAr, l.labelEn);

  // Order = the diagram's arrows (a step never comes before the step that leads to it); loops back
  // (return for more information) and dashed arrows do not count. Ties follow the diagram's columns.
  const boxes = bp.nodes.filter(real);
  const succ = new Map<string, string[]>(boxes.map(n => [n.id, []]));
  for (const n of [...boxes, ...bp.nodes.filter(x => x.kind === 'start')]) {
    const out = bp.edges.filter(ed => ed.from === n.id && !ed.dashed).flatMap(ed => resolve(ed.to)).filter(real).map(x => x.id);
    succ.set(n.id, [...new Set(out)]);
  }
  const back = new Set<string>(), state = new Map<string, 1 | 2>();
  const visit = (id: string) => {
    state.set(id, 1);
    for (const to of succ.get(id) || []) {
      if (state.get(to) === 1) back.add(`${id}>${to}`);
      else if (!state.has(to)) visit(to);
    }
    state.set(id, 2);
  };
  bp.nodes.filter(x => x.kind === 'start').forEach(x => visit(x.id));
  [...boxes].sort(byPlace).forEach(n => { if (!state.has(n.id)) visit(n.id); });
  const indeg = new Map<string, number>(boxes.map(n => [n.id, 0]));
  for (const n of boxes) for (const to of succ.get(n.id) || []) if (!back.has(`${n.id}>${to}`)) indeg.set(to, (indeg.get(to) || 0) + 1);
  const ordered: BlueprintNode[] = [];
  const ready = boxes.filter(n => !indeg.get(n.id)).sort(byPlace);
  while (ready.length) {
    const n = ready.shift()!;
    ordered.push(n);
    for (const to of succ.get(n.id) || []) {
      if (back.has(`${n.id}>${to}`)) continue;
      indeg.set(to, indeg.get(to)! - 1);
      if (!indeg.get(to)) { ready.push(byId.get(to)!); ready.sort(byPlace); }
    }
  }
  for (const n of [...boxes].sort(byPlace)) if (!ordered.includes(n)) ordered.push(n);

  let afterStaff = false, formAttached = false;
  const steps: SeqStep[] = ordered.map<SeqStep>((n, i) => {
    const lane = laneOf(n.lane);
    if (lane.kind === 'staff') afterStaff = true;
    const phase = phaseOf(n, lane, afterStaff && lane.kind !== 'staff');
    const isForm = lane.kind === 'applicant' && phase === 'submit' && !/اختيار الخدمة/.test(n.labelAr) && !(/تقديم الطلب|إرسال/.test(n.labelAr) && !/البيانات/.test(n.labelAr));
    const screen = screenOf(n, lane, phase, flow, isForm && !formAttached);
    if (isForm) formAttached = true;
    const next: SeqLink[] = bp.edges.filter(ed => ed.from === n.id).flatMap(ed => resolve(ed.to).map(to => ({
      id: to.id, label: bi(to.labelAr, to.labelEn), actor: actor(laneOf(to.lane)), dashed: ed.dashed,
      via: ed.labelAr ? bi(ed.labelAr, ed.labelEn || ed.labelAr) : undefined,
    })));
    return { id: n.id, order: i + 1, num: n.num, kind: n.kind, lane, label: bi(n.labelAr, n.labelEn), phase, screen, next, from: [], assigneeUserId: n.assigneeUserId };
  });
  // If the form was never attached (no "fill in" box), put it on the applicant's first step
  if (!formAttached && flow.steps.length) {
    const first = steps.find(s => s.lane.kind === 'applicant' && !s.derived);
    if (first) first.screen = { ...first.screen, type: 'form', formSteps: flow.steps.filter(x => x.actionType !== 'payment') };
  }
  // A payment sub-process stands for two steps of the standard sequence: the notice, then the
  // applicant's e-payment. Spell them out when the diagram does not draw them.
  const payAt = steps.findIndex(s => s.phase === 'pay');
  if (payAt >= 0) {
    const pay = steps[payAt];
    const sysLane = bp.lanes.find(l => l.kind === 'system') || pay.lane;
    const appLane = bp.lanes.find(l => l.kind === 'applicant');
    const mk = (id: string, lane: BlueprintLane, phase: Phase, ar: string, en: string): SeqStep => {
      const node: BlueprintNode = { id, lane: lane.id, col: 0, kind: 'task', labelAr: ar, labelEn: en };
      return { id, order: 0, kind: 'task', lane, label: bi(ar, en), phase, screen: screenOf(node, lane, phase, flow, false), next: [], from: [], derived: true };
    };
    if (appLane && !steps.some(s => s.phase === 'pay' && s.lane.kind === 'applicant')) {
      steps.splice(payAt + 1, 0, mk('derived-pay', appLane, 'pay', 'السداد الإلكتروني للرسوم عبر بوابة الدفع', 'Pay the fees online through the payment gateway'));
    }
    if (!steps.some(s => s.phase === 'notify_pay')) {
      steps.splice(payAt, 0, mk('derived-notify', sysLane, 'notify_pay', 'إشعار المراجع بالسداد: المبلغ المستحق ورابط الدفع', 'Notify the applicant to pay: the amount due and the payment link'));
    }
    steps.forEach((s, i) => { s.order = i + 1; });
  }

  // Decision buttons are its branches
  for (const s of steps) if (s.kind === 'decision') s.screen.actions = s.next.filter(x => x.via).map(x => x.via!);
  for (const s of steps) for (const nx of s.next) {
    const target = steps.find(x => x.id === nx.id);
    if (target && target.lane.id !== s.lane.id && !target.from.some(f => f.ar === s.lane.labelAr)) target.from.push(actor(s.lane));
  }

  const phases = MAIN_PHASES.map(phase => {
    const inPhase = steps.filter(s => s.phase === phase);
    const actors: Bi[] = [];
    inPhase.forEach(s => { if (!actors.some(a => a.ar === s.lane.labelAr)) actors.push(actor(s.lane)); });
    return { phase, count: inPhase.length, actors };
  });

  // Order checks against the standard sequence
  const first = (p: Phase) => steps.find(s => s.phase === p)?.order ?? null;
  const has = (p: Phase) => first(p) !== null;
  const before = (a: Phase, b: Phase) => first(a) === null || first(b) === null || first(a)! < first(b)!;
  const checks: SeqCheck[] = [
    { ok: has('submit'), text: bi('يبدأ المسار بتقديم الطلب من المتقدم', 'The path starts with the applicant’s submission') },
    { ok: has('review') && before('submit', 'review'), text: bi('المراجعة والتدقيق تأتي بعد تقديم الطلب', 'Review and audit follow the submission') },
    ...(has('approval') ? [{ ok: before('review', 'approval'), text: bi('الموافقة تأتي بعد المراجعة', 'Approval follows the review') }] : []),
    ...(has('pay') ? [
      { ok: !has('approval') || before('approval', 'pay'), text: bi('السداد يأتي بعد الموافقة', 'Payment follows approval') },
      { ok: has('notify_pay'), text: bi('يوجد إشعار للمراجع بالسداد قبل السداد الإلكتروني', 'The applicant is notified before the e-payment') },
      { ok: before('pay', 'issue'), text: bi('إصدار المستند يأتي بعد السداد', 'The document is issued after payment') },
    ] : []),
    { ok: has('issue'), text: bi('ينتهي المسار بإصدار الخدمة / المستند', 'The path ends by issuing the service / document') },
  ];

  return { steps, lanes: bp.lanes.filter(l => steps.some(s => s.lane.id === l.id)), phases, checks, generated: !flow.blueprint };
}

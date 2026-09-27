import { BlueprintEdge, BlueprintLane, BlueprintNode, BlueprintNote, FlowBlueprint, ProcessStage, ServiceFlow } from './types';
import { actorCode, classifyActor, inferPermissions } from './rbac';

/*
 * Swimlane diagrams transcribed from the municipality's process PDFs ("المسارات"),
 * one per service. Columns follow the PDF left → right; box numbers, decisions,
 * sub-processes, connectors, arrow labels and explanatory notes are kept as drawn.
 * Staff lanes carry the ProcessStage actorEn so they map to the same service role.
 */

// ─── Authoring helpers ───
type Label = [string, string];
const A: BlueprintLane = { id: 'A', labelAr: 'المتقدم', labelEn: 'Applicant', kind: 'applicant' };
const S: BlueprintLane = { id: 'S', labelAr: 'عملية تقديم الخدمة الآلية', labelEn: 'Automated service process', kind: 'system' };
const staff = (id: string, labelAr: string, labelEn: string, actorEn = labelEn): BlueprintLane => ({ id, labelAr, labelEn, kind: 'staff', actorEn });

type Offset = BlueprintNode['offset'];
const t = (num: number | string, lane: string, col: number, labelAr: string, labelEn: string, offset?: Offset): BlueprintNode =>
  ({ id: `n${num}`, num: String(num), lane, col, kind: 'task', labelAr, labelEn, offset });
const d = (id: string, lane: string, col: number, labelAr: string, labelEn: string, offset?: Offset): BlueprintNode =>
  ({ id, lane, col, kind: 'decision', labelAr, labelEn, offset });
const h = (id: string, lane: string, col: number, labelAr: string, labelEn: string, offset?: Offset): BlueprintNode =>
  ({ id, lane, col, kind: 'subprocess', labelAr, labelEn, offset });
const c = (id: string, lane: string, col: number, label: string, offset?: Offset): BlueprintNode =>
  ({ id, lane, col, kind: 'connector', labelAr: label, labelEn: label, offset });
const start = (lane: string, col = 0): BlueprintNode => ({ id: 'start', lane, col, kind: 'start', labelAr: 'بداية', labelEn: 'Start' });
const end = (lane: string, col: number, id = 'end'): BlueprintNode => ({ id, lane, col, kind: 'end', labelAr: 'نهاية', labelEn: 'End' });
const e = (from: string, to: string, label?: Label, dashed?: boolean): BlueprintEdge =>
  ({ from, to, ...(label ? { labelAr: label[0], labelEn: label[1] } : {}), ...(dashed ? { dashed } : {}) });
const n = (num: number, textAr: string, textEn: string): BlueprintNote => ({ num, textAr, textEn });
/** Chain of plain arrows: seq('a','b','c') → a→b, b→c */
const seq = (...ids: string[]) => ids.slice(1).map((id, i) => e(ids[i], id));

const YES: Label = ['نعم', 'Yes'];
const NO: Label = ['لا', 'No'];
const APPROVE: Label = ['موافقة', 'Approved'];
const REJECT: Label = ['رفض', 'Rejected'];

// Boxes that repeat across many PDFs
const SELECT_SERVICE: Label = ['اختيار الخدمة في بوابة الخدمات الإلكترونية للبلدية', 'Select the service on the municipality e-services portal'];
const SUBMIT: Label = ['تقديم الطلب', 'Submit the request'];
const RECEIVE_TASK: Label = ['استلام إشعار ومراجعة المهمة والرسالة', 'Receive the notification and review the task and message'];
const CREATE_TASK: Label = ['إنشاء مهمة لمراجعة الطلب وتعيينها تلقائياً للموظف المختص', 'Create a review task and auto-assign it to the competent employee'];
const NEED_INFO: Label = ['هل مطلوب توضيح أو معلومات إضافية؟', 'Clarification or more information needed?'];
const IS_APPROVED: Label = ['هل تمت الموافقة على طلب الخدمة؟', 'Is the service request approved?'];

export const PDF_BLUEPRINTS: Record<string, FlowBlueprint> = {
  // 1 ─ الموافقة على تنظيم الأسواق التخصصية المؤقتة
  svc_121: {
    source: 'الموافقة على تنظيم الأسواق التخصصية المؤقتة.pdf',
    lanes: [A, S, staff('R', 'مراجع الفعاليات', 'Events Reviewer'), staff('H', 'رئيس القسم / رئيس الإدارة', 'Head of Section / Department')],
    nodes: [
      start('A'),
      t(1, 'A', 1, ...SELECT_SERVICE),
      t(2, 'S', 2, 'التحقق تلقائياً من بيانات المنشأة المتعلقة بوزارة التجارة والمستندات المطلوبة', 'Auto-verify the establishment data with the Ministry of Commerce and the required documents'),
      t(3, 'A', 3, 'تعبئة ومراجعة الطلب', 'Fill in and review the request'),
      t(4, 'A', 4, ...SUBMIT),
      t(5, 'S', 4, ...CREATE_TASK),
      t(6, 'R', 4, ...RECEIVE_TASK),
      t(7, 'R', 5, 'مراجعة جميع الوثائق والطلب ذات الصلة', 'Review all related documents and the request'),
      c('A1b', 'R', 5, 'A1', 'top'),
      d('D1', 'R', 6, ...NEED_INFO),
      t(8, 'A', 6, 'استلام إشعار لتقديم تفاصيل أو مستندات إضافية حسب متطلبات المشروع', 'Receive a notice to provide additional details or documents as the project requires'),
      c('A1', 'A', 6.8, 'A1'),
      t(9, 'R', 7, 'الموافقة الأولية على الخدمة', 'Initial approval of the service'),
      t(11, 'H', 7, ...RECEIVE_TASK),
      t(12, 'H', 8, 'مراجعة ملاحظات مراجع الفعاليات وطلب الخدمة', "Review the events reviewer's notes and the service request"),
      d('D2', 'H', 9, ...IS_APPROVED),
      h('PAY', 'S', 9, 'إجراءات سداد رسوم الخدمات', 'Service fee payment procedure'),
      t(14, 'S', 10, 'إصدار تصريح الفعاليات الموقّع رقمياً', 'Issue the digitally signed events permit'),
      t(15, 'A', 10, 'استلام رسالة/بريد إلكتروني بشأن تصريح الفعاليات الرقمي', 'Receive a message/email about the digital events permit'),
      t(16, 'S', 11, 'تحديث مقدم الطلب بحالة الرفض', 'Update the applicant with the rejection status'),
      end('A', 11),
    ],
    edges: [
      ...seq('start', 'n1', 'n2', 'n3', 'n4', 'n5', 'n6', 'n7', 'D1'),
      e('D1', 'n8', YES), e('n8', 'A1'), e('A1b', 'n7'),
      e('D1', 'n9', NO), ...seq('n9', 'n11', 'n12', 'D2'),
      e('D2', 'PAY', APPROVE), ...seq('PAY', 'n14', 'n15', 'end'),
      e('D2', 'n16', REJECT), e('n16', 'end'),
      e('D2', 'n6', ['توضيح أو معلومات إضافية', 'Clarification / more information'], true),
    ],
    notes: [
      n(1, 'يشترط أن يكون مقدم الطلب مصادَقاً عليه كمنشأة تجارية مسجّلة للاستفادة من هذه الخدمة في إنشاء الطلب.', 'The applicant must be authenticated as a registered commercial establishment to use this service.'),
      n(2, 'يقوم مقدم الطلب بتعبئة الطلب بتفاصيل الفعاليات والموافقات اللازمة من الجهات الخارجية.', 'The applicant fills in the event details and the approvals required from external authorities.'),
      n(3, 'بعد تقديم الطلب، يظهر استبيان رضا العملاء كنافذة منبثقة لمقدم الطلب لإكماله.', 'After submission, a customer-satisfaction survey pops up for the applicant to complete.'),
      n(4, 'يقوم النظام بتعيين المهمة لموظف بناءً على عبء العمل والموقع الجغرافي المقابل، كما يفوّض المهمة تلقائياً في حال غياب الموظف.', 'The system assigns the task based on workload and geographic location, and delegates it automatically when the employee is absent.'),
      n(5, 'إذا احتاج موظف البلدية إلى معلومات أو مستندات إضافية، يمكنه استخدام أدوات المراسلة داخل النظام و/أو إنشاء مهمة لمقدم الطلب لتقديم المعلومات أو المستندات الإضافية.', 'If the employee needs more information or documents, they can message the applicant in the system and/or create a task for the applicant to provide them.'),
      n(6, 'يمكن لمقدم الطلب الاطلاع على التعليق أو طلب التوضيح من الموظف البلدي وتقديم التفاصيل / المستندات المطلوبة حسب الاقتضاء.', "The applicant can view the employee's comment or clarification request and provide the details/documents as needed."),
      n(7, 'يمنح الموظف الموافقة الأولية على الفعالية، ويُفعّل للمتقدم إرفاق موافقات الجهات الخارجية.', 'The employee grants initial approval and enables the applicant to attach external authority approvals.'),
      n(8, 'يراجع رئيس القسم أو المدير العام للدائرة الطلب وطلب الخدمة وملاحظات موظفي البلدية.', "The head of section or the department's director general reviews the request and the employees' notes."),
      n(9, 'يُنشئ النظام تلقائياً رمز الاستجابة السريعة (QR) للتصريح الموقّع رقمياً استناداً إلى تفاصيل الطلب، وبمجرد إصدار الشهادة تُحدَّث مجموعات البيانات ذات الصلة آنياً.', 'The system generates a QR code for the digitally signed permit; once issued, the related datasets are updated in real time.'),
      n(10, 'يمكن لمقدم الطلب تنزيل ملف تصريح الفعاليات المطلوب لوضع الطاولات من النظام (يجب أن يكون مصادَقاً عليه للوصول إلى تصريح الفعاليات).', 'The applicant can download the events permit for placing tables from the system (authentication required).'),
      n(11, 'في حال رفض الطلب، يقوم النظام تلقائياً بتحديث مقدم الطلب بحالة الرفض والسبب المقدَّم من البلدية.', 'If rejected, the system automatically informs the applicant of the rejection and the reason given.'),
    ],
  },

  // 2 ─ تجديد تصريح قطع أو ثقب
  svc_125: {
    source: 'تجديد تصريح قطع أو ثقب.pdf',
    lanes: [A, S],
    nodes: [
      start('A'),
      t(1, 'A', 1, ...SELECT_SERVICE),
      t(2, 'A', 2, 'إدخال رقم تصريح عدم الممانعة للأعمال خارج حدود القطعة', 'Enter the NOC permit number for works outside the plot boundary'),
      t(3, 'S', 3, 'التحقق مما إذا كان مقدم الطلب مخوّلاً لاستخدام معلومات هذه الخدمة والوصول إليها', 'Check whether the applicant is authorised to use and access this information'),
      d('D1', 'S', 4, 'هل الإدخال مخوّل لمقدم الطلب؟', 'Is the applicant authorised for this entry?'),
      t(4, 'S', 5, 'إبلاغ مقدم الطلب بنجاح التحقق من التصريح', 'Notify the applicant that the permit was verified'),
      t(5, 'A', 6, 'تقديم البيانات المطلوبة', 'Provide the required data'),
      t(6, 'A', 7, 'إكمال الطلب - مراجعة الطلب', 'Complete and review the request'),
      t(7, 'A', 8, ...SUBMIT),
      t(8, 'S', 8, 'إنشاء مهمة لمراجعة الحالة وتعيينها تلقائياً للموظف المختص', 'Create a case review task and auto-assign it to the competent employee'),
      t('8a', 'S', 9, 'التحقق من صحة التغييرات المطلوبة من مقدم الطلب', 'Verify the changes requested by the applicant'),
      d('D2', 'S', 10, 'ما نوع الطلب؟', 'Request type?'),
      t(9, 'S', 11, 'تحديث / تجديد الطلب', 'Update / renew the request', 'top'),
      t(10, 'S', 11, 'إلغاء الطلب', 'Cancel the request', 'bottom'),
      t(11, 'A', 12, 'إشعار مقدم الطلب بنجاح التغييرات في التصريح', 'Notify the applicant that the permit changes succeeded'),
      end('A', 13),
    ],
    edges: [
      ...seq('start', 'n1', 'n2', 'n3', 'D1'),
      e('D1', 'n4', YES), e('D1', 'n2', NO, true),
      ...seq('n4', 'n5', 'n6', 'n7', 'n8', 'n8a', 'D2'),
      e('D2', 'n9', ['تحديث / تجديد', 'Update / renew']), e('D2', 'n10', ['إلغاء', 'Cancel']),
      e('n9', 'n11'), e('n11', 'end'), e('n10', 'end'),
    ],
    notes: [
      n(1, 'يشترط أن يكون مقدم الطلب مصادَقاً عليه كاستشاري مرخّص أو مقاول مرخّص للاستفادة من هذه الخدمة.', 'The applicant must be authenticated as a licensed consultant or contractor.'),
      n(2, 'يجب أن يكون النظام قابلاً للتهيئة للسماح بالوصول إلى بيانات الخرائط بناءً على صلاحيات مستخدمين محددين؛ فمثلاً يمكن لمقدمي طلبات تصاريح البناء الوصول إلى الخرائط المهيأة دون مراجعة، وكذلك مقدمو الطلبات كثيرو الاستخدام كموظفي الصحة العامة، متى كانت البيانات مهيأة للإتاحة دون مراجعة من موظف الإدارة.', 'The system must be configurable to grant map-data access by user permissions, e.g. building-permit applicants and frequent users (such as public-health staff) can access prepared map datasets without a review by municipal staff.'),
      n(3, 'عند إدخال هذا الرقم، يجب أن يكون النظام قادراً على استخراج جميع المعلومات المخزّنة لتصريح عدم الممانعة للأعمال خارج حدود القطعة، والتعرّف على بيانات الموقع اللازمة لتعديلات هذا التصريح والإضافات عليه.', 'Once the number is entered, the system retrieves all stored NOC data and the site data needed to amend the permit.'),
      n(4, 'يتحقق النظام تلقائياً من مدخلات المستخدم الخاصة برقم تصريح عدم الممانعة للتأكد من أن المستخدم مخوَّل للوصول إلى هذه المعلومات.', 'The system checks the entered NOC number to confirm the user is authorised to access it.'),
      n(5, 'بناءً على المستخدم والبيانات المطلوبة المختارة، يحدد النظام تلقائياً ما إذا كان مقدم الطلب بحاجة لتقديم مستندات إضافية؛ فإذا كان مقدم الطلب شركة أو مؤسسة يتوجّب عليه تقديم مستندات داعمة مثل السجل التجاري، أو مستندات الوكالة في حالة الورثة.', 'Depending on the user and selected data, the system decides whether extra documents are needed, e.g. a commercial registration for companies or a power of attorney for heirs.'),
      n(6, 'يجب أن يوفّر النظام لمقدم الطلب معلومات حول نوع المستندات الداعمة أو المبرّرة المطلوبة.', 'The system tells the applicant which supporting documents are required.'),
      n(7, 'اختيار نوع التعديل المطلوب: تجديد، إلغاء، تعديل البيانات (الملكية وغيرها). بناءً على نوع التعديل يقدّم المستخدم التفاصيل والمستندات حسب الاقتضاء: نموذج الموافقة الموقَّع من جميع الأطراف المعنية، صور للموقع من الجهات الأربع، السجل التجاري للشركات / الوكالة في حالة الورثة (G2B).', 'Choose the change type: renewal, cancellation or data amendment (ownership etc.), then provide the matching documents: consent form signed by all parties, site photos from four sides, CR / power of attorney for heirs (G2B).'),
      n(8, 'تقديم ملاحظات العميل.', 'Customer feedback.'),
      n(9, 'تتم معالجة الطلب لاحقاً وفق مسار العمل الخاص بطلب توصيل المرافق.', 'The request is then processed through the utility-connection workflow.'),
    ],
  },

  // 3 ─ تحصيل مبالغ التأمينات وإعادتها
  svc_130: {
    source: 'تحصيل مبالغ التأمينات وإعادتها.pdf',
    lanes: [{ id: 'S', labelAr: 'محرك الأتمتة', labelEn: 'Automation engine', kind: 'system' }],
    nodes: [
      start('S'),
      t(1, 'S', 1, 'تحديد المبلغ بناءً على شهادة الإنجاز', 'Determine the amount from the completion certificate'),
      t(2, 'S', 2, 'معالجة طلب الاسترداد', 'Process the refund request'),
      t(3, 'S', 3, 'إشعار مقدم الطلب بنجاح عملية الاسترداد وإيصال الاسترداد', 'Notify the applicant of the successful refund and send the receipt'),
      end('S', 4),
    ],
    edges: seq('start', 'n1', 'n2', 'n3', 'end'),
    notes: [
      n(1, 'الشرط: يكون المستخدم مؤهلاً لاسترداد مبلغ التأمين المحتفظ به لدى البلدية؛ فبعد إصدار شهادة الإنجاز يظهر خيار "طلب استرداد" في لوحة تحكم المستخدم.', 'Condition: the user is eligible to recover the deposit held by the municipality; after the completion certificate is issued a "Request refund" option appears in their dashboard.'),
      n(2, 'يتم تحديد مبلغ الاسترداد الخاص بشهادة الإنجاز المطلوبة تلقائياً بناءً على المعطيات المُدخلة (مثل تفاصيل شهادة الإنجاز).', 'The refund amount is determined automatically from the entered data (e.g. completion certificate details).'),
      n(3, 'بمجرد تأكيد مقدم الطلب للمبلغ، يقوم النظام تلقائياً بإطلاق عملية الاسترداد.', 'Once the applicant confirms the amount, the system starts the refund automatically.'),
    ],
  },

  // 4 ─ ترخيص اللوحات الإرشادية
  svc_110: {
    source: 'ترخيص اللوحات الإرشادية.pdf',
    lanes: [A, S, staff('E', 'المهندس / المفتش', 'Engineer / Inspector'), staff('H', 'رئيس القسم / رئيس الإدارة', 'Head of Section / Department')],
    nodes: [
      start('A'),
      t(1, 'A', 1, ...SELECT_SERVICE),
      t(2, 'S', 2, 'التحقق تلقائياً من الموقع والتحقق من صحة بيانات الطلب', 'Auto-verify the location and validate the request data'),
      t(3, 'A', 3, 'إدخال التفاصيل وإكمال نموذج طلب الخدمة', 'Enter the details and complete the request form'),
      t(5, 'A', 5, ...SUBMIT),
      t(6, 'S', 6, ...CREATE_TASK),
      t(7, 'E', 7, ...RECEIVE_TASK),
      t(8, 'E', 8, 'مراجعة بيانات الطلب والخرائط', 'Review the request data and maps'),
      d('D1', 'E', 9, ...NEED_INFO),
      t(18, 'A', 10, 'استلام رسالة تطلب معلومات إضافية', 'Receive a message requesting more information'),
      t(19, 'A', 11, 'تقديم المعلومات الإضافية عبر بوابة الخدمة الإلكترونية', 'Provide the additional information via the e-portal'),
      d('DV', 'S', 12, 'هل الزيارة الميدانية مطلوبة؟', 'Is a site visit required?'),
      h('SN2a', 'E', 13, 'زيارة/معاينة ميدانية', 'Site visit / inspection'),
      t(9, 'E', 14, 'تعبئة تقرير الزيارة الميدانية وتقديمه للمراجعة', 'Complete the site visit report and submit it for review'),
      t(10, 'H', 15, ...RECEIVE_TASK),
      t(11, 'H', 16, 'مراجعة ملاحظات المهندس وتقرير الزيارة وطلب الخدمة', "Review the engineer's notes, visit report and request"),
      d('DA', 'H', 17, ...IS_APPROVED),
      t(12, 'S', 18, 'إصدار نموذج الموافقة الموقّع رقمياً', 'Issue the digitally signed approval form'),
      t(16, 'A', 19, 'استلام رسالة/بريد إلكتروني باكتمال الطلب', 'Receive a message/email that the request is complete'),
      t(13, 'A', 20, 'تنفيذ العمل وتحديث النظام', 'Carry out the work and update the system'),
      h('SN2b', 'E', 21, 'زيارة/معاينة ميدانية (تحقق من المطابقة)', 'Site visit (compliance check)'),
      d('DC', 'E', 22, 'هل تم تأكيد المطابقة؟', 'Compliance confirmed?'),
      end('A', 23),
      t(17, 'A', 24, 'استلام رسالة/بريد إلكتروني برفض طلب الخدمة', 'Receive a message/email rejecting the request'),
    ],
    edges: [
      ...seq('start', 'n1', 'n2', 'n3', 'n5', 'n6', 'n7', 'n8', 'D1'),
      e('D1', 'n18', YES), e('n18', 'n19'), e('n19', 'n8', ['عودة', 'Back'], true),
      e('D1', 'DV', NO), e('DV', 'SN2a', YES), e('SN2a', 'n9'), e('DV', 'n9', NO),
      ...seq('n9', 'n10', 'n11', 'DA'),
      e('DA', 'n12', APPROVE), ...seq('n12', 'n16', 'n13', 'SN2b', 'DC'),
      e('DC', 'end', YES), e('DC', 'n13', ['لا، عدم مطابقة', 'No, non-compliant']),
      e('DA', 'n17', REJECT), e('n17', 'end'),
    ],
    notes: [
      n(1, 'يجب أن يكون مقدم الطلب مستشاراً مرخّصاً/مقاولاً مرخّصاً (أو جهة حكومية) للاستفادة من هذه الخدمة. يمكن لمقدم الطلب إضافة تعليقات ومرفقات مثل: المخطط المساحي والحدود، صورة جوية توضح مواقع اللوحات، مخطط يوضح تصميم وأبعاد اللوحات.', 'The applicant must be a licensed consultant/contractor (or a government entity). They may add comments and attachments such as the survey plan, an aerial photo of the sign locations and a sign design/dimensions drawing.'),
      n(2, 'بناءً على تفاصيل قطعة الأرض (رقم القطعة) أو العقار، يقوم النظام تلقائياً بجلب المستندات من خزانة الأرض أو التصاريح السابقة المرتبطة بالعقار وإتاحتها في الخزانة المؤقتة للمشروع. عند توفر خدمات GIS يتحقق النظام تلقائياً من متطلبات شهادات عدم الممانعة من مختلف الجهات.', 'From the plot/property details the system fetches documents from the land vault or earlier permits into the project vault; with GIS it also checks the NOC requirements from the various authorities.'),
      n(3, 'يجب أن يكون بمقدور النظام إبلاغ المستخدم المعني تلقائياً بالمهام المعلّقة أو الرسائل الواردة عبر قنوات متعددة (رسائل داخل النظام، بريد إلكتروني، رسائل نصية) مع إمكانية تهيئة القنوات. تُحدَّث حالة الطلب لتعكس المعلومات المعلّقة من مقدم الطلب.', 'The system notifies users of pending tasks or messages over configurable channels (in-app, email, SMS). The request status reflects information pending from the applicant.'),
      n(4, 'يجب أن يكون بمقدور النظام تعيين المهمة وجدولة الزيارة الميدانية حسب توفر الموظفين، وإشعار مقدم الطلب تلقائياً، وصياغة تقرير الزيارة تلقائياً.', 'The system assigns the task and schedules the site visit by staff availability, notifies the applicant and drafts the visit report automatically.'),
      n(5, 'يحتوي التقرير على مراجعة الموقع، وأهم الملاحظات من الزيارة، وأي مشاهدات، ومعلومات أخرى محددة مسبقاً وفق النموذج المعتمد.', 'The report covers the site review, key findings, observations and other predefined information per the approved template.'),
      n(6, 'يقوم رئيس القسم/الإدارة بمراجعة الطلب والموقع وطلب الخدمة والملاحظات من الموظفين البلديين والمرفقات الخاصة بطلب الخدمة قبل الموافقة.', 'The head of section/department reviews the request, site, staff notes and attachments before approving.'),
      n(7, 'يجب أن يكون بمقدور النظام تحديث بيانات البنية التحتية والشوارع ضمن المستودع الداخلي، وتهيئة تعيين المهام للإدارة المعنية.', 'The system updates infrastructure and street data in the internal repository and routes tasks to the relevant department.'),
      n(8, 'في حال عدم المطابقة، يُطلب من مقدم الطلب تصحيح الحالة وتقديم الأدلة؛ ويمكن للموظف تجاوز الزيارة الميدانية الثانية إذا قدّم مقدم الطلب أدلة التصحيح.', 'If non-compliant, the applicant must correct it and provide evidence; the employee may skip the second visit if evidence is provided.'),
    ],
  },
  // 5 ─ ترقيم المنازل
  svc_108: {
    source: 'ترقيم المنازل.pdf',
    lanes: [A, S, staff('G', 'منسّق نظم المعلومات الجغرافية (GIS)', 'GIS Coordinator')],
    nodes: [
      start('A'),
      t(1, 'A', 1, 'طلب ترقيم المبنى وتحديد عنوانه', 'Request building numbering and address'),
      t(2, 'A', 2, 'تقديم رقم شهادة الإنجاز', 'Provide the completion certificate number'),
      t(3, 'A', 3, 'تقديم تفاصيل نوع المبنى واسم المبنى وغيرها', 'Provide the building type, name and other details'),
      t(4, 'S', 4, 'التحقق من تفاصيل المبنى والتأكد منها', 'Verify and confirm the building details'),
      t(5, 'A', 5, 'إكمال الطلب - مراجعة الطلب', 'Complete and review the request'),
      t(6, 'A', 6, 'تقديم ملاحظات العميل', 'Submit customer feedback'),
      t(7, 'S', 7, 'إنشاء مهمة لمراجعة الطلب وتعيينها تلقائياً لمنسّق GIS للبلدية المعنية', "Create a review task and auto-assign it to the municipality's GIS coordinator"),
      t(8, 'G', 8, 'استلام إشعار بالمهمة', 'Receive the task notification'),
      t(9, 'G', 9, 'التحقق من تفاصيل المبنى ومراجعة المستندات من خزانة المشروع', 'Verify the building details and review documents from the project vault'),
      t(10, 'G', 10, 'تقديم رقم المبنى والعنوان', 'Provide the building number and address'),
      d('D1', 'G', 11, 'هل الطلب مؤهل والمستندات موثّقة؟', 'Is the request eligible and are the documents verified?'),
      t(11, 'A', 12, 'استلام إشعار لتقديم تفاصيل أو مستندات إضافية', 'Receive a notice to provide additional details or documents'),
      t(14, 'A', 13, 'استلام إشعار بشهادة ترقيم المبنى وعنوانه', 'Receive the building number and address certificate'),
      end('A', 14),
      t(15, 'S', 15, 'تحديث مقدم الطلب بحالة الرفض', 'Update the applicant with the rejection status'),
    ],
    edges: [
      ...seq('start', 'n1', 'n2', 'n3', 'n4', 'n5', 'n6', 'n7', 'n8', 'n9', 'n10', 'D1'),
      e('D1', 'n14', APPROVE), e('n14', 'end'),
      e('D1', 'n11', ['توضيح إضافي', 'More clarification']), e('n11', 'n5', ['عودة', 'Back'], true),
      e('D1', 'n15', REJECT), e('n15', 'end'),
    ],
    notes: [
      n(1, 'يجب أن يكون مقدم الطلب فرداً بصفته مالكاً للاستفادة من خدمة ترقيم المبنى وتحديد عنوانه. لن يتمكن من التقديم إلا بعد اكتمال الإنشاء.', 'The applicant must be an individual owner; applications are possible only after construction is complete.'),
      n(2, 'سيتمكن مقدم الطلب من اختيار الأرض عبر رقم القطعة أو عبر خدمات الخرائط الإلكترونية (عند توفرها).', 'The applicant selects the land by plot number or via e-map services (when available).'),
      n(3, 'يتحقق النظام تلقائياً من اسم المبنى مقابل قاعدة البيانات الحالية.', 'The system checks the building name against the existing database.'),
      n(4, 'يحتاج منسّق نظم المعلومات الجغرافية إلى التحقق من المعلومات والمستندات المقدَّمة من المستفيد وإصدار رمز الترقيم وعنوان المبنى وفق منهجية الترقيم والتوصيف المعتمدة.', "The GIS coordinator verifies the beneficiary's information and documents and issues the number and address per the approved methodology."),
      n(5, 'يُنشئ النظام رمز ترقيم المبنى وعنوانه وفق منهجية الترقيم والتوصيف المعتمدة.', 'The system generates the building number and address per the approved methodology.'),
      n(6, 'بمجرد رفض المستخدم للطلب، يقوم النظام تلقائياً بتحديث مقدم الطلب بحالة الرفض والسبب المقدَّم من البلدية.', 'Once rejected, the system informs the applicant of the rejection and the reason.'),
      n(7, 'يمكن لمقدم الطلب الاطلاع على التعليق أو طلب التوضيح من الموظف البلدي وتقديم التفاصيل/المستندات المطلوبة.', "The applicant can view the employee's comment or clarification request and provide what is needed."),
      n(8, 'يمكن لمقدم الطلب الاطلاع على الخزانة والمشروع الخاص به من بوابة النظام البلدي الموحد.', 'The applicant can view their vault and project on the unified municipal portal.'),
    ],
  },

  // 6 ─ تسمية مبنى
  svc_109: {
    source: 'تسمية مبنى.pdf',
    lanes: [A, S, staff('E', 'المهندس / المفتش', 'Engineer / Inspector'), staff('H', 'رئيس القسم / رئيس الوحدة', 'Head of Section / Unit')],
    nodes: [
      start('A'),
      t(1, 'A', 1, 'طلب ترخيص تسمية المبنى', 'Request a building naming license'),
      t(2, 'A', 2, 'تقديم رقم شهادة الإنجاز', 'Provide the completion certificate number'),
      t(3, 'A', 3, 'تقديم تفاصيل نوع المبنى واسم المبنى وغيرها', 'Provide the building type, name and other details'),
      t(4, 'S', 4, 'التحقق من اسم المبنى المطلوب', 'Check the requested building name'),
      t(5, 'A', 5, 'إكمال الطلب - مراجعة الطلب', 'Complete and review the request'),
      t(6, 'A', 6, 'تقديم ملاحظات العميل - تقديم الطلب', 'Submit customer feedback and the request'),
      t(7, 'S', 7, 'إنشاء مهمة لمراجعة الطلب وتعيينها تلقائياً لمنسّق البلدية', 'Create a review task and auto-assign it to the municipality coordinator'),
      t(8, 'E', 8, 'استلام إشعار بالمهمة', 'Receive the task notification'),
      t(9, 'E', 9, 'التحقق من اسم المبنى المقترح من المالك ومراجعة المستندات من خزانة المشروع', "Verify the owner's proposed name and review documents from the project vault"),
      d('D1', 'E', 10, 'هل الطلب مؤهل والمستندات موثّقة؟', 'Is the request eligible and are the documents verified?'),
      t(10, 'A', 11, 'استلام إشعار لتقديم تفاصيل أو مستندات إضافية', 'Receive a notice to provide additional details or documents'),
      t(11, 'H', 12, 'التحقق من المستندات في الخزانة المؤقتة للمشروع ومدى أهلية الخدمات وملاحظات المنسّق', "Check the project vault documents, service eligibility and the coordinator's notes"),
      d('D2', 'H', 13, 'هل الطلب مؤهل والمستندات موثّقة؟', 'Is the request eligible and are the documents verified?'),
      t(13, 'A', 14, 'استلام إشعار عن ترخيص تسمية المبنى', 'Receive the building naming license'),
      end('A', 15),
      t(14, 'S', 16, 'تحديث مقدم الطلب بحالة الرفض', 'Update the applicant with the rejection status'),
    ],
    edges: [
      ...seq('start', 'n1', 'n2', 'n3', 'n4', 'n5', 'n6', 'n7', 'n8', 'n9', 'D1'),
      e('D1', 'n11', ['مكتمل', 'Complete']), e('D1', 'n10', ['توضيح إضافي', 'More clarification']),
      e('n10', 'n5', ['عودة', 'Back'], true),
      e('n11', 'D2'), e('D2', 'n13', APPROVE), e('n13', 'end'),
      e('D2', 'n10', ['توضيح إضافي', 'More clarification'], true),
      e('D2', 'n14', REJECT), e('n14', 'end'),
    ],
    notes: [
      n(1, 'يجب أن يكون مقدم الطلب فرداً بصفته مالكاً للاستفادة من خدمة تسمية المبنى. لن يتمكن من تقديم طلب ترخيص التسمية إلا بعد اكتمال الإنشاء.', 'The applicant must be an individual owner; the naming license can be requested only after construction is complete.'),
      n(2, 'سيتمكن مقدم الطلب من اختيار الأرض عبر رقم القطعة أو عبر خدمات الخرائط الإلكترونية (عند توفرها).', 'The applicant selects the land by plot number or via e-map services (when available).'),
      n(3, 'سيقوم مقدم الطلب بتقديم تفاصيل اسم المبنى المطلوب، بينما تُجلب تفاصيل نوع المبنى والتفاصيل الأخرى تلقائياً من تفاصيل المشروع.', 'The applicant provides the requested name; building type and other details are pulled from the project automatically.'),
      n(4, 'يتحقق النظام تلقائياً من اسم المبنى مقابل قاعدة البيانات الحالية؛ فإذا كان الاسم مستخدَماً من قِبل مبنى آخر، يتوجّب على المستخدم تغيير اسم المبنى.', 'The system checks the name against the database; if another building uses it, the user must change it.'),
      n(5, 'يحتاج منسّق البلدية إلى التحقق من المعلومات والمستندات المقدَّمة من المستفيد مقارنةً بنوع المشروع المطلوب.', "The municipal coordinator verifies the beneficiary's information and documents against the project type."),
      n(6, 'يمكن لرئيس القسم التحقق من المعلومات والمستندات المشتركة من المستفيد وطلب أي معلومات إضافية عند الحاجة.', 'The head of section can verify the shared information and request more if needed.'),
      n(7, 'يمكن لمقدم الطلب الاطلاع على التعليق أو طلب التوضيح من الموظف البلدي وتقديم التفاصيل/المستندات المطلوبة.', "The applicant can view the employee's comment or clarification request and provide what is needed."),
      n(8, 'بمجرد رفض رئيس القسم للطلب، يقوم النظام تلقائياً بتحديث مقدم الطلب بحالة الرفض والسبب المقدَّم من البلدية.', 'Once the head of section rejects, the system informs the applicant of the rejection and reason.'),
      n(9, 'يمكن لمقدم الطلب الاطلاع على الخزانة والمشروع الخاص به من بوابة النظام البلدي الموحد.', 'The applicant can view their vault and project on the unified municipal portal.'),
    ],
  },

  // 7 ─ تصاريح جديدة لناقلات صهاريج مياه الصرف الصحي
  svc_102: {
    source: 'تصاريح جديدة لناقلات صهاريج مياه الصرف الصحي.pdf',
    lanes: [A, S, staff('C', 'منسّق البلدية - إدارة الشؤون الفنية', 'Municipality Coordinator - Technical Affairs'), staff('H', 'رئيس القسم / رئيس الوحدة', 'Head of Section / Unit')],
    nodes: [
      start('A'),
      t(1, 'A', 1, ...SELECT_SERVICE),
      t(2, 'S', 2, 'التحقق تلقائياً من أي معلومات مرتبطة بالموقع والتحقق من صحة ملف المشروع والمستندات', 'Auto-verify site information and validate the project file and documents'),
      t(3, 'A', 3, 'تعبئة ومراجعة الطلب', 'Fill in and review the request'),
      t(4, 'A', 4, 'تقديم ملاحظات العميل وتقديم الطلب', 'Submit customer feedback and the request'),
      t(5, 'S', 5, ...CREATE_TASK),
      t(6, 'C', 6, ...RECEIVE_TASK),
      t(7, 'C', 7, 'مراجعة جميع الوثائق والطلب ذات الصلة', 'Review all related documents and the request'),
      d('D1', 'C', 8, ...NEED_INFO),
      t(8, 'A', 9, 'استلام إشعار لتقديم تفاصيل أو مستندات إضافية', 'Receive a notice to provide additional details or documents'),
      t(9, 'H', 10, ...RECEIVE_TASK),
      t(10, 'H', 11, 'مراجعة ملاحظات المراجع وطلب الخدمة', "Review the reviewer's notes and the service request"),
      d('D2', 'H', 12, ...IS_APPROVED),
      t(12, 'S', 13, 'إصدار ترخيص النشاط البلدي الموقّع رقمياً', 'Issue the digitally signed municipal activity license'),
      t(13, 'A', 14, 'استلام رسالة/بريد إلكتروني بالترخيص الرقمي للنشاط البلدي', 'Receive the digital municipal activity license by message/email'),
      end('A', 15),
      t(14, 'S', 16, 'تحديث مقدم الطلب بحالة الرفض', 'Update the applicant with the rejection status'),
    ],
    edges: [
      ...seq('start', 'n1', 'n2', 'n3', 'n4', 'n5', 'n6', 'n7', 'D1'),
      e('D1', 'n8', YES), e('n8', 'n3', ['عودة', 'Back'], true),
      e('D1', 'n9', NO), ...seq('n9', 'n10', 'D2'),
      e('D2', 'n12', APPROVE), ...seq('n12', 'n13', 'end'),
      e('D2', 'n14', REJECT), e('n14', 'end'),
    ],
    notes: [
      n(1, 'يقوم مقدم الطلب بتعبئة الطلب بالمتطلبات اللازمة لكل نشاط.', 'The applicant fills in the requirements for each activity.'),
      n(2, 'يقوم النظام بتعيين المهمة لموظف بناءً على عبء العمل والموقع الجغرافي، ويفوّض المهمة في حال غياب الموظف.', 'The system assigns the task by workload and location and delegates it when the employee is absent.'),
      n(3, 'إذا احتاج موظف البلدية معلومات إضافية، يمكنه استخدام أدوات المراسلة داخل النظام و/أو إنشاء مهمة لمقدم الطلب لتقديمها.', 'If more information is needed, the employee can message the applicant and/or create a task for them.'),
      n(4, 'يقوم رئيس القسم أو المدير العام للإدارة بمراجعة الطلب وطلب الخدمة والملاحظات من الموظفين البلديين.', "The head of section or director general reviews the request and the employees' notes."),
      n(5, 'يُنشئ النظام تلقائياً رمز الاستجابة السريعة (QR) للترخيص الموقّع رقمياً استناداً إلى تفاصيل الطلب، وتُحدَّث قواعد البيانات آنياً.', 'The system generates a QR code for the signed license and updates databases in real time.'),
      n(6, 'يمكن لمقدم الطلب تنزيل ملف ترخيص النشاط البلدي من النظام (يجب أن يكون مصادَقاً عليه للوصول لترخيص النشاط البلدي).', 'The applicant can download the municipal activity license (authentication required).'),
      n(7, 'بمجرد رفض رئيس القسم للطلب، يقوم النظام تلقائياً بتحديث مقدم الطلب بحالة الرفض والسبب المقدَّم من البلدية.', 'Once the head of section rejects, the system informs the applicant of the rejection and reason.'),
      n(8, 'يمكن لمقدم الطلب الاطلاع على التعليق أو طلب التوضيح من الموظف البلدي وتقديم التفاصيل/المستندات المطلوبة حسب الحاجة.', "The applicant can view the employee's comment or clarification request and provide what is needed."),
    ],
  },

  // 8 ─ ختم تذاكر محلات التسلية ودور السينما والحفلات والتصديق عليها
  svc_131: {
    source: 'ختم تذاكر محلات التسلية ودور السينما والحفلات والتصديق عليها.pdf',
    lanes: [A, S, staff('E', 'الموظف المختص', 'Competent Employee'), staff('H', 'رئيس القسم / رئيس الإدارة', 'Head of Section / Department')],
    nodes: [
      start('A'),
      t(1, 'A', 1, ...SELECT_SERVICE),
      t(2, 'S', 2, 'التحقق تلقائياً من بيانات المنشأة المتعلقة بوزارة التجارة والمستندات المطلوبة', 'Auto-verify the establishment data with the Ministry of Commerce and the required documents'),
      t(3, 'A', 3, 'تعبئة ومراجعة الطلب', 'Fill in and review the request'),
      t(4, 'A', 4, 'تقديم ملاحظات العميل - تقديم الطلب', 'Submit customer feedback and the request'),
      t(5, 'S', 4, ...CREATE_TASK),
      t(6, 'E', 4, ...RECEIVE_TASK),
      t(7, 'E', 5, 'مراجعة جميع الوثائق والطلب ذات الصلة', 'Review all related documents and the request'),
      c('A1b', 'E', 5, 'A1', 'top'),
      d('D1', 'E', 6, ...NEED_INFO),
      t(8, 'A', 6, 'استلام إشعار لتقديم تفاصيل أو مستندات إضافية حسب متطلبات المشروع', 'Receive a notice to provide additional details or documents as the project requires'),
      c('A1', 'A', 6.8, 'A1'),
      t(9, 'H', 6, ...RECEIVE_TASK),
      t(10, 'H', 7, 'مراجعة ملاحظات مراجع الفعاليات وطلب الخدمة', "Review the reviewer's notes and the service request"),
      d('D2', 'H', 8, ...IS_APPROVED),
      h('PAY', 'S', 8, 'دفع الغرامات والضرائب والرسوم البلدية', 'Pay municipal fines, taxes and fees'),
      t(12, 'S', 9, 'إصدار الختم الرقمي للتذاكر', 'Issue the digital ticket stamp'),
      t(13, 'A', 9, 'استلام رسالة/بريد إلكتروني بشأن الختم الرقمي', 'Receive a message/email about the digital stamp'),
      t(14, 'S', 10, 'تحديث مقدم الطلب بحالة الرفض', 'Update the applicant with the rejection status'),
      end('A', 10),
    ],
    edges: [
      ...seq('start', 'n1', 'n2', 'n3', 'n4', 'n5', 'n6', 'n7', 'D1'),
      e('D1', 'n8', YES), e('n8', 'A1'), e('A1b', 'n7'),
      e('D1', 'n9', NO), ...seq('n9', 'n10', 'D2'),
      e('D2', 'PAY', APPROVE), ...seq('PAY', 'n12', 'n13', 'end'),
      e('D2', 'n14', REJECT), e('n14', 'end'),
      e('D2', 'n6', ['توضيح أو معلومات إضافية', 'Clarification / more information'], true),
    ],
    notes: [
      n(1, 'يشترط أن يكون مقدم الطلب مصادَقاً عليه كمنشأة تجارية مسجّلة للاستفادة من هذه الخدمة في إنشاء الطلب.', 'The applicant must be authenticated as a registered commercial establishment.'),
      n(2, 'يقوم مقدم الطلب بتعبئة الطلب بجميع التفاصيل المتعلقة بالفعالية التي تُصدر لها التذاكر، مثل موافقة الجهة المعنية وغيرها.', "The applicant provides all details of the ticketed event, such as the competent authority's approval."),
      n(3, 'يقوم النظام بتعيين المهمة لموظف بناءً على عبء العمل والموقع الجغرافي المقابل، كما يفوّض المهمة تلقائياً في حال غياب الموظف.', 'The system assigns the task by workload and location and delegates it when the employee is absent.'),
      n(4, 'إذا احتاج موظف البلدية إلى معلومات أو مستندات إضافية، يمكنه استخدام أدوات المراسلة داخل النظام و/أو إنشاء مهمة لمقدم الطلب لتقديم المعلومات أو المستندات الإضافية.', 'If more information is needed, the employee can message the applicant and/or create a task for them.'),
      n(5, 'يمكن لمقدم الطلب الاطلاع على التعليق أو طلب التوضيح من الموظف البلدي وتقديم التفاصيل / المستندات المطلوبة حسب الاقتضاء.', "The applicant can view the employee's comment or clarification request and provide what is needed."),
      n(6, 'يراجع رئيس القسم أو المدير العام للدائرة الطلب وطلب الخدمة وملاحظات موظفي البلدية.', "The head of section or director general reviews the request and the employees' notes."),
      n(7, 'يُنشئ النظام تلقائياً رمز الاستجابة السريعة (QR) للختم الرقمي لتذاكر الفعاليات.', 'The system generates a QR code for the digital event-ticket stamp.'),
      n(8, 'يمكن لمقدم الطلب تنزيل الختم الرقمي للتذاكر المطلوب من النظام (يجب أن يكون مصادَقاً عليه للوصول إلى الختم).', 'The applicant can download the digital ticket stamp (authentication required).'),
      n(9, 'في حال رفض الطلب، يقوم النظام تلقائياً بتحديث مقدم الطلب بحالة الرفض والسبب المقدَّم من البلدية.', 'If rejected, the system informs the applicant of the rejection and the reason.'),
    ],
  },

  // 9 ─ دفع الغرامات والضرائب والرسوم البلدية
  svc_129: {
    source: 'دفع الغرامات والضرائب والرسوم البلدية.pdf',
    lanes: [A, { id: 'M', labelAr: 'محرك الأتمتة', labelEn: 'Automation engine', kind: 'system' }],
    nodes: [
      start('A'),
      t(1, 'M', 1, 'تحديد الدفعة وإنشاء مهمة دفع لمقدم الطلب', 'Determine the payment and create a payment task for the applicant'),
      t(2, 'A', 2, 'استلام المهمة والرسالة وتنفيذ الدفع في النظام', 'Receive the task and message and pay in the system'),
      d('D1', 'M', 3, 'التحقق من صحة الدفع؟', 'Payment valid?'),
      t(3, 'M', 4, 'تحديث سجل المدفوعات وإصدار إيصال الدفع', 'Update the payment record and issue the receipt'),
      t(4, 'A', 5, 'إشعار مقدم الطلب بنجاح الدفع واستلام إيصال الدفع', 'Notify the applicant of the successful payment and the receipt'),
      end('A', 6),
    ],
    edges: [
      ...seq('start', 'n1', 'n2', 'D1'),
      e('D1', 'n3', ['نجاح', 'Success']), e('D1', 'n1', ['فشل', 'Failed'], true),
      ...seq('n3', 'n4', 'end'),
    ],
    notes: [
      n(1, 'يشترط أن يكون مقدم الطلب مصادَقاً عليه كمنشأة تجارية مسجّلة. في حال دفع الغرامات أو الضرائب أو المستحقات يجب تحديد المبلغ من السجل ذي الصلة قبل بدء الإجراء. يمكن اختيار واحد أو أكثر من: الغرامات (المخالفات الصحية، مواقف السيارات، الحوادث، الأعمال المؤثرة على القطاع البلدي كالطرق والإنارة والمحاصيل)، الضرائب البلدية (الفنون ومراكز الترفيه ودور السينما)، والرسوم البلدية (الفنادق والمطاعم وعقود الاستثمار). يمكن تفعيل الخدمة تلقائياً بعد تقديم الطلب والتحقق منه، ويُحدَّد المبلغ تلقائياً من معطيات الطلب مع إمكانية تحديد السعر يدوياً عند الحاجة.', 'The applicant must be a registered establishment. For fines, taxes or dues the amount comes from the related record. Choose one or more of: fines (health violations, parking, accidents, damage to roads/lighting/crops), municipal taxes (arts, entertainment, cinemas) and municipal fees (hotels, restaurants, investment contracts). The service can also start automatically after a request is verified; the amount is computed from the request data and can be set manually when needed.'),
      n(2, 'يقوم مقدم الطلب بسداد كامل الرسوم المطلوبة بناءً على الخدمة المطلوبة ومعطياتها عبر بوابة الدفع الإلكتروني.', 'The applicant pays the full fees through the e-payment gateway.'),
      n(3, 'بمجرد تأكيد الدفع يتم تحديث سجل المدفوعات وتطبيق الدفع على الطلب لمواصلة الإجراء، ويجب أن يتيح النظام حفظ رصيد في المحفظة الإلكترونية ضمن الخزانة الرقمية والخصم منه عند الحاجة.', 'Once confirmed, the payment record is updated and applied to the request; the system should support an e-wallet balance in the digital vault.'),
      n(4, 'يستلم مقدم الطلب إشعاراً بنجاح عملية الدفع وإيصال الدفع القابل للتحميل، كما تُشعَر الإدارة المعنية في البلدية.', 'The applicant receives a success notice and a downloadable receipt; the relevant department is notified.'),
    ],
  },
  // 10 ─ طلب التصديق على مخططات إنارة الطرق والمجمعات
  svc_115: {
    source: 'طلب التصديق على مخططات إنارة الطرق والمجمعات.pdf',
    lanes: [A, S, staff('E', 'المهندس / المفتش', 'Engineer / Inspector'), staff('H', 'رئيس القسم / رئيس الإدارة', 'Head of Section / Department')],
    nodes: [
      start('A'),
      t(1, 'A', 1, ...SELECT_SERVICE),
      t(2, 'S', 2, 'التحقق تلقائياً من الموقع والتحقق من صحة بيانات الطلب', 'Auto-verify the location and validate the request data'),
      t(3, 'A', 3, 'إدخال التفاصيل وإكمال نموذج طلب الخدمة', 'Enter the details and complete the request form'),
      t(4, 'A', 4, 'تعبئة استبيان الرضا', 'Fill in the satisfaction survey'),
      t(5, 'A', 5, ...SUBMIT),
      t(6, 'S', 6, ...CREATE_TASK),
      t(7, 'E', 7, ...RECEIVE_TASK),
      t(8, 'E', 8, 'مراجعة بيانات الطلب والخرائط', 'Review the request data and maps'),
      d('D1', 'E', 9, ...NEED_INFO),
      t(16, 'A', 10, 'استلام رسالة تطلب معلومات إضافية', 'Receive a message requesting more information'),
      t(17, 'A', 11, 'تقديم المعلومات الإضافية عبر بوابة الخدمة الإلكترونية', 'Provide the additional information via the e-portal'),
      h('SN2a', 'E', 12, 'زيارة/معاينة ميدانية', 'Site visit / inspection'),
      t(9, 'E', 13, 'تعبئة تقرير الزيارة الميدانية وتقديمه للمراجعة', 'Complete the site visit report and submit it for review'),
      t(10, 'H', 14, ...RECEIVE_TASK),
      t(11, 'H', 15, 'مراجعة ملاحظات المهندس وتقرير الزيارة وطلب الخدمة', "Review the engineer's notes, visit report and request"),
      d('DA', 'H', 16, ...IS_APPROVED),
      t(12, 'S', 17, 'إصدار نموذج الموافقة الموقّع رقمياً', 'Issue the digitally signed approval form'),
      t(14, 'A', 18, 'استلام رسالة/بريد إلكتروني باكتمال الطلب', 'Receive a message/email that the request is complete'),
      t(13, 'A', 19, 'تنفيذ العمل وتحديث النظام', 'Carry out the work and update the system'),
      h('SN2b', 'E', 20, 'زيارة/معاينة ميدانية (تحقق من المطابقة)', 'Site visit (compliance check)'),
      d('DC', 'E', 21, 'هل تم تأكيد المطابقة؟', 'Compliance confirmed?'),
      end('A', 22),
      t(15, 'A', 23, 'استلام رسالة/بريد إلكتروني برفض طلب الخدمة', 'Receive a message/email rejecting the request'),
    ],
    edges: [
      ...seq('start', 'n1', 'n2', 'n3', 'n4', 'n5', 'n6', 'n7', 'n8', 'D1'),
      e('D1', 'n16', YES), e('n16', 'n17'), e('n17', 'n8', ['عودة', 'Back'], true),
      e('D1', 'SN2a', NO), ...seq('SN2a', 'n9', 'n10', 'n11', 'DA'),
      e('DA', 'n12', APPROVE), ...seq('n12', 'n14', 'n13', 'SN2b', 'DC'),
      e('DC', 'end', YES), e('DC', 'n13', ['لا، عدم مطابقة', 'No, non-compliant']),
      e('DA', 'n15', REJECT), e('n15', 'end'),
    ],
    notes: [
      n(1, 'يجب أن يكون مقدم الطلب مستشاراً مرخّصاً/مقاولاً مرخّصاً (أو جهة حكومية) للاستفادة من هذه الخدمة. يمكن لمقدم الطلب تقديم تعليقات ومرفقات إضافية مثل: تفاصيل قطعة الأرض، تفاصيل الملكية، التفاصيل الشخصية، تفاصيل الشركة، تفاصيل التمثيل/الوكالة، إلخ.', 'The applicant must be a licensed consultant/contractor (or a government entity) and may add comments and attachments such as plot, ownership, personal, company and agency details.'),
      n(2, 'يجب أن تتوفر إمكانية عرض أو تقليل عرض الحقول المعبّأة مسبقاً لمقدم الطلب حول تفاصيل قطعة الأرض والملكية والتفاصيل الشخصية وتفاصيل الشركة والوكالة، والتي تُعبّأ وتُعرض بناءً على القطعة والخدمة المختارة.', 'Pre-filled plot, ownership, personal, company and agency fields can be shown or collapsed based on the selected plot and service.'),
      n(3, 'بناءً على تفاصيل قطعة الأرض أو العقار، يجلب النظام تلقائياً المستندات من خزانة الأرض أو التصاريح السابقة المرتبطة بالعقار إلى الخزانة المؤقتة للمشروع. عند توفر خدمات GIS يتحقق النظام تلقائياً من متطلبات شهادات عدم الممانعة.', 'From the plot/property the system pulls documents into the project vault; with GIS it checks the NOC requirements.'),
      n(4, 'يجب أن يكون بمقدور النظام تعيين المهمة وجدولة الزيارة الميدانية حسب توفر الموظفين، وإشعار مقدم الطلب تلقائياً، وصياغة تقرير الزيارة تلقائياً.', 'The system assigns the task and schedules the site visit by staff availability, notifies the applicant and drafts the visit report.'),
      n(5, 'يحتوي التقرير على مراجعة الموقع وأهم الملاحظات من الزيارة وأي مشاهدات ومعلومات أخرى محددة مسبقاً وفق النموذج المعتمد.', 'The report covers the site review, key findings, observations and predefined information per the approved template.'),
      n(6, 'يقوم رئيس القسم/الإدارة بمراجعة الطلب والموقع وطلب الخدمة والملاحظات من الموظفين البلديين والمرفقات الخاصة بطلب الخدمة قبل الموافقة.', 'The head of section/department reviews the request, site, staff notes and attachments before approving.'),
      n(7, 'يجب أن يكون بمقدور النظام تحديث بيانات البنية التحتية والشوارع ضمن المستودع الداخلي، وتهيئة تعيين المهام للإدارة المعنية.', 'The system updates infrastructure and street data and routes tasks to the relevant department.'),
      n(8, 'في حال عدم المطابقة، يُطلب من مقدم الطلب تصحيح الحالة وتقديم الأدلة؛ ويمكن للموظف تجاوز الزيارة الميدانية الثانية إذا قدّم مقدم الطلب أدلة التصحيح.', 'If non-compliant, the applicant must correct it and provide evidence; the employee may skip the second visit if evidence is provided.'),
    ],
  },

  // 11 ─ طلب الحصول على تصديق البلدية للرصف بالبلاط المتشابك أمام واجهات المنازل
  svc_107: {
    source: 'طلب الحصول على تصديق البلدية للرصف بالبلاط المتشابك أمام واجهات المنازل.pdf',
    lanes: [A, S, staff('E', 'المهندس / المفتش', 'Engineer / Inspector'), staff('H', 'رئيس القسم / رئيس الإدارة', 'Head of Section / Department')],
    nodes: [
      start('A'),
      t(1, 'A', 1, ...SELECT_SERVICE),
      t(2, 'S', 2, 'التحقق تلقائياً من الموقع والتحقق من صحة بيانات الطلب', 'Auto-verify the location and validate the request data'),
      t(3, 'A', 3, 'إدخال التفاصيل وإكمال نموذج طلب الخدمة', 'Enter the details and complete the request form'),
      t(4, 'A', 4, 'تعبئة استبيان الرضا', 'Fill in the satisfaction survey'),
      t(5, 'A', 5, ...SUBMIT),
      t(6, 'S', 5, ...CREATE_TASK),
      t(7, 'E', 5, ...RECEIVE_TASK),
      t(8, 'E', 6, 'مراجعة بيانات الطلب والخرائط', 'Review the request data and maps'),
      d('D1', 'E', 7, ...NEED_INFO),
      t(9, 'A', 7, 'استلام إشعار لتقديم تفاصيل أو مستندات إضافية حسب متطلبات المشروع', 'Receive a notice to provide additional details or documents as the project requires'),
      h('SN2', 'E', 8, 'زيارة/معاينة ميدانية', 'Site visit / inspection'),
      t(11, 'E', 9, 'تعبئة تقرير الزيارة الميدانية وتقديمه على البوابة للمراجعة', 'Complete the site visit report and submit it on the portal for review'),
      t(12, 'H', 9, ...RECEIVE_TASK),
      t(13, 'H', 10, 'مراجعة ملاحظات المهندس وتقرير الزيارة وطلب الخدمة', "Review the engineer's notes, visit report and request"),
      d('D2', 'H', 11, ...IS_APPROVED),
      h('PAY', 'A', 11, 'دفع الغرامات والضرائب والرسوم البلدية', 'Pay municipal fines, taxes and fees'),
      t(14, 'S', 12, 'إنشاء مهمة للإدارة / القسم المعني لتنفيذ الخدمة في الموقع المطلوب', 'Create a task for the relevant department to deliver the service on site'),
      t(15, 'E', 12, ...RECEIVE_TASK),
      t(16, 'E', 13, 'تقديم الخدمة في الموقع وتحديث الحالة إلى «مكتملة»', 'Deliver the service on site and set the status to "Completed"'),
      t(17, 'A', 13, 'استلام رسالة/بريد إلكتروني باكتمال الطلب', 'Receive a message/email that the request is complete'),
      end('A', 14, 'end'),
      t(18, 'A', 14, 'استلام رسالة/بريد إلكتروني برفض طلب الخدمة', 'Receive a message/email rejecting the request', 'bottom'),
    ],
    edges: [
      ...seq('start', 'n1', 'n2', 'n3', 'n4', 'n5', 'n6', 'n7', 'n8', 'D1'),
      e('D1', 'n9', YES), e('n9', 'n8'),
      e('D1', 'SN2', NO), ...seq('SN2', 'n11', 'n12', 'n13', 'D2'),
      e('D2', 'PAY', APPROVE), ...seq('PAY', 'n14', 'n15', 'n16', 'n17', 'end'),
      e('D2', 'n18', REJECT), e('n18', 'end'),
      e('D2', 'n7', ['توضيح أو معلومات إضافية', 'Clarification / more information'], true),
    ],
    notes: [
      n(1, 'يشترط أن يكون مقدم الطلب مصادَقاً عليه كاستشاري مرخّص / مقاول مرخّص (أو جهة حكومية) للاستفادة من هذه الخدمة.', 'The applicant must be authenticated as a licensed consultant/contractor (or a government entity).'),
      n(2, 'بناءً على تفاصيل قطعة الأرض (رقم القطعة) أو العقار، يجلب النظام تلقائياً المستندات من خزانة الأرض أو التصاريح السابقة المرتبطة بالعقار إلى الخزانة المؤقتة للمشروع. عند توفر خدمات GIS يمكن للنظام التحقق تلقائياً من متطلبات شهادات عدم الممانعة من مختلف جهات المرافق، وفي حال اشتراطها سيتم الحصول عليها من بوابة ETIMAD.', 'The system pulls plot/property documents into the project vault; with GIS it checks utility NOC requirements, obtained via the ETIMAD portal when required.'),
      n(3, 'يمكن لمقدم الطلب إضافة تعليقات وإرفاق مستندات داعمة عند الحاجة. ويجب أن يكون بمقدور النظام عرض أو تقليل عرض الحقول المعبّأة مسبقاً حول تفاصيل قطعة الأرض والملكية والتفاصيل الشخصية وتفاصيل الشركة والوكالة / التمثيل.', 'The applicant may add comments and supporting documents; pre-filled plot, ownership, personal, company and agency fields can be shown or collapsed.'),
      n(4, 'إذا احتاج موظف البلدية إلى معلومات أو مستندات إضافية، يمكنه استخدام أدوات المراسلة داخل النظام و/أو إنشاء مهمة لمقدم الطلب لتقديم المعلومات أو المستندات الإضافية.', 'If more information is needed, the employee can message the applicant and/or create a task for them.'),
      n(5, 'يجب أن يكون بمقدور النظام إبلاغ المستخدم المعني تلقائياً بالمهام المعلّقة أو الرسائل الواردة عبر قنوات متعددة (داخل النظام، البريد الإلكتروني، الرسائل النصية SMS) وتهيئة هذه القنوات. يمكن لمقدم الطلب الاطلاع على التعليق أو طلب التوضيح وتقديم التفاصيل / المستندات المطلوبة، وتُحدَّث حالة الطلب لتعكس المعلومات المعلّقة لدى مقدم الطلب.', "The system notifies users over configurable channels (in-app, email, SMS). The applicant can answer clarification requests and the status reflects information pending from the applicant."),
      n(6, 'يجب أن يكون بمقدور النظام تعيين المهمة وجدولة الزيارة الميدانية حسب توفر الموظفين، وإشعار مقدم الطلب تلقائياً بالزيارة وحالة الطلب، وصياغة تقرير فني / تقرير الزيارة الميدانية تلقائياً بتعبئة مسبقة لتفاصيل الطلب.', 'The system assigns the task, schedules the visit, notifies the applicant and drafts a pre-filled technical/visit report.'),
      n(7, 'يحتوي التقرير على مراجعة الموقع وأهم الملاحظات من الزيارة وأي مشاهدات ومعلومات أخرى محددة مسبقاً وفق النموذج المعتمد.', 'The report covers the site review, key findings, observations and predefined information per the approved template.'),
      n(8, 'يقوم رئيس القسم / رئيس الإدارة بمراجعة الطلب والموقع وطلب الخدمة وملاحظات الموظفين البلديين والمرفقات الخاصة بطلب الخدمة قبل الموافقة.', 'The head of section/department reviews the request, site, staff notes and attachments before approving.'),
      n(9, 'يجب أن يكون بمقدور النظام تحديث بيانات البنية التحتية والشوارع ضمن المستودع الداخلي، وتهيئة تعيين المهام للإدارة المعنية.', 'The system updates infrastructure and street data and routes tasks to the relevant department.'),
      n(10, 'يجب تهيئة النظام بما يضمن تقديم الخدمة وفق الإجراء الداخلي، على أن يتم تأكيد / اعتماد تقديم الخدمة من رئيس القسم / رئيس الإدارة.', 'The system must ensure delivery follows the internal procedure, confirmed/approved by the head of section/department.'),
    ],
  },
  // 12 ─ طلب إتلاف مواد غذائية
  svc_119: {
    source: 'طلب إتلاف مواد غذائية.pdf',
    lanes: [A, S, staff('F', 'مفتش الأغذية / قسم الأغذية والمختبرات', 'Food Inspector / Laboratories Section'), staff('G', 'المدير العام لشؤون الصحة', 'Director General of Health Affairs')],
    nodes: [
      start('A'),
      t(1, 'A', 1, 'اختيار الخدمة في بوابة الخدمات الإلكترونية', 'Select the service on the e-services portal'),
      t(2, 'A', 2, 'تعبئة ومراجعة الطلب', 'Fill in and review the request'),
      t(3, 'A', 3, ...SUBMIT),
      t(4, 'S', 4, 'التحقق من متطلبات إتلاف المنتج الغذائي واستخراجها من خزانة المستخدم', "Check the food-disposal requirements and pull them from the user's vault"),
      t(5, 'S', 5, ...CREATE_TASK),
      t(6, 'F', 6, ...RECEIVE_TASK),
      t(7, 'F', 7, 'مراجعة جميع الوثائق والطلب ذات الصلة', 'Review all related documents and the request'),
      d('D1', 'F', 8, 'هل هناك حاجة لتوضيح أو معلومات إضافية؟', 'Is clarification or more information needed?'),
      t(8, 'S', 9, 'إرسال إشعار لمقدم الطلب لتقديم تفاصيل أو مستندات إضافية', 'Notify the applicant to provide additional details or documents'),
      t(9, 'A', 10, 'استلام الإشعار وتقديم التفاصيل أو المستندات الإضافية', 'Receive the notice and provide the additional details or documents'),
      { ...h('SN2', 'F', 9, 'معاينة / زيارة ميدانية (SN2)', 'Inspection / site visit (SN2)'), num: '10' },
      t(11, 'F', 10, 'إعداد تقرير الزيارة الميدانية على البوابة مع ملاحظات تفصيلية', 'Prepare the site visit report on the portal with detailed notes'),
      t(12, 'G', 11, ...RECEIVE_TASK),
      t(13, 'G', 12, 'مراجعة ملاحظات مفتش الأغذية وتقرير الزيارة الميدانية وطلب الخدمة', "Review the food inspector's notes, visit report and request"),
      d('D2', 'G', 13, ...IS_APPROVED),
      t(14, 'S', 14, 'تحديث مقدم الطلب بحالة الرفض', 'Update the applicant with the rejection status', 'top'),
      t(15, 'S', 14, 'استرجاع إيصال الإتلاف من المكب', 'Retrieve the disposal receipt from the landfill', 'bottom'),
      { ...h('PAY', 'S', 15, 'UMS-01 دفع الغرامات والضرائب والرسوم البلدية', 'UMS-01 Pay municipal fines, taxes and fees'), num: '16' },
      t(17, 'S', 16, 'إصدار شهادة إتلاف الأغذية الموقّعة رقمياً', 'Issue the digitally signed food disposal certificate'),
      t(18, 'A', 17, 'استلام رسالة/بريد إلكتروني بشهادة الإتلاف الرقمية', 'Receive the digital disposal certificate by message/email'),
      end('A', 18),
    ],
    edges: [
      ...seq('start', 'n1', 'n2', 'n3', 'n4', 'n5', 'n6', 'n7', 'D1'),
      e('D1', 'n8', YES), e('n8', 'n9'), e('n9', 'n7', ['عودة', 'Back'], true),
      e('D1', 'SN2', NO), ...seq('SN2', 'n11', 'n12', 'n13', 'D2'),
      e('D2', 'n15', ['موافق', 'Approved']), ...seq('n15', 'PAY', 'n17', 'n18', 'end'),
      e('D2', 'n14', ['مرفوض', 'Rejected']), e('n14', 'end'),
    ],
    notes: [
      n(1, 'يشترط أن يكون مقدم الطلب مصادَقاً عليه كمنشأة تجارية مسجّلة. قد ينتج إتلاف الأغذية أيضاً عن تفتيش ميداني عشوائي يجريه مفتش البلدية، وفي هذه الحالة يتيح النظام ربط مخالفة انتهاء صلاحية الغذاء بعملية الإتلاف وإصدار الشهادة الإلكترونية مباشرة بعد الإتلاف.', 'The applicant must be a registered establishment. Disposal may also follow a random inspection; the system can then link the expiry violation to the disposal and issue the e-certificate right after.'),
      n(2, 'في حال اختيار مقدم الطلب خدمات متعلقة بمجموعة خدمات إدارة الإعلانات، يستدعي النظام الدليل الذكي لاقتراح الخدمات المرتبطة بالترخيص البلدي المرتبط باسم المستخدم. يقوم مقدم الطلب بتعبئة نموذج الطلب ببيانات إتلاف الأغذية.', "The smart guide suggests services linked to the user's municipal license; the applicant fills in the food-disposal data."),
      n(3, 'بعد تقديم الطلب، يظهر استبيان رضا العملاء كنافذة منبثقة لمقدم الطلب لإكماله.', 'After submission, a customer-satisfaction survey pops up.'),
      n(4, 'تُستخرج جميع المستندات المطلوبة للخدمة من خزانة المستخدم. يتحقق النظام تلقائياً من قاعدة بيانات نظم المعلومات الجغرافية (GIS) ويتأكد من أهلية الخدمة استناداً إلى خزانة المستخدم وخزانة المشروع وقاعدة بيانات المخالفات وغيرها.', "Required documents come from the user's vault; the system checks GIS and eligibility against the user/project vaults and the violations database."),
      n(5, 'يقوم النظام بتعيين المهمة لموظف بناءً على عبء العمل والموقع الجغرافي المقابل، كما يفوّض المهمة تلقائياً في حال غياب الموظف.', 'The system assigns the task by workload and location and delegates it when the employee is absent.'),
      n(6, 'يستلم مفتش الأغذية إشعاراً بالمهمة الجديدة ويطّلع على تفاصيلها والرسالة المرفقة.', 'The food inspector receives the new task and its message.'),
      n(7, 'في حال احتاج موظف البلدية لمعلومات أو مستندات إضافية، يمكنه استخدام أدوات المراسلة داخل النظام و/أو إنشاء مهمة لمقدم الطلب لتقديم المعلومات أو المستندات الإضافية.', 'If more information is needed, the employee can message the applicant and/or create a task for them.'),
      n(8, 'يرسل النظام إشعاراً لمقدم الطلب لتزويد البلدية بتفاصيل أو مستندات إضافية بناءً على طلب المفتش.', "The system asks the applicant for more details or documents at the inspector's request."),
      n(9, 'يمكن لمقدم الطلب الاطلاع على التعليق أو طلب التوضيح من الموظف البلدي، وتقديم التفاصيل أو المستندات المطلوبة حسب متطلبات المشروع.', "The applicant can view the employee's comment and provide what the project requires."),
      n(10, 'يجب أن يتوفر بالنظام إمكانية تعيين المهمة وجدولة الزيارة الميدانية حسب توفر الموظفين، وإشعار مقدم الطلب تلقائياً بالزيارة وحالة الطلب، وصياغة تقرير فني/ميداني تلقائياً عبر تعبئة مسبقة لتفاصيل الطلب.', 'The system schedules the visit by staff availability, notifies the applicant and drafts a pre-filled technical/field report.'),
      n(11, 'يُدخل الموظف تفاصيل موجزة عن موقع الزيارة لأغراض مراجعة تقديم الخدمة، ويتضمن التقرير مراجعة الموقع وأي ملاحظات تتعلق باللوائح الصحية.', 'The employee enters brief visit details; the report covers the site and any health-regulation notes.'),
      n(12, 'تشمل المهمة على سبيل المثال لا الحصر: بيانات الطلب، بيانات مقدم الطلب، بيانات الموقع الجغرافي (GIS)، وخيار إعادة تعيين المهمة لموظف آخر عند الإمكان.', 'The task includes request, applicant and GIS data, and can be reassigned to another employee.'),
      n(13, 'يراجع المدير العام لشؤون الصحة ملاحظات مفتش الأغذية وتقرير الزيارة الميدانية وطلب الخدمة لاتخاذ القرار المناسب، ويمكنه استخدام أدوات المراسلة داخل النظام إذا احتاج لمعلومات إضافية.', "The DG of Health Affairs reviews the inspector's notes and report and decides; they can message for more information."),
      n(14, 'في حال رفض الطلب، يقوم النظام تلقائياً بتحديث مقدم الطلب بحالة الرفض والسبب المقدَّم من البلدية.', 'If rejected, the system informs the applicant of the rejection and the reason.'),
      n(15, 'يسترجع النظام إيصال عملية الإتلاف من المكب عبر تكامل داخلي ضمن البلدية.', 'The system retrieves the disposal receipt from the landfill through an internal integration.'),
      n(16, 'تتم معالجة رسوم الخدمة عبر خدمة دفع الغرامات والضرائب والرسوم البلدية.', 'Fees are processed through the fines, taxes and fees payment service.'),
      n(17, 'يُنشئ النظام تلقائياً شهادة إتلاف الأغذية موقّعة رقمياً مع رمز استجابة سريعة (QR) مرتبط بتفاصيل الطلب، وبمجرد إصدار الشهادة تُحدَّث قواعد البيانات ذات الصلة آنياً.', 'The system issues a signed certificate with a QR code; databases update in real time.'),
      n(18, 'يمكن لمقدم الطلب تحميل ملف شهادة الإتلاف من النظام (يجب أن يكون مصادَقاً عليه للوصول إلى الشهادة).', 'The applicant can download the certificate (authentication required).'),
    ],
  },

  // 13 ─ طلب إنارة مجمع سكني (مجمع إنارة)
  svc_132: {
    source: 'طلب إنارة مجمع سكني (مجمع إنارة).pdf',
    lanes: [A, S, staff('E', 'المهندس / المفتش', 'Engineer / Inspector'), staff('H', 'رئيس القسم / رئيس الإدارة', 'Head of Section / Department')],
    nodes: [
      start('A'),
      t(1, 'A', 1, ...SELECT_SERVICE),
      t(2, 'S', 2, 'التحقق تلقائياً من الموقع والتحقق من صحة بيانات الطلب', 'Auto-verify the location and validate the request data'),
      t(3, 'A', 3, 'إدخال التفاصيل وإكمال نموذج طلب الخدمة', 'Enter the details and complete the request form'),
      t(4, 'A', 4, 'تعبئة استبيان الرضا', 'Fill in the satisfaction survey'),
      t(5, 'A', 5, ...SUBMIT),
      t(6, 'S', 6, ...CREATE_TASK),
      t(7, 'E', 7, ...RECEIVE_TASK),
      t(8, 'E', 8, 'مراجعة بيانات الطلب والخرائط', 'Review the request data and maps'),
      d('D1', 'E', 9, ...NEED_INFO),
      t(9, 'A', 10, 'استلام إشعار لتقديم تفاصيل أو مستندات إضافية', 'Receive a notice to provide additional details or documents'),
      h('SN2', 'E', 11, 'زيارة/معاينة ميدانية', 'Site visit / inspection'),
      t(10, 'E', 12, 'تعبئة تقرير الزيارة الميدانية وتقديمه للمراجعة', 'Complete the site visit report and submit it for review'),
      t(11, 'H', 13, ...RECEIVE_TASK),
      t(12, 'H', 14, 'مراجعة ملاحظات المهندس وتقرير الزيارة وطلب الخدمة', "Review the engineer's notes, visit report and request"),
      d('D2', 'H', 15, ...IS_APPROVED),
      t(14, 'S', 16, 'إنشاء مهمة للإدارة/القسم المعني لتنفيذ إنارة الطريق في الموقع المطلوب', 'Create a task for the relevant department to install the lighting on site'),
      t(15, 'E', 17, ...RECEIVE_TASK),
      t(16, 'E', 18, 'تنفيذ الخدمة ميدانياً وتحديث الحالة إلى مكتملة', 'Deliver the service in the field and set the status to Completed'),
      t(17, 'A', 19, 'استلام رسالة/بريد إلكتروني باكتمال الطلب', 'Receive a message/email that the request is complete'),
      end('A', 20),
      t(18, 'A', 21, 'استلام رسالة/بريد إلكتروني برفض طلب الخدمة', 'Receive a message/email rejecting the request'),
    ],
    edges: [
      ...seq('start', 'n1', 'n2', 'n3', 'n4', 'n5', 'n6', 'n7', 'n8', 'D1'),
      e('D1', 'n9', YES), e('n9', 'n8', ['عودة', 'Back'], true),
      e('D1', 'SN2', NO), ...seq('SN2', 'n10', 'n11', 'n12', 'D2'),
      e('D2', 'n14', APPROVE), ...seq('n14', 'n15', 'n16', 'n17', 'end'),
      e('D2', 'n18', REJECT), e('n18', 'end'),
    ],
    notes: [
      n(1, 'يمكن لمقدم الطلب أن يطلب: إزالة عمود إنارة، تركيب إنارة طرق للأحياء السكنية، نقل مجمّع كهربائي، تركيب إنارة لمجمّع سكني (مجمّع كهروضوئي)، صيانة إنارة الطرق. على مقدم الطلب توفير مخططات الشارع ورسم لخطوط المسار المراد إنارتها إن لم تكن متوفرة ضمن الخزانة.', 'The applicant may request: removing a light pole, residential street lighting, relocating an electrical cabinet, lighting a residential complex (photovoltaic), or street-light maintenance, and must provide street plans and the route to be lit if not in the vault.'),
      n(2, 'بناءً على تفاصيل قطعة الأرض أو العقار، يجلب النظام تلقائياً المستندات من خزانة الأرض أو التصاريح السابقة المرتبطة بالعقار إلى الخزانة المؤقتة للمشروع. عند توفر خدمات GIS يتحقق النظام تلقائياً من متطلبات شهادات عدم الممانعة.', 'The system pulls plot/property documents into the project vault; with GIS it checks the NOC requirements.'),
      n(3, 'يجب أن يكون بمقدور النظام تعيين المهمة وجدولة الزيارة الميدانية حسب توفر الموظفين، وإشعار مقدم الطلب تلقائياً، وصياغة تقرير الزيارة تلقائياً.', 'The system assigns the task, schedules the visit, notifies the applicant and drafts the visit report.'),
      n(4, 'يحتوي التقرير على مراجعة الموقع وأهم الملاحظات من الزيارة وأي مشاهدات ومعلومات أخرى وفق النموذج المعتمد.', 'The report covers the site review, key findings and observations per the approved template.'),
      n(5, 'يقوم رئيس القسم/الإدارة بمراجعة الطلب والموقع وطلب الخدمة والملاحظات من الموظفين البلديين والمرفقات الخاصة بطلب الخدمة.', 'The head of section/department reviews the request, site, staff notes and attachments.'),
      n(6, 'يجب أن يكون بمقدور النظام تحديث بيانات البنية التحتية والشوارع ضمن المستودع الداخلي، وتهيئة تعيين المهام للإدارة المعنية.', 'The system updates infrastructure and street data and routes tasks to the relevant department.'),
      n(7, 'يُهيَّأ النظام لضمان تقديم الخدمة وفق الإجراء الداخلي، على أن يتم تأكيد/اعتماد تقديم الخدمة من قِبل رئيس القسم/رئيس الإدارة.', 'Delivery follows the internal procedure and is confirmed by the head of section/department.'),
      n(8, 'يمكن لمقدم الطلب الاطلاع على تعليق أو طلب توضيح من الموظف البلدي وتقديم التفاصيل/المستندات المطلوبة حسب الحاجة، وتُحدَّث حالة الطلب لتعكس المعلومات المعلّقة من مقدم الطلب.', "The applicant can answer the employee's clarification request; the status reflects information pending from the applicant."),
    ],
  },

  // 14 ─ طلب تدريب طلاب مؤسسات التعليم العالي
  svc_127: {
    source: 'طلب تدريب طلاب مؤسسات التعليم العالي.pdf',
    lanes: [A, S, staff('E', 'الموظف المختص', 'Competent Employee'), staff('H', 'رئيس القسم', 'Head of Section')],
    nodes: [
      start('A'),
      t(1, 'A', 1, 'اختيار خدمة طلب تدريب طلاب مؤسسات التعليم العالي من بوابة الخدمات الإلكترونية', 'Select the higher-education student training service on the e-portal'),
      t(2, 'A', 2, 'تعبئة نموذج الطلب (المؤسسة التعليمية، التخصص، مدة التدريب المطلوبة)', 'Fill in the form (institution, major, requested training period)'),
      t(3, 'A', 3, 'إرفاق المستندات المطلوبة (خطاب الجامعة، الهوية، السجل الأكاديمي) وتقديم الطلب', 'Attach the documents (university letter, ID, transcript) and submit'),
      t(4, 'S', 4, 'التحقق التلقائي من استيفاء الطلب للمتطلبات الأساسية واستخراج المستندات من خزانة المستخدم', "Auto-check the basic requirements and pull documents from the user's vault"),
      t(5, 'S', 5, 'إنشاء مهمة مراجعة الطلب وتعيينها تلقائياً للموظف المختص في الدائرة المعنية', 'Create a review task and auto-assign it to the competent employee in the relevant department'),
      t(6, 'E', 6, 'استلام إشعار ومراجعة المهمة والبيانات والمستندات المرفقة', 'Receive the notification and review the task, data and attachments'),
      d('D1', 'E', 7, 'هل الطلب مستوفٍ للمتطلبات؟', 'Does the request meet the requirements?'),
      t(7, 'E', 8, 'إرسال إشعار للمتقدم لاستكمال المعلومات أو المستندات الناقصة', 'Ask the applicant to complete the missing information or documents', 'top'),
      t(9, 'E', 8, 'تحديد الدائرة المعنية والتحقق من توفر مقاعد تدريبية', 'Identify the department and check training seat availability', 'bottom'),
      t(8, 'A', 9, 'تقديم المعلومات أو المستندات الإضافية عبر البوابة', 'Provide the additional information or documents via the portal'),
      d('D2', 'H', 9, 'هل يوافق رئيس القسم على قبول الطالب للتدريب؟', 'Does the head of section accept the student?'),
      t(10, 'S', 10, 'تحديث حالة الطلب بالرفض وإشعار المتقدم بالسبب', 'Set the request to rejected and notify the applicant of the reason', 'top'),
      t(11, 'S', 10, 'إصدار خطاب قبول التدريب الموقّع رقمياً', 'Issue the digitally signed training acceptance letter', 'bottom'),
      t(12, 'A', 11, 'إشعار المتقدم باستلام خطاب قبول التدريب', 'Notify the applicant of the acceptance letter'),
      end('A', 12),
    ],
    edges: [
      ...seq('start', 'n1', 'n2', 'n3', 'n4', 'n5', 'n6', 'D1'),
      e('D1', 'n7', NO), e('n7', 'n8'), e('n8', 'n6', ['عودة', 'Back'], true),
      e('D1', 'n9', YES), e('n9', 'D2'),
      e('D2', 'n10', NO), e('D2', 'n11', YES),
      e('n10', 'end'), ...seq('n11', 'n12', 'end'),
    ],
    notes: [
      n(1, 'يمكن لأي طالب في مؤسسة تعليم عالٍ (جامعة أو كلية) التقدم بهذه الخدمة لطلب فرصة تدريب لدى البلدية.', 'Any university or college student can apply for a training opportunity at the municipality.'),
      n(2, 'يقوم الطالب بتعبئة بيانات الطلب: المؤسسة التعليمية، التخصص الدراسي، والمدة الزمنية المطلوبة للتدريب.', 'The student enters the institution, major and requested training period.'),
      n(3, 'يجب إرفاق خطاب تعريف رسمي من الجامعة أو المؤسسة التعليمية، صورة من الهوية، والسجل الأكاديمي قبل تقديم الطلب.', 'An official university letter, ID copy and transcript must be attached before submitting.'),
      n(4, 'يتحقق النظام تلقائياً من استيفاء الطلب للمتطلبات الأساسية، ويستخرج المستندات المطلوبة من خزانة المستخدم إن وُجدت.', "The system checks the basic requirements and pulls documents from the user's vault if available."),
      n(5, 'يقوم النظام بتعيين المهمة تلقائياً للموظف المختص في الدائرة المعنية بناءً على التخصص المطلوب وعبء العمل.', 'The system assigns the task to the competent employee by major and workload.'),
      n(6, 'يراجع الموظف المختص بيانات الطلب والمستندات المرفقة للتأكد من مطابقتها لمتطلبات الخدمة.', 'The employee checks the data and attachments against the service requirements.'),
      n(7, 'في حال وجود نقص في المعلومات أو المستندات، يرسل الموظف إشعاراً للمتقدم يوضح فيه المطلوب استكماله.', 'If anything is missing, the employee notifies the applicant what to complete.'),
      n(8, 'يمكن للطالب الاطلاع على الملاحظة وتقديم المعلومات أو المستندات الإضافية المطلوبة عبر بوابة الخدمة الإلكترونية.', 'The student can view the note and provide the missing items on the e-portal.'),
      n(9, 'يحدد الموظف الدائرة أو القسم الأنسب لتدريب الطالب بناءً على تخصصه، ويتحقق من توفر مقاعد تدريبية متاحة.', 'The employee picks the best department for the major and checks seat availability.'),
      n(10, 'في حال الرفض، يقوم النظام تلقائياً بتحديث حالة طلب المتقدم موضحاً سبب الرفض.', 'If rejected, the system updates the request status with the reason.'),
      n(11, 'عند الموافقة، يُصدر النظام خطاب قبول التدريب موقّعاً رقمياً ويُحدّث سجل الطلب.', 'On approval, the system issues a signed acceptance letter and updates the record.'),
      n(12, 'يستلم الطالب إشعاراً بقبول طلبه مع خطاب قبول التدريب القابل للتحميل من النظام.', 'The student is notified and can download the acceptance letter.'),
    ],
  },
  // 15 ─ طلب تصريح قطع أو ثقب الطريق
  svc_113: {
    source: 'طلب تصريح قطع أو ثقب الطريق.pdf',
    lanes: [A, S, staff('E', 'المهندس / المفتش', 'Engineer / Inspector'), staff('H', 'رئيس القسم / رئيس الإدارة', 'Head of Section / Department')],
    nodes: [
      start('A'),
      t(1, 'A', 1, ...SELECT_SERVICE),
      t(2, 'S', 2, 'التحقق تلقائياً من الموقع والتحقق من صحة بيانات الطلب', 'Auto-verify the location and validate the request data'),
      t(3, 'A', 3, 'إدخال التفاصيل وإكمال نموذج طلب الخدمة', 'Enter the details and complete the request form'),
      t(4, 'A', 4, 'تعبئة استبيان الرضا', 'Fill in the satisfaction survey'),
      t(5, 'A', 5, ...SUBMIT),
      t(6, 'S', 5, ...CREATE_TASK),
      c('Bin', 'E', 4.2, 'B'),
      t(7, 'E', 5, 'استلام إشعار ومراجعة المهمة', 'Receive the notification and review the task'),
      t(8, 'E', 6, 'مراجعة بيانات الطلب والخرائط', 'Review the request data and maps'),
      d('D1', 'E', 7, ...NEED_INFO),
      c('Aout', 'E', 7, 'A', 'top'),
      c('Ain', 'A', 5.8, 'A'),
      t(16, 'A', 6.5, 'استلام رسالة تطلب معلومات إضافية', 'Receive a message requesting more information'),
      t(17, 'A', 7.5, 'تقديم المعلومات الإضافية عبر بوابة الخدمة الإلكترونية', 'Provide the additional information via the e-portal'),
      c('Bout', 'A', 8.3, 'B'),
      t(9, 'E', 8.3, 'إحالة الطلب عبر البوابة للمراجعة', 'Refer the request through the portal for review'),
      t(10, 'H', 8.3, ...RECEIVE_TASK),
      t(11, 'H', 9.3, 'مراجعة ملاحظات المهندس وطلب الخدمة', "Review the engineer's notes and the request"),
      d('D2', 'H', 10.3, ...IS_APPROVED),
      h('PAY', 'A', 10.3, 'دفع الغرامات والضرائب والرسوم البلدية', 'Pay municipal fines, taxes and fees'),
      t(12, 'S', 11.4, 'إصدار نموذج الموافقة الموقّع رقمياً', 'Issue the digitally signed approval form'),
      t(14, 'A', 12.4, 'استلام رسالة/بريد إلكتروني باكتمال الطلب', 'Receive a message/email that the request is complete'),
      t(15, 'A', 13.5, 'استلام رسالة/بريد إلكتروني برفض طلب الخدمة', 'Receive a message/email rejecting the request'),
      end('A', 14.5),
    ],
    edges: [
      ...seq('start', 'n1', 'n2', 'n3', 'n4', 'n5', 'n6', 'n7', 'n8', 'D1'),
      e('D1', 'Aout', YES), ...seq('Ain', 'n16', 'n17', 'Bout'), e('Bin', 'n7'),
      e('D1', 'n9', NO), ...seq('n9', 'n10', 'n11', 'D2'),
      e('D2', 'PAY', APPROVE), ...seq('PAY', 'n12', 'n14', 'end'),
      e('D2', 'n15', REJECT), e('n15', 'end'),
      e('D2', 'n7', ['توضيح أو معلومات إضافية', 'Clarification / more information'], true),
    ],
    notes: [
      n(1, 'يشترط أن يكون مقدم الطلب مصادَقاً عليه كاستشاري مرخّص / مقاول مرخّص (أو جهة حكومية) للاستفادة من هذه الخدمة.', 'The applicant must be authenticated as a licensed consultant/contractor (or a government entity).'),
      n(2, 'تُرفق التفاصيل المتوفرة في خدمة إسناد المشروع تلقائياً متى لزم الأمر. مستندات الأنظمة الخارجية القابلة للاستخراج تُستخرج فورياً وتلقائياً عبر التكامل أو نقل البيانات وفق مذكرة التفاهم المسبقة (مثل السجل التجاري)، أما التي لا يمكن استخراجها فيقدّمها مقدم الطلب في الموعد المحدد (مثل شهادات عدم الممانعة من الجهات).', 'Project-assignment details attach automatically. Retrievable external documents (e.g. CR) are fetched via integration under an MoU; others (e.g. NOCs) are supplied by the applicant on time.'),
      n(3, 'يمكن لمقدم الطلب طلب اعتماد التصميم، إلا أن ذلك لا يشمل التأمين ولا الضمان البنكي.', 'The applicant may request design approval; this excludes the insurance deposit and bank guarantee.'),
      n(4, 'بناءً على تفاصيل قطعة الأرض (رقم القطعة) أو العقار، يجلب النظام تلقائياً المستندات من خزانة الأرض أو التصاريح السابقة المرتبطة بالعقار إلى الخزانة المؤقتة للمشروع. عند توفر خدمات GIS يمكن للنظام التحقق تلقائياً من متطلبات شهادات عدم الممانعة من مختلف جهات المرافق، وفي حال اشتراطها ستُتاح من البوابة.', 'The system pulls plot/property documents into the project vault; with GIS it checks utility NOC requirements, available from the portal when required.'),
      n(5, 'يمكن لمقدم الطلب إضافة تعليقات وإرفاق مستندات داعمة، مثل المخططات المعمارية التي توضح المقترح و/أو رسم مساحي للقطعة.', 'The applicant may add comments and supporting documents such as architectural plans and a survey drawing.'),
      n(6, 'أمام مقدم الطلب 90 يوماً لتقديم الطلب، وفي حال عدم تقديمه تنتهي الخدمة.', 'The applicant has 90 days to submit, otherwise the service expires.'),
      n(7, 'يجب أن يكون بمقدور النظام إبلاغ المستخدم المعني تلقائياً بالمهام المعلّقة أو الرسائل الواردة عبر قنوات متعددة (داخل النظام، البريد الإلكتروني، الرسائل النصية SMS) وتهيئة هذه القنوات، كما تُحدَّث حالة طلب الخدمة لتعكس المعلومات المعلّقة لدى مقدم الطلب.', 'The system notifies users over configurable channels (in-app, email, SMS); the status reflects information pending from the applicant.'),
      n(8, 'يجب أن يكون بمقدور مقدم الطلب إرفاق مستندات إضافية وإضافة تعليقات.', 'The applicant can attach more documents and add comments.'),
      n(9, 'إذا احتاج موظف البلدية إلى معلومات أو مستندات إضافية، يمكنه استخدام أدوات المراسلة داخل النظام و/أو إنشاء مهمة لمقدم الطلب لتقديم المعلومات أو المستندات الإضافية.', 'If more information is needed, the employee can message the applicant and/or create a task for them.'),
      n(10, 'يحتوي التقرير على مراجعة الموقع وأهم الملاحظات من الزيارة وأي مشاهدات ومعلومات أخرى محددة مسبقاً وفق النموذج المعتمد.', 'The report covers the site review, key findings and observations per the approved template.'),
      n(11, 'يقوم رئيس القسم / رئيس الإدارة بمراجعة الطلب والموقع وطلب الخدمة وملاحظات الموظفين البلديين والمرفقات الخاصة بطلب الخدمة قبل الموافقة.', 'The head of section/department reviews the request, site, staff notes and attachments before approving.'),
      n(12, 'في حال القطع أو الثقب، يُطلب ضمان بنكي وتأمين.', 'Cutting or boring requires a bank guarantee and an insurance deposit.'),
      n(13, 'يُنشئ النظام تلقائياً شهادة موقّعة رقمياً تحمل رمز الاستجابة السريعة (QR) استناداً إلى بيانات الطلب، وبمجرد إصدارها تُحدَّث مجموعات البيانات ذات الصلة آنياً مثل رقم التصريح والموقع واسم المستفيد ومدة الصلاحية للرجوع إليها مستقبلاً.', 'The system issues a signed certificate with a QR code and updates related datasets (permit number, site, beneficiary, validity) in real time.'),
      n(14, 'توجد نقطتا فحص لهذه الشهادات إذا كان هناك قطع للأسفلت، وإلا فتقتصر على النقطة الأولى: (1) بعد الانتهاء من العمل يتقدم مقدم الطلب بطلب زيارة موقع، ثم بطلب استرداد التأمين، ولا يفرج النظام (UMS) عن الضمان البنكي في هذه المرحلة. (2) بعد سنتين يُنشئ النظام زيارة موقع إلزامية ويُبلغ جميع الأطراف، وبعد التأكد من الالتزام يُفرج عن الضمان البنكي.', 'Two checkpoints when asphalt is cut, otherwise only the first: (1) after the work, the applicant requests a site visit and then the deposit refund; the bank guarantee is not released yet. (2) After two years the system creates a mandatory visit, notifies everyone, and releases the guarantee once compliance is confirmed.'),
      n(15, 'عند اعتماد الالتزام، يقوم النظام بتحديث الإضافة الخاصة بنظم المعلومات الجغرافية (GIS).', 'Once compliance is approved, the system updates the GIS layer.'),
    ],
  },

  // 16 ─ طلب تقييم أضرار مادية للحوادث المرورية
  svc_117: {
    source: 'طلب تقييم أضرار مادية للحوادث المرورية.pdf',
    lanes: [A, S, staff('E', 'المهندس / المفتش', 'Engineer / Inspector'), staff('H', 'رئيس القسم / رئيس الإدارة', 'Head of Section / Department')],
    nodes: [
      start('A'),
      t(1, 'A', 1, 'اختيار الخدمة من قائمة خدمات البلدية وتحديد موقع الحادث', 'Select the service and locate the accident'),
      t(2, 'S', 2, 'التحقق من موقع الحادث وتحديد اختصاص البلدية', "Verify the accident location and the municipality's jurisdiction"),
      t(3, 'A', 3, 'إدخال التفاصيل وإكمال نموذج طلب الخدمة', 'Enter the details and complete the request form'),
      t(5, 'A', 5, ...SUBMIT),
      t(6, 'S', 6, 'إنشاء مهمة لمراجعة الحالة تلقائياً', 'Create a case review task automatically'),
      t(7, 'E', 7, ...RECEIVE_TASK),
      t(8, 'E', 8, 'مراجعة بيانات الطلب والخرائط', 'Review the request data and maps'),
      d('D1', 'E', 9, ...NEED_INFO),
      t(18, 'A', 10, 'استلام رسالة تطلب معلومات إضافية', 'Receive a message requesting more information'),
      t(19, 'A', 11, 'تقديم المعلومات الإضافية عبر بوابة الخدمة الإلكترونية', 'Provide the additional information via the e-portal'),
      h('SN2', 'E', 12, 'زيارة/معاينة ميدانية', 'Site visit / inspection'),
      t(9, 'E', 13, 'إعداد التقدير التفصيلي لتكلفة إصلاح الضرر', 'Prepare a detailed repair cost estimate'),
      d('DM', 'E', 14, 'هل تأثرت عناصر متعددة؟', 'Were multiple assets affected?'),
      t(10, 'S', 15, 'إنشاء تقرير تقييم ضرر موحّد من جميع المهندسين', 'Create a consolidated damage report from all engineers'),
      t(11, 'H', 16, ...RECEIVE_TASK),
      t(12, 'H', 17, 'مراجعة الميزانية المُعدة من المهندسين والتحقق من تقرير الزيارة الميدانية', "Review the engineers' budget and verify the visit report"),
      d('DC', 'H', 18, 'هل تم تأكيد تقرير التقييم؟', 'Is the assessment report confirmed?'),
      t(14, 'A', 19, 'استلام رسالة/بريد إلكتروني باكتمال الطلب', 'Receive a message/email that the request is complete'),
      end('A', 20),
    ],
    edges: [
      ...seq('start', 'n1', 'n2', 'n3', 'n5', 'n6', 'n7', 'n8', 'D1'),
      e('D1', 'n18', YES), e('n18', 'n19'), e('n19', 'n8', ['عودة', 'Back'], true),
      e('D1', 'SN2', NO), ...seq('SN2', 'n9', 'DM'),
      e('DM', 'n10', YES), e('n10', 'n11'), e('DM', 'n11', NO),
      ...seq('n11', 'n12', 'DC'),
      e('DC', 'n14', YES), e('n14', 'end'),
      e('DC', 'n7', ['لا، إعادة للمهندس', 'No, back to the engineer'], true),
    ],
    notes: [
      n(1, 'يجب أن يكون مقدم الطلب مستشاراً مرخّصاً مسجلاً/مقاولاً مرخّصاً أو فرداً للاستفادة من هذه الخدمة. يقوم مقدم الطلب بمعاينة الطلب وإكماله تمهيداً للتقديم، مع إرفاق تفاصيل الحادث وصورة فوتوغرافية.', 'The applicant must be a licensed consultant/contractor or an individual, and completes the request with the accident details and a photo.'),
      n(2, 'تُرفق تلقائياً التفاصيل المتاحة في خدمة تخصيص المشروع كلما لزم الأمر. مستندات الجهات الخارجية يمكن استخراجها فورياً وتلقائياً عبر التكامل أو تبادل البيانات وفق مذكرة تفاهم مسبقة (مثل السجل التجاري)، ومستندات أخرى يجب على مقدم الطلب إرفاقها لاحقاً (مثل عقد إيجار من أصول حكومية أو شهادات عدم ممانعة).', 'Project details attach automatically; external documents come via integration under an MoU (e.g. CR), others are attached later by the applicant (e.g. a government asset lease or NOCs).'),
      n(3, 'يقوم النظام بتوزيع المهمة بين الإدارات المعنية بناءً على العناصر المتضررة في الطريق؛ فمثلاً الحالات المتعلقة بالإنارة تُوجَّه لمهندسي دائرة الإنارة والتحكم المروري.', 'Tasks are routed to departments by damaged asset, e.g. lighting cases go to the lighting and traffic-control engineers.'),
      n(4, 'يجب أن يكون بمقدور النظام تعيين المهمة وجدولة الزيارة الميدانية حسب توفر الموظفين، وإشعار مقدم الطلب تلقائياً بالموعد والحالة، وصياغة تقرير الزيارة تلقائياً.', 'The system schedules the visit by staff availability, notifies the applicant of the date and status and drafts the report.'),
      n(5, 'يقوم النظام تلقائياً بتعبئة الأسعار الثابتة للعناصر المتضررة واحتساب التكلفة النهائية المقدَّرة.', 'The system fills in fixed prices for the damaged assets and computes the estimated total.'),
      n(6, 'يقوم رئيس القسم أو مدير الدائرة بمراجعة الطلب والموقع وطلب الخدمة والملاحظات من المهندس مع مرفقات طلب الخدمة.', "The head of section or department director reviews the request, site and the engineer's notes."),
      n(7, 'يجب أن يكون مقدم الطلب قادراً على إرفاق مستندات إضافية وتقديم تعليقات.', 'The applicant can attach more documents and comment.'),
    ],
  },

  // 17 ─ طلب ذبح حيوانات بالمسلخ المركزي
  svc_118: {
    source: 'طلب ذبح حيوانات بالمسلخ المركزي.pdf',
    lanes: [A, S, staff('E', 'الموظف المختص', 'Competent Employee'), staff('V', 'الطبيب البيطري', 'Veterinarian')],
    nodes: [
      start('A'),
      t(1, 'A', 1, ...SELECT_SERVICE),
      t(2, 'A', 2, 'تعبئة ومراجعة الطلب', 'Fill in and review the request'),
      t(3, 'A', 3, 'تقديم ملاحظات العميل وتقديم الطلب', 'Submit customer feedback and the request'),
      t(4, 'S', 4, ...CREATE_TASK),
      t(5, 'E', 5, ...RECEIVE_TASK),
      t(6, 'E', 6, 'مراجعة جميع الوثائق والطلب ذات الصلة', 'Review all related documents and the request'),
      d('D1', 'E', 7, 'هل الطلب مؤهل والمستندات موثّقة؟', 'Is the request eligible and are the documents verified?'),
      t(7, 'A', 8, 'استلام إشعار لتقديم تفاصيل أو مستندات إضافية', 'Receive a notice to provide additional details or documents'),
      h('SN2', 'V', 9, 'زيارة/معاينة ميدانية', 'Site visit / inspection'),
      t(8, 'V', 10, ...RECEIVE_TASK),
      t(9, 'V', 11, 'إعداد تقرير الزيارة الميدانية عن الحيوان', 'Prepare the site visit report on the animal'),
      d('D2', 'E', 12, ...IS_APPROVED),
      t(13, 'S', 13, 'إصدار إيصال الذبح الموقّع رقمياً', 'Issue the digitally signed slaughter receipt'),
      t(14, 'A', 14, 'استلام رسالة/بريد إلكتروني بإيصال الذبح الرقمي', 'Receive the digital slaughter receipt by message/email'),
      end('A', 15),
      t(11, 'S', 16, 'تحديث مقدم الطلب بحالة الرفض', 'Update the applicant with the rejection status'),
    ],
    edges: [
      ...seq('start', 'n1', 'n2', 'n3', 'n4', 'n5', 'n6', 'D1'),
      e('D1', 'n7', ['توضيح إضافي', 'More clarification']), e('n7', 'n2', ['عودة', 'Back'], true),
      e('D1', 'SN2', YES), ...seq('SN2', 'n8', 'n9', 'D2'),
      e('D2', 'n13', APPROVE), ...seq('n13', 'n14', 'end'),
      e('D2', 'n11', REJECT), e('n11', 'end'),
    ],
    notes: [
      n(1, 'يقوم مقدم الطلب بتعبئة طلب استلام الذبيحة مع كافة تفاصيل الحيوان والموافقات من وزارة الزراعة، إلخ.', 'The applicant fills in the carcass request with all animal details and the Ministry of Agriculture approvals.'),
      n(2, 'في حال اختيار مقدم الطلب الخدمة يستدعي النظام الدليل الذكي لاقتراح الخدمات المرتبطة بالترخيص البلدي المرتبط باسم المستخدم.', "The smart guide suggests services linked to the user's municipal license."),
      n(3, 'يقوم النظام بتعيين المهمة لموظف بناءً على عبء العمل والموقع الجغرافي، ويفوّض المهمة في حال غياب الموظف.', 'The system assigns the task by workload and location and delegates it when the employee is absent.'),
      n(4, 'إذا احتاج موظف البلدية معلومات إضافية، يمكنه استخدام أدوات المراسلة داخل النظام و/أو إنشاء مهمة لمقدم الطلب لتقديمها.', 'If more information is needed, the employee can message the applicant and/or create a task for them.'),
      n(5, 'يمكن لمقدم الطلب الاطلاع على التعليق أو طلب التوضيح من الموظف البلدي وتقديم التفاصيل/المستندات المطلوبة.', "The applicant can view the employee's comment and provide what is needed."),
      n(6, 'يجب أن يكون بمقدور النظام تعيين المهمة وجدولة الزيارة الميدانية حسب توفر الموظفين، وإشعار مقدم الطلب تلقائياً بالموعد والحالة، وصياغة تقرير الزيارة تلقائياً.', 'The system schedules the visit, notifies the applicant of the date and status and drafts the report.'),
      n(7, 'يقوم الطبيب البيطري بإعداد تقرير عن الحيوان بناءً على الزيارة الميدانية التي أُجريت.', 'The veterinarian prepares a report on the animal from the site visit.'),
      n(8, 'يُنشئ النظام تلقائياً رمز الاستجابة السريعة (QR) للشهادة الموقّعة رقمياً استناداً إلى تفاصيل الطلب، وتُحدَّث قواعد البيانات آنياً.', 'The system generates a QR code for the signed receipt and updates databases in real time.'),
      n(9, 'يمكن لمقدم الطلب تنزيل ملف إيصال ذبح الغذاء من النظام (يجب أن يكون مصادَقاً عليه للوصول للإيصال).', 'The applicant can download the slaughter receipt (authentication required).'),
      n(10, 'في حال رفض الطلب، يقوم النظام تلقائياً بتحديث مقدم الطلب بحالة الرفض والسبب المقدَّم من البلدية.', 'If rejected, the system informs the applicant of the rejection and the reason.'),
    ],
  },

  // 18 ─ فحص عينة مخبرية (أغذية / مياه)
  svc_126: {
    source: 'فحص عينة مخبرية (أغذية - مياه).pdf',
    lanes: [A, S, staff('E', 'الموظف المختص', 'Competent Employee')],
    nodes: [
      start('A'),
      t(1, 'A', 1, ...SELECT_SERVICE),
      t(2, 'S', 2, 'التحقق من متطلبات إتلاف المنتج الغذائي واستخراجها من خزانة المستخدم', "Check the product requirements and pull them from the user's vault"),
      t(3, 'A', 3, 'تعبئة ومراجعة الطلب', 'Fill in and review the request'),
      t(4, 'A', 4, ...SUBMIT),
      t(5, 'S', 5, ...CREATE_TASK),
      t(6, 'E', 6, ...RECEIVE_TASK),
      t(7, 'E', 7, 'مراجعة جميع الوثائق والطلب ذات الصلة', 'Review all related documents and the request'),
      d('D1', 'E', 8, ...NEED_INFO),
      t(8, 'A', 9, 'استلام إشعار لتقديم تفاصيل أو مستندات إضافية', 'Receive a notice to provide additional details or documents'),
      t(9, 'S', 10, 'تعيين فني مختبر لإجراء الفحص', 'Assign a lab technician to run the test'),
      t(10, 'E', 11, 'مراجعة ملاحظات الفني المختبري', "Review the lab technician's notes"),
      d('D2', 'E', 12, 'نتيجة الفحص', 'Test result'),
      t(12, 'S', 13, 'تحديث النظام بنتيجة الفحص السلبية', 'Record the negative result'),
      t(14, 'S', 14, 'تحديث النظام بنتيجة الفحص الإيجابية', 'Record the positive result'),
      t(13, 'A', 15, 'استلام رسالة/بريد إلكتروني بالمادة الضارة', 'Receive a message/email about the harmful substance'),
      end('A', 16),
    ],
    edges: [
      ...seq('start', 'n1', 'n2', 'n3', 'n4', 'n5', 'n6', 'n7', 'D1'),
      e('D1', 'n8', YES), e('n8', 'n3', ['عودة', 'Back'], true),
      e('D1', 'n9', NO), ...seq('n9', 'n10', 'D2'),
      e('D2', 'n12', ['سلبية', 'Negative']), e('n12', 'end'),
      e('D2', 'n14', ['إيجابية', 'Positive']), ...seq('n14', 'n13', 'end'),
    ],
    notes: [
      n(1, 'يقوم مقدم الطلب بتعبئة الطلب بتفاصيل المنتج الغذائي المطلوب فحصه.', 'The applicant enters the details of the food product to be tested.'),
      n(2, 'جميع المستندات المطلوبة للخدمة تُستخرج من خزانة المستخدم.', "All required documents come from the user's vault."),
      n(3, 'بعد تقديم الطلب، يظهر استبيان رضا العملاء كنافذة منبثقة لمقدم الطلب لإكماله.', 'After submission, a customer-satisfaction survey pops up.'),
      n(4, 'يقوم النظام بتعيين المهمة لموظف بناءً على عبء العمل والموقع الجغرافي، ويفوّض المهمة في حال غياب الموظف.', 'The system assigns the task by workload and location and delegates it when the employee is absent.'),
      n(5, 'إذا احتاج موظف البلدية معلومات إضافية، يمكنه استخدام أدوات المراسلة داخل النظام و/أو إنشاء مهمة لمقدم الطلب لتقديمها.', 'If more information is needed, the employee can message the applicant and/or create a task for them.'),
      n(6, 'في حال ظهور نتيجة الفحص إيجابية، يقوم النظام تلقائياً بتحديد المنشآت المتأثرة وإرسال تنبيه لإخطار جميع المنشآت المرتبطة بضرورة إتلاف المادة عند الحاجة.', 'On a positive result, the system identifies affected establishments and alerts them to dispose of the substance.'),
      n(7, 'بمجرد ظهور نتيجة الفحص المخبري سلبية، تتلقى جميع المنشآت المتأثرة تنبيهاً بنتيجة الفحص السلبية.', 'On a negative result, all affected establishments are notified.'),
    ],
  },
};

/** Service ids that have a transcribed PDF diagram */
export const BLUEPRINT_SERVICE_IDS = Object.keys(PDF_BLUEPRINTS);

/**
 * Blueprint to draw for a flow: its stored (PDF) diagram, or one generated from processStages.
 * Generated staff nodes use ids `stage-<index>` so assignments map back to the stage.
 */
export function blueprintFor(flow: ServiceFlow): FlowBlueprint {
  if (flow.blueprint) return flow.blueprint;
  const stages = flow.processStages || [];
  const laneOf = (s: ProcessStage) => {
    const type = classifyActor(s);
    return type === 'staff' ? (s.roleId || `actor:${actorCode(s)}`) : type === 'applicant' ? 'A' : 'S';
  };
  const lanes: BlueprintLane[] = [A, S];
  stages.forEach(s => {
    const id = laneOf(s);
    if (!lanes.some(l => l.id === id)) lanes.push({ id, labelAr: s.actorAr, labelEn: s.actorEn, kind: 'staff', actorEn: s.actorEn, roleId: s.roleId });
  });

  const nodes: BlueprintNode[] = [start('A')];
  const edges: BlueprintEdge[] = [];
  const formSteps = flow.steps.filter(s => s.actionType !== 'payment');
  let col = 1;
  if (formSteps.length) nodes.push({ id: 'form', lane: 'A', col: col++, kind: 'task', labelAr: 'تعبئة نموذج الطلب وتقديمه', labelEn: 'Fill in and submit the request form' });
  const decisions: { id: string; after: number }[] = [];
  stages.forEach((s, i) => {
    nodes.push({ id: `stage-${i}`, num: String(s.order), lane: laneOf(s), col: col++, kind: 'task', labelAr: s.titleAr, labelEn: s.titleEn, assigneeUserId: s.assigneeUserId });
    if (classifyActor(s) === 'staff' && inferPermissions([s]).includes('approve')) {
      const id = `dec-${i}`;
      nodes.push(d(id, laneOf(s), col++, 'هل تمت الموافقة؟', 'Approved?'));
      decisions.push({ id, after: i });
    }
  });
  nodes.push(end('A', col));

  const order = nodes.map(n => n.id);
  order.slice(1).forEach((id, i) => {
    const from = order[i];
    edges.push(e(from, id, from.startsWith('dec-') ? YES : undefined));
  });
  decisions.forEach(({ id, after }) => {
    const reject = stages.findIndex((s, i) => i > after && /رفض/.test(s.titleAr));
    const target = reject >= 0 ? `stage-${reject}` : 'end';
    if (order[order.indexOf(id) + 1] !== target) edges.push(e(id, target, NO));
  });
  return { lanes, nodes, edges, notes: [] };
}

/** Sets (or clears) the named assignee of a diagram box; generated `stage-<i>` boxes write to processStages */
export function assignBlueprintNode(flow: ServiceFlow, nodeId: string, userId: string | null): ServiceFlow {
  const assigneeUserId = userId || undefined;
  if (!flow.blueprint && nodeId.startsWith('stage-')) {
    const idx = Number(nodeId.slice(6));
    return { ...flow, processStages: (flow.processStages || []).map((s, i) => i === idx ? { ...s, assigneeUserId } : s) };
  }
  if (!flow.blueprint) return flow;
  return { ...flow, blueprint: { ...flow.blueprint, nodes: flow.blueprint.nodes.map(n => n.id === nodeId ? { ...n, assigneeUserId } : n) } };
}

/**
 * Attaches the PDF diagram to each matching flow. Existing blueprints are kept unless
 * `overwrite` is set; named assignees and lane role links survive an overwrite.
 */
export function attachPdfBlueprints(flows: ServiceFlow[], overwrite = false): ServiceFlow[] {
  return flows.map(flow => {
    const pdf = PDF_BLUEPRINTS[flow.serviceId];
    if (!pdf || (flow.blueprint && !overwrite)) return flow;
    const prev = flow.blueprint;
    const fresh: FlowBlueprint = JSON.parse(JSON.stringify(pdf));
    fresh.lanes = fresh.lanes.map(l => ({ ...l, roleId: prev?.lanes.find(p => p.id === l.id)?.roleId ?? l.roleId }));
    fresh.nodes = fresh.nodes.map(n => ({ ...n, assigneeUserId: prev?.nodes.find(p => p.id === n.id)?.assigneeUserId }));
    return { ...flow, blueprint: fresh };
  });
}

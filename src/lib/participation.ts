import { Survey } from './types';

/*
 * Digital participation page content, from the municipality website (edm.gov.om/?page_id=4366).
 */

export type Bi = { ar: string; en: string };
const b = (ar: string, en: string): Bi => ({ ar, en });

export const PARTICIPATION_BANNER = 'https://edm.gov.om/wp-content/uploads/2025/04/participate.png';

export const GOALS: { lead: Bi; text: Bi }[] = [
  { lead: b('تعزيز التواصل والتفاعل والحوار', 'Strengthen communication, interaction and dialogue'),
    text: b('بين البلدية والمواطنين والأطراف ذات العلاقة، بما يسهم في تبادل الأفكار والمعرفة ودعم القرارات التشاركية.', 'between the municipality, citizens and stakeholders, to exchange ideas and knowledge and support shared decisions.') },
  { lead: b('زيادة الوعي والمشاركة المجتمعية', 'Raise awareness and community participation'),
    text: b('في البرامج والمشاريع والمبادرات البلدية، بما في ذلك المجالات الخدمية، العمرانية، البيئية، البحثية، والابتكارية، لضمان مساهمة فاعلة من مختلف فئات المجتمع في التنمية المحلية.', 'in municipal programmes, projects and initiatives — services, urban, environmental, research and innovation — so every part of the community contributes to local development.') },
  { lead: b('ضمان الشفافية وسهولة الوصول إلى المعلومات', 'Ensure transparency and easy access to information'),
    text: b('من خلال فتح قنوات رقمية متاحة للجميع للاطلاع على المشاريع والسياسات والخطط البلدية.', 'through digital channels open to everyone to follow municipal projects, policies and plans.') },
  { lead: b('تفعيل المشاركة في تحسين السياسات والخدمات', 'Make participation shape policies and services'),
    text: b('من خلال استبيانات، منصات تفاعلية، وورش رقمية تُمكّن السكان من التأثير في عملية صنع القرار.', 'through surveys, interactive platforms and digital workshops that let residents influence decisions.') },
  { lead: b('تعظيم الاستفادة من تقنيات المعلومات والاتصالات', 'Make the most of information and communication technology'),
    text: b('للوصول إلى مشاركة مدنية واسعة، وتوظيفها في بناء مستقبل رقمي قائم على التفاعل والمساءلة.', 'to reach broad civic participation and build a digital future based on interaction and accountability.') },
];

export const PRINCIPLES: { id: 'inclusion' | 'engagement' | 'transparency'; name: Bi; text: Bi }[] = [
  { id: 'inclusion', name: b('الشمول', 'Inclusion'), text: b('الوصول للجميع دون استثناء، بغض النظر عن الموقع الجغرافي، أو القدرة التقنية، أو الوضع الاجتماعي.', 'Access for everyone, whatever their location, technical ability or social situation.') },
  { id: 'engagement', name: b('المشاركة', 'Engagement'), text: b('إشراك المواطنين والمجتمع المحلي في تصميم السياسات والخدمات التي تمس حياتهم اليومية.', 'Involve citizens and the local community in designing the policies and services that shape their daily lives.') },
  { id: 'transparency', name: b('الشفافية', 'Transparency'), text: b('ضمان إتاحة المعلومات، وتوضيح كيف يتم استخدام مدخلات الجمهور في تحسين القرارات.', 'Make information available and show how public input is used to improve decisions.') },
];

export interface AxisRow { type: Bi; desc: Bi; how: Bi }
export const AXES: { id: string; title: Bi; rows: AxisRow[] }[] = [
  { id: 'information', title: b('محور إتاحة المعلومات', 'Access to information'), rows: [
    { type: b('البوابة الإلكترونية', 'The e-portal'),
      desc: b('الموقع الرسمي لبلدية ظفار يتضمن معلومات حول البلدية، خدماتها، والإعلانات الرسمية.', 'The official Dhofar Municipality website, with information about the municipality, its services and official announcements.'),
      how: b('يقوم فريق المحتوى الإلكتروني بإعداد ونشر المحتوى على الموقع ليكون متاحًا للزوار، ويشمل ذلك معلومات عن التراخيص، والشكاوى (منصة تجاوب)، والمشاريع، وإمكانية تحميل المستندات.', 'The e-content team prepares and publishes content for visitors: licences, complaints (Tajawob), projects and downloadable documents.') },
    { type: b('البيانات المفتوحة', 'Open data'),
      desc: b('تمكّن جميع المواطنين والجهات من الوصول للبيانات البلدية (مثل بيانات التراخيص، العقود، الإحصاءات) بصيغ قابلة للقراءة الآلية وإعادة الاستخدام.', 'Lets everyone reach municipal data (licences, contracts, statistics) in machine-readable, reusable formats.'),
      how: b('يتم توفير قسم خاص للبيانات المفتوحة ضمن بوابة المشاركة الرقمية، مع إتاحة خدمة طلب بيانات غير منشورة تُدرس وتُلبى حسب الضوابط.', 'A dedicated open-data section in the participation portal, with a service to request unpublished data, reviewed and answered under the rules.') },
    { type: b('وسائل التواصل الاجتماعي', 'Social media'),
      desc: b('منصات البلدية (مثل فيسبوك، إكس، إنستغرام، يوتيوب) لنشر الأخبار العامة، التوعية، التنبيهات، والفعاليات بطريقة جذابة وسريعة.', 'The municipality’s channels (Facebook, X, Instagram, YouTube) for news, awareness, alerts and events.'),
      how: b('فريق الإعلام الإلكتروني يصمم المحتوى البصري (صور، فيديو، إنفوجرافيك) وينشره وفق خطة شهرية تتماشى مع الهوية البصرية الرسمية للبلدية.', 'The digital media team designs visual content (images, video, infographics) and publishes it on a monthly plan in the official visual identity.') },
    { type: b('تطبيق أبشر', 'Abshir app'),
      desc: b('تطبيق ذكي يقدم خدمات إلكترونية للمواطنين تتعلق بالطرق، الإنارة، النظافة العامة، وإرسال طلبات الخدمات العامة.', 'A smart app for roads, lighting and cleanliness services and public service requests.'),
      how: b('يوفر معلومات عن الخدمات والإعلانات ومعلومات التواصل والسياسات.', 'Provides information on services, announcements, contacts and policies.') },
  ] },
  { id: 'consultation', title: b('محور التشاور', 'Consultation'), rows: [
    { type: b('أدوات ابتكار الأفكار', 'Idea generation'),
      desc: b('جلسات عصف ذهني وورش عمل تُنظّم لإشراك المجتمع في توليد الأفكار حول قضايا بلدية مثل: تطوير الحدائق، حركة المرور، أو مشاريع التجميل الحضري.', 'Brainstorming sessions and workshops to involve the community in ideas on municipal issues such as parks, traffic or urban beautification.'),
      how: b('يقوم فريق اللجنة الشبابية بدعوة فئات مستهدفة (مثل السكان، طلاب الجامعات، الجمعيات الأهلية) لحضور جلسات منظمة لمناقشة التحديات واقتراح الحلول.', 'The youth committee invites target groups (residents, university students, civil associations) to organised sessions to discuss challenges and propose solutions.') },
    { type: b('التشاور حول مشروعات السياسات البلدية', 'Consultation on draft policies'),
      desc: b('نشر مسودات لسياسات أو لوائح جديدة (مثل تنظيم الأسواق، التصاريح، الخدمات البيئية) وإتاحة المجال للتعليق عليها قبل اعتمادها رسميًا.', 'Publishing drafts of new policies or regulations (markets, permits, environmental services) for comment before they are adopted.'),
      how: b('يتم تخصيص قسم في بوابة المشاركة الرقمية لنشر السياسات قيد الدراسة، ويتيح للمواطنين تقديم آرائهم ومقترحاتهم إلكترونيًا، وتقوم البلدية بتحليل هذه المشاركات قبل اتخاذ القرار النهائي.', 'A section of the participation portal publishes policies under study; citizens comment online and the municipality analyses the input before deciding.') },
    { type: b('مشاركة المستفيدين في تصميم الخدمات واتخاذ القرارات', 'Beneficiaries in service design and decisions'),
      desc: b('إشراك المواطنين في تصميم الخدمات الرقمية والقرارات الإدارية والمشاريع المستقبلية من خلال استطلاعات واستفتاءات إلكترونية.', 'Involving citizens in designing digital services, administrative decisions and future projects through online surveys and polls.'),
      how: b('من التجارب الناجحة استطلاع الرأي حول إعادة بناء السوق المركزي بدلاً من ترميمه، وتبنّي اقتراحات المواطنين بإزالة أسوار الحدائق العامة لتكون متنفسًا للمواطنين والزوار. وتُستخدم أدوات تفاعلية مثل التصويت الإلكتروني واستطلاعات الرأي لجمع التغذية الراجعة ودمجها في القرار البلدي.', 'Successful examples: the poll on rebuilding the central market rather than renovating it, and adopting citizens’ proposal to remove public park fences. Interactive tools such as e-voting and polls feed back into municipal decisions.') },
  ] },
  { id: 'collaboration', title: b('محور التعاون والتمكين', 'Collaboration and empowerment'), rows: [
    { type: b('التصويت الإلكتروني', 'E-voting'),
      desc: b('عملية الإدلاء بالأصوات وفرزها باستخدام أدوات إلكترونية.', 'Casting and counting votes with electronic tools.'),
      how: b('عبر بوابة المشاركة الرقمية، يتم طرح موضوعات معينة للتصويت العام، وتُعرض النتائج بشفافية لدعم اتخاذ القرار.', 'Topics are put to public vote on the participation portal and results are shown openly to support decisions.') },
    { type: b('مبادرات المواطنين', 'Citizen initiatives'),
      desc: b('آلية تسمح للمواطنين بطرح مبادرات واقتراحات قابلة للتبني بعد الحصول على دعم كافٍ.', 'A way for citizens to propose initiatives that can be adopted once they gather enough support.'),
      how: b('يتم تبني المبادرات من خلال اللجنة الشبابية لبلدية ظفار، ومواقع التواصل الاجتماعي، ومركز الاتصالات، حيث تُدرس وتُقيّم المبادرات وفقًا للتفاعل والدعم الشعبي.', 'Initiatives come through the municipality’s youth committee, social media and the contact centre, and are assessed on public engagement and support.') },
    { type: b('قنوات المقترحات والشكاوى', 'Suggestions and complaints'),
      desc: b('أدوات لتقديم الآراء والملاحظات حول الخدمات البلدية.', 'Tools to give opinions and feedback on municipal services.'),
      how: b('تستقبل بلدية ظفار مقترحات وشكاوى المواطنين عبر منصة «تجاوب» الوطنية، وتُعالج وفق إجراءات واضحة تتبعها جهة مختصة داخل البلدية.', 'Suggestions and complaints arrive through the national Tajawob platform and are handled under clear procedures by a dedicated unit.') },
  ] },
];

export const STEPS: { title: Bi; points: Bi[] }[] = [
  { title: b('إعداد الخطة', 'Plan'), points: [b('إعداد وثيقة الحملة: الأهداف، الجمهور المستهدف، الشركاء المحتملون، النطاق، الجدول الزمني، الأدوات الرقمية وغير الرقمية، والميزانية.', 'A campaign document: goals, audience, likely partners, scope, timeline, digital and offline tools, and budget.')] },
  { title: b('إطلاق الحملة', 'Launch'), points: [b('تنفيذ المشاركة المجتمعية بالممارسات والأدوات والقنوات المحددة في الخطة، مع تسجيل النتائج وتوثيقها.', 'Run the engagement with the practices, tools and channels in the plan, recording and documenting results.')] },
  { title: b('التحليل', 'Analyse'), points: [b('مراجعة تقرير الحملة لتحليل مدخلات المشاركين وتقييم الأداء العام للحملة.', 'Review the campaign report to analyse participants’ input and assess overall performance.')] },
  { title: b('التطبيق', 'Apply'), points: [b('تطبيق النتائج في عملية اتخاذ القرار لتحقيق أهداف الحملة.', 'Use the findings in decision-making to meet the campaign goals.')] },
  { title: b('الإبلاغ والإشهار', 'Report back'), points: [
    b('توضيح نتيجة الحملة للمشاركين والمساهمين وكيف تم الوصول إليها، عبر:', 'Tell participants what came out of the campaign and how, through:'),
    b('خبر صحفي', 'a press release'), b('نشر تقارير', 'published reports'), b('قنوات التواصل الاجتماعي', 'social media'), b('فعاليات جماعية لشرح ما تم عمله', 'public events explaining what was done'),
  ] },
];

export const CHANNELS: { id: string; name: Bi; href: string; handle: string }[] = [
  { id: 'facebook', name: b('فيسبوك', 'Facebook'), href: 'https://www.facebook.com/DhofarMunicipality', handle: 'DhofarMunicipality' },
  { id: 'x', name: b('منصة إكس', 'X'), href: 'https://twitter.com/DhofarMun', handle: '@DhofarMun' },
  { id: 'youtube', name: b('يوتيوب', 'YouTube'), href: 'https://www.youtube.com/channel/UCp8waHfGiU5cPKU85INEnwg', handle: 'Dhofar Municipality' },
  { id: 'instagram', name: b('إنستغرام', 'Instagram'), href: 'https://www.instagram.com/Dhofar_Municipality', handle: '@Dhofar_Municipality' },
  { id: 'whatsapp', name: b('قناة واتساب', 'WhatsApp channel'), href: 'https://whatsapp.com/channel/0029Va7yPF94inouZfhdlp1R', handle: 'Dhofar Municipality' },
];

export const REPORTS: { title: Bi; href: string; kind: string; size?: string }[] = [
  { title: b('نتائج استبيانات حول خدمات (تطبيق أبشر، مواسم ظفار، مركز الاتصالات)', 'Survey results on services (Abshir app, Dhofar seasons, contact centre)'), href: 'https://edm.gov.om/wp-content/uploads/2025/05/%D9%86%D8%AA%D8%A7%D8%A6%D8%AC-%D8%A7%D9%84%D8%A5%D8%B3%D8%AA%D8%A8%D9%8A%D8%A7%D9%86%D8%A7%D8%AA.xlsx', kind: 'Excel', size: '31 KB' },
  { title: b('التقرير السنوي لعام 2022', 'Annual report 2022'), href: 'https://www.edm.gov.om/ar2022.pdf', kind: 'PDF', size: '10 MB' },
  { title: b('التقرير السنوي لعام 2021', 'Annual report 2021'), href: 'https://www.edm.gov.om/ar2021.pdf', kind: 'PDF', size: '2.6 MB' },
];

// ─── Pop-up survey: what to open to the public next ───────────────────

export const PARTICIPATION_SURVEY_ID = 'participation_topics';

/** Default pop-up survey. Once it has answers it is saved to the surveys list, where admins can edit it. */
export const PARTICIPATION_SURVEY: Survey = {
  id: PARTICIPATION_SURVEY_ID,
  titleAr: 'شاركنا اختيار موضوع المشاركة القادم',
  titleEn: 'Help us choose the next participation topic',
  descriptionAr: 'سؤالان سريعان: ما الموضوع الذي تودّ أن نطرحه للنقاش العام؟ وما الفكرة البلدية الذكية التي تستحق أن نعرضها على الجمهور؟',
  descriptionEn: 'Two quick questions: which topic should we open for public discussion, and which smart municipal idea deserves to go to the public?',
  thanksAr: 'شكراً لمشاركتك! سنعلن الموضوع الأعلى تصويتاً ونتائج المشاركة في قسم التقارير.',
  thanksEn: 'Thank you! We will announce the most-voted topic and the results in the reports section.',
  isActive: true,
  isPublicPoll: false,
  anonymous: true,
  responsesCount: 0,
  questions: [
    {
      id: 'best_topic', type: 'mcq', required: true,
      questionAr: 'ما أفضل موضوع تودّ أن تطرحه البلدية للمشاركة الرقمية؟',
      questionEn: 'Which topic should the municipality open for digital participation?',
      options: [
        { id: 'parks', textAr: 'تطوير الحدائق والمتنزهات العامة وجعلها مفتوحة للجميع', textEn: 'Upgrading public parks and opening them to everyone' },
        { id: 'khareef_traffic', textAr: 'تنظيم الحركة المرورية والمواقف في موسم الخريف', textEn: 'Traffic and parking during the Khareef season' },
        { id: 'markets', textAr: 'أولويات تطوير الأسواق المركزية والشعبية', textEn: 'Priorities for developing central and traditional markets' },
        { id: 'cleanliness', textAr: 'النظافة العامة وإعادة التدوير في الأحياء', textEn: 'Cleanliness and recycling in neighbourhoods' },
        { id: 'eservices', textAr: 'سهولة الخدمات الإلكترونية للبلدية وسرعتها', textEn: 'How easy and fast the municipality’s e-services are' },
        { id: 'events', textAr: 'الفعاليات والأنشطة المجتمعية على مدار العام', textEn: 'Community events and activities all year round' },
      ],
    },
    {
      id: 'smart_topic', type: 'mcq', required: true,
      questionAr: 'ما أذكى موضوع بلدي تقترح أن نطرحه على الجمهور؟',
      questionEn: 'Which smart municipal idea should we put to the public?',
      helpAr: 'أفكار تقنية يمكن أن تجعل خدمات البلدية أذكى.',
      helpEn: 'Technology ideas that could make municipal services smarter.',
      options: [
        { id: 'smart_bins', textAr: 'حاويات ذكية تُبلّغ عند امتلائها', textEn: 'Smart bins that report when they are full' },
        { id: 'smart_lighting', textAr: 'إنارة شوارع ذكية موفّرة للطاقة', textEn: 'Smart, energy-saving street lighting' },
        { id: 'projects_map', textAr: 'خريطة تفاعلية للمشاريع البلدية ومراحل تنفيذها', textEn: 'An interactive map of municipal projects and their progress' },
        { id: 'khareef_parking', textAr: 'حجز مواقف الخريف مسبقاً عبر التطبيق', textEn: 'Booking Khareef parking in advance in the app' },
        { id: 'photo_reports', textAr: 'الإبلاغ عن الحفر والتشوهات بالصورة والموقع', textEn: 'Reporting potholes and eyesores with a photo and location' },
        { id: 'ai_assistant', textAr: 'مساعد ذكي يجيب عن استفسارات الخدمات على مدار الساعة', textEn: 'An AI assistant answering service questions around the clock' },
      ],
    },
    {
      id: 'own_idea', type: 'longtext', required: false,
      questionAr: 'لديك فكرة أخرى؟ اكتبها هنا (اختياري)',
      questionEn: 'Have another idea? Write it here (optional)',
    },
  ],
};

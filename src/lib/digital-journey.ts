/*
 * "رحلة التحول الرقمي" — the municipality's digital transformation timeline, as published on
 * https://dmusera.netlify.app/dmdigi. Shown as neon stations in the virtual courtyard of the new
 * municipality building. Transaction figures come live from the open-data API, not from here.
 */

export const JOURNEY_SOURCE = 'https://dmusera.netlify.app/dmdigi';

export interface JourneyStage {
  id: string;
  year: string;
  titleAr: string;
  titleEn: string;
  summaryAr: string;
  summaryEn: string;
  /** Short bullet points (Arabic) */
  items: string[];
  itemsLabelAr: string;
  visits?: number;
  transactions?: number;
  statsNoteAr?: string;
  color: string;
  /** Platforms and services launched in the stage, shown as raised medallions above the panel */
  logos?: JourneyLogo[];
  /** Awards, shown as trophies in front of the panel */
  awards?: JourneyAward[];
  /** A landmark or object standing in front of the panel */
  model?: JourneyModel;
  /** Headline figures of the stage, shown as a column of raised cards beside the panel */
  highlights?: { value: string; valueEn: string; ar: string; en: string }[];
}

export interface JourneyModel { kind: 'burj' | 'cloud' | 'qr' | 'palm' | 'vr' | 'robot' | 'city'; ar: string; en: string }

export type JourneyIcon = 'globe' | 'file' | 'building' | 'card' | 'chat' | 'bot' | 'cloud' | 'map' | 'qr' | 'leaf' | 'handshake' | 'chart' | 'award' | 'sparkles' | 'camera' | 'users' | 'wallet' | 'zap';
export interface JourneyLogo { icon: JourneyIcon; ar: string; en: string }
/** Trophy shapes follow the award artwork of the source infographic: lettering, plaque, sail and gate */
export interface JourneyAward { shape: 'text' | 'plaque' | 'sail' | 'gate'; year: string; ar: string; en: string }

export const JOURNEY: JourneyStage[] = [
  {
    id: 'y2020', year: '2020', color: '#03CFCB', model: { kind: 'burj', ar: 'برج النهضة', en: 'Burj Al Nahdha' },
    titleAr: 'التأسيس والتغلب على التحديات', titleEn: 'Foundation and overcoming challenges',
    summaryAr: 'تحديات البداية: نقص قاعدة البيانات، ومقاومة التغيير، وظروف جائحة كوفيد-19.',
    summaryEn: 'Early challenges: missing data, resistance to change and the COVID-19 pandemic.',
    itemsLabelAr: 'المخرجات',
    logos: [{ icon: 'globe', ar: 'بوابة الخدمات', en: 'e-Services portal' }, { icon: 'file', ar: 'الترخيص البلدي', en: 'Municipal licence' }, { icon: 'building', ar: 'عقود الإيجار', en: 'Rent contracts' }, { icon: 'card', ar: 'الدفع الإلكتروني', en: 'e-Payment' }, { icon: 'chat', ar: 'دعم واتساب', en: 'WhatsApp support' }],
    items: ['تشكيل فرق عمل متخصصة', 'إنشاء قاعدة بيانات أساسية', 'إطلاق بوابة الخدمات الإلكترونية (15-12-2020)', 'التراخيص وعقود الإيجار والدفع الإلكتروني', 'دعم فني عبر واتساب'],
  },
  {
    id: 'y2021', year: '2021', color: '#22D3EE', model: { kind: 'cloud', ar: 'الخدمات السحابية', en: 'Cloud services' }, visits: 364_851, transactions: 52_124,
    titleAr: 'تطوير وتوسيع الخدمات', titleEn: 'Developing and expanding services',
    summaryAr: 'تطوير البوابة، ومراكز خدمة خارجية، وإطلاق خدمات مبتكرة.',
    summaryEn: 'A better portal, outreach service centres and new services.',
    itemsLabelAr: 'الإنجازات',
    logos: [{ icon: 'bot', ar: 'سهالة', en: 'Sahalah chatbot' }, { icon: 'cloud', ar: 'الخدمات السحابية', en: 'Cloud services' }, { icon: 'building', ar: 'تراخيص البناء', en: 'Building permits' }, { icon: 'map', ar: 'مصادقات المسارات', en: 'Route approvals' }],
    items: ['إنشاء مراكز خدمة خارجية', 'المحادثة الآلية «سهالة» (1 أبريل)', 'الانتقال للخدمات السحابية (1 أبريل)', 'تراخيص البناء ورقابة البناء (15 أغسطس)', 'مصادقات مسارات تمديدات الخدمة (يونيو)'],
  },
  {
    id: 'y2022', year: '2022', color: '#818CF8', model: { kind: 'qr', ar: 'عقود برمز QR', en: 'QR contracts' }, visits: 1_165_138, transactions: 42_763,
    titleAr: 'التحول السحابي الكامل والرقمنة', titleEn: 'Full cloud and digitisation',
    summaryAr: 'استكمال التحول السحابي، ورقمنة الملفات، وتطبيقات متخصصة.',
    summaryEn: 'Cloud migration completed, paper files digitised, specialised apps.',
    itemsLabelAr: 'الإنجازات',
    logos: [{ icon: 'cloud', ar: 'تحول سحابي كامل', en: 'Full cloud' }, { icon: 'qr', ar: 'رمز QR للعقود', en: 'QR contracts' }, { icon: 'file', ar: 'الأرشفة الرقمية', en: 'Digital archive' }, { icon: 'leaf', ar: 'خريف ظفار', en: 'Khareef Dhofar' }],
    items: ['التحول الكامل للخدمات السحابية', 'رموز QR للعقود الإلكترونية', 'تحويل الملفات الورقية إلى رقمية', 'تطبيق «خريف ظفار» (14 أغسطس)'],
  },
  {
    id: 'y2023', year: '2023', color: '#C084FC', model: { kind: 'palm', ar: 'مواسم ظفار', en: 'Mawasim Dhofar' }, visits: 1_456_112, transactions: 45_417,
    titleAr: 'تطبيقات مبتكرة وبيانات مفتوحة', titleEn: 'Innovative apps and open data',
    summaryAr: 'تطبيقات جديدة، وإتاحة البيانات المفتوحة، وتوظيف الذكاء الاصطناعي.',
    summaryEn: 'New apps, open data and artificial intelligence.',
    itemsLabelAr: 'الإنجازات',
    logos: [{ icon: 'leaf', ar: 'مواسم ظفار', en: 'Mawasim Dhofar' }, { icon: 'handshake', ar: 'أبشر', en: 'Absher' }, { icon: 'chart', ar: 'البيانات المفتوحة', en: 'Open data' }, { icon: 'map', ar: 'GIS ذكي', en: 'AI GIS' }, { icon: 'award', ar: 'كومكس', en: 'COMEX' }],
    items: ['«خريف ظفار» يصبح «مواسم ظفار»', 'تطبيق «أبشر» (1 يونيو)', 'البيانات المفتوحة للخدمات البلدية', 'نظم المعلومات الجغرافية بالذكاء الاصطناعي', 'أول مشاركة في كومكس'],
  },
  {
    id: 'y2024', year: '2024', color: '#F472B6', model: { kind: 'vr', ar: 'الميتافيرس', en: 'Metaverse' }, visits: 1_013_899, transactions: 154_979,
    titleAr: 'تقنيات متقدمة ومبادرات مجتمعية', titleEn: 'Advanced technology and community initiatives',
    summaryAr: 'أحدث التقنيات ومبادرات تعزز المشاركة المجتمعية.',
    summaryEn: 'Latest technology and initiatives for community participation.',
    itemsLabelAr: 'الإنجازات',
    // From the municipality's "أبرز إنجازات المنصات الرقمية 2024" infographic
    highlights: [
      { value: '+4 مليون', valueEn: '4M+', ar: 'ظهور للبوابة الإلكترونية', en: 'portal impressions' },
      { value: '+250 ألف', valueEn: '250K+', ar: 'معاملة عبر المنافذ الرقمية', en: 'transactions on digital channels' },
      { value: '+100 ألف', valueEn: '100K+', ar: 'تحميل لتطبيق مواسم ظفار', en: 'Mawasim Dhofar downloads' },
      { value: '5', valueEn: '5', ar: 'جوائز في عام واحد', en: 'awards in one year' },
    ],
    logos: [{ icon: 'globe', ar: 'الميتافيرس', en: 'Metaverse' }, { icon: 'sparkles', ar: 'صلالة الذكية', en: 'Smart Salalah' }, { icon: 'camera', ar: 'كاميرات ذكية', en: 'AI cameras' }, { icon: 'users', ar: 'ضع بصمتك', en: 'Leave your mark' }, { icon: 'wallet', ar: 'منصة الاستثمار', en: 'Investment' }],
    items: ['خدمة العملاء بتقنية الميتافيرس (27 مايو)', 'منصة صلالة الذكية', 'كاميرات ذكاء اصطناعي في المناطق الحيوية', 'تطبيق «ضع بصمتك»', 'منصة بلدية ظفار للاستثمار'],
  },
  {
    id: 'y2025', year: '2025', color: '#FBBF24', model: { kind: 'robot', ar: 'روبوت Cruzr', en: 'Cruzr robot' }, visits: 793_979, transactions: 25_784, statsNoteAr: 'النصف الأول',
    titleAr: 'خدمات استباقية وذكاء اصطناعي متقدم', titleEn: 'Proactive services and advanced AI',
    summaryAr: 'خدمات استباقية للمستخدمين وأحدث تقنيات الذكاء الاصطناعي.',
    summaryEn: 'Proactive services and the latest AI.',
    itemsLabelAr: 'الإنجازات',
    logos: [{ icon: 'zap', ar: 'خدمات استباقية', en: 'Proactive services' }, { icon: 'camera', ar: 'مرور ذكي', en: 'AI traffic' }, { icon: 'chat', ar: 'محادثة ذكية', en: 'Smart chat' }, { icon: 'map', ar: 'التوائم الرقمية', en: 'Digital twins' }, { icon: 'bot', ar: 'روبوت البلدية', en: 'Service robot' }],
    items: ['خدمات استباقية', 'مراقبة حركة المرور بالذكاء الاصطناعي', 'محادثة ذكية لمركز الاتصال الافتراضي', 'التوائم الرقمية Digital Twins GIS', 'روبوت خدمات البلدية وروبوت الإصحاح البيئي'],
  },
  {
    id: 'awards', year: '★', color: '#FDE047',
    titleAr: 'الجوائز والإنجازات', titleEn: 'Awards',
    summaryAr: 'تكريم محلي وعالمي للتميز في التحول الرقمي.',
    summaryEn: 'Local and international recognition.',
    itemsLabelAr: 'الجوائز',
    awards: [
      { shape: 'text', year: '2022', ar: 'جائزة SAG GIS العالمية', en: 'SAG GIS global award' },
      { shape: 'plaque', year: '2023', ar: 'أفضل منافذ تقديم الخدمة', en: 'Best service outlets' },
      { shape: 'sail', year: '2024', ar: 'أفضل قائد للتغيير الرقمي', en: 'Best digital change leader' },
      { shape: 'sail', year: '2024', ar: 'أفضل فريق تحول رقمي', en: 'Best digital team' },
      { shape: 'plaque', year: '2024', ar: 'سياسات البيانات المفتوحة', en: 'Open-data policies' },
      { shape: 'gate', year: '2024', ar: 'جائزة المدن الذكية', en: 'Smart cities award' },
    ],
    items: ['جائزة SAG GIS العالمية للذكاء الاصطناعي في نظم المعلومات الجغرافية (2022)', 'أفضل منافذ تقديم الخدمة في المحافظات (2023)', 'أفضل قائد للتغيير الرقمي (2024)', 'أفضل فريق للتحول الرقمي الحكومي (2024)', 'أفضل مؤسسة في سياسات البيانات المفتوحة (2024)', 'جائزة المدن الذكية بكومكس (2024)'],
  },
  {
    id: 'vision', year: '2040', color: '#34D399', model: { kind: 'city', ar: 'ظفار الذكية', en: 'Smart Dhofar' },
    titleAr: 'الرؤية المستقبلية', titleEn: 'The vision',
    summaryAr: 'نحو ظفار رقمية، مستدامة، ومبتكرة: خدمات استباقية وذكية مدعومة بالذكاء الاصطناعي والميتافيرس.',
    summaryEn: 'Towards a digital, sustainable and innovative Dhofar.',
    itemsLabelAr: 'التوجهات',
    items: ['مدينة ذكية مستدامة', 'توطين وتطوير التقنيات المتقدمة', 'دعم الابتكار وريادة الأعمال', 'تجارب واقع افتراضي ومعزز', 'مشاركة مجتمعية معززة'],
  },
];

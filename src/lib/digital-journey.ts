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
}

export const JOURNEY: JourneyStage[] = [
  {
    id: 'y2020', year: '2020', color: '#03CFCB',
    titleAr: 'التأسيس والتغلب على التحديات', titleEn: 'Foundation and overcoming challenges',
    summaryAr: 'تحديات البداية: نقص قاعدة البيانات، ومقاومة التغيير، وظروف جائحة كوفيد-19.',
    summaryEn: 'Early challenges: missing data, resistance to change and the COVID-19 pandemic.',
    itemsLabelAr: 'المخرجات',
    items: ['تشكيل فرق عمل متخصصة', 'إنشاء قاعدة بيانات أساسية', 'إطلاق بوابة الخدمات الإلكترونية (15-12-2020)', 'التراخيص وعقود الإيجار والدفع الإلكتروني', 'دعم فني عبر واتساب'],
  },
  {
    id: 'y2021', year: '2021', color: '#22D3EE', visits: 364_851, transactions: 52_124,
    titleAr: 'تطوير وتوسيع الخدمات', titleEn: 'Developing and expanding services',
    summaryAr: 'تطوير البوابة، ومراكز خدمة خارجية، وإطلاق خدمات مبتكرة.',
    summaryEn: 'A better portal, outreach service centres and new services.',
    itemsLabelAr: 'الإنجازات',
    items: ['إنشاء مراكز خدمة خارجية', 'المحادثة الآلية «سهالة» (1 أبريل)', 'الانتقال للخدمات السحابية (1 أبريل)', 'تراخيص البناء ورقابة البناء (15 أغسطس)', 'مصادقات مسارات تمديدات الخدمة (يونيو)'],
  },
  {
    id: 'y2022', year: '2022', color: '#818CF8', visits: 1_165_138, transactions: 42_763,
    titleAr: 'التحول السحابي الكامل والرقمنة', titleEn: 'Full cloud and digitisation',
    summaryAr: 'استكمال التحول السحابي، ورقمنة الملفات، وتطبيقات متخصصة.',
    summaryEn: 'Cloud migration completed, paper files digitised, specialised apps.',
    itemsLabelAr: 'الإنجازات',
    items: ['التحول الكامل للخدمات السحابية', 'رموز QR للعقود الإلكترونية', 'تحويل الملفات الورقية إلى رقمية', 'تطبيق «خريف ظفار» (14 أغسطس)'],
  },
  {
    id: 'y2023', year: '2023', color: '#C084FC', visits: 1_456_112, transactions: 45_417,
    titleAr: 'تطبيقات مبتكرة وبيانات مفتوحة', titleEn: 'Innovative apps and open data',
    summaryAr: 'تطبيقات جديدة، وإتاحة البيانات المفتوحة، وتوظيف الذكاء الاصطناعي.',
    summaryEn: 'New apps, open data and artificial intelligence.',
    itemsLabelAr: 'الإنجازات',
    items: ['«خريف ظفار» يصبح «مواسم ظفار»', 'تطبيق «أبشر» (1 يونيو)', 'البيانات المفتوحة للخدمات البلدية', 'نظم المعلومات الجغرافية بالذكاء الاصطناعي', 'أول مشاركة في كومكس'],
  },
  {
    id: 'y2024', year: '2024', color: '#F472B6', visits: 1_013_899, transactions: 154_979,
    titleAr: 'تقنيات متقدمة ومبادرات مجتمعية', titleEn: 'Advanced technology and community initiatives',
    summaryAr: 'أحدث التقنيات ومبادرات تعزز المشاركة المجتمعية.',
    summaryEn: 'Latest technology and initiatives for community participation.',
    itemsLabelAr: 'الإنجازات',
    items: ['خدمة العملاء بتقنية الميتافيرس (27 مايو)', 'منصة صلالة الذكية', 'كاميرات ذكاء اصطناعي في المناطق الحيوية', 'تطبيق «ضع بصمتك»', 'منصة بلدية ظفار للاستثمار'],
  },
  {
    id: 'y2025', year: '2025', color: '#FBBF24', visits: 793_979, transactions: 25_784, statsNoteAr: 'النصف الأول',
    titleAr: 'خدمات استباقية وذكاء اصطناعي متقدم', titleEn: 'Proactive services and advanced AI',
    summaryAr: 'خدمات استباقية للمستخدمين وأحدث تقنيات الذكاء الاصطناعي.',
    summaryEn: 'Proactive services and the latest AI.',
    itemsLabelAr: 'الإنجازات',
    items: ['خدمات استباقية', 'مراقبة حركة المرور بالذكاء الاصطناعي', 'محادثة ذكية لمركز الاتصال الافتراضي', 'التوائم الرقمية Digital Twins GIS', 'روبوت خدمات البلدية وروبوت الإصحاح البيئي'],
  },
  {
    id: 'awards', year: '★', color: '#FDE047',
    titleAr: 'الجوائز والإنجازات', titleEn: 'Awards',
    summaryAr: 'تكريم محلي وعالمي للتميز في التحول الرقمي.',
    summaryEn: 'Local and international recognition.',
    itemsLabelAr: 'الجوائز',
    items: ['جائزة SAG GIS العالمية للذكاء الاصطناعي في نظم المعلومات الجغرافية (2022)', 'أفضل منافذ تقديم الخدمة في المحافظات (2023)', 'أفضل قائد للتغيير الرقمي (2024)', 'أفضل فريق للتحول الرقمي الحكومي (2024)', 'أفضل مؤسسة في سياسات البيانات المفتوحة (2024)', 'جائزة المدن الذكية بكومكس (2024)'],
  },
  {
    id: 'vision', year: '2040', color: '#34D399',
    titleAr: 'الرؤية المستقبلية', titleEn: 'The vision',
    summaryAr: 'نحو ظفار رقمية، مستدامة، ومبتكرة: خدمات استباقية وذكية مدعومة بالذكاء الاصطناعي والميتافيرس.',
    summaryEn: 'Towards a digital, sustainable and innovative Dhofar.',
    itemsLabelAr: 'التوجهات',
    items: ['مدينة ذكية مستدامة', 'توطين وتطوير التقنيات المتقدمة', 'دعم الابتكار وريادة الأعمال', 'تجارب واقع افتراضي ومعزز', 'مشاركة مجتمعية معززة'],
  },
];

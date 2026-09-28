import { StaffPlatform } from './types';

/*
 * Platforms every employee sees on the staff portal. The live list is `staffPlatforms` in the
 * database (editable from the admin JSON tab); this default is used until it exists.
 * Links left empty show as "link not set" instead of pointing somewhere wrong.
 */
const EDM = 'https://edm.gov.om/wp-content/uploads';

export const DEFAULT_STAFF_PLATFORMS: StaffPlatform[] = [
  // Digital platforms (links and logos from the municipality's current staff page, edm.gov.om)
  { id: 'ejada-edm', nameAr: 'منظومة إجادة لقياس الأداء المؤسسي', nameEn: 'Ejada institutional performance system', url: 'https://main.edm.gov.om/ejada/', logoUrl: `${EDM}/2026/09/hawkama-1.png`, icon: 'Gauge', category: 'systems', isNew: true },
  { id: 'maktabi', nameAr: 'مكتبي', nameEn: 'Maktabi', url: 'https://m.dhofar.gov.om/', logoUrl: `${EDM}/2024/07/maktabi2-1.svg`, icon: 'Briefcase', category: 'systems' },
  { id: 'perks', nameAr: 'عروض ومزايا الموظفين', nameEn: 'Employee offers & perks', url: 'https://edm.gov.om/?page_id=3767', logoUrl: `${EDM}/2024/07/mazaya5.svg`, icon: 'Gift', category: 'systems' },
  { id: 'tajawob', nameAr: 'المنصة الوطنية للمقترحات والشكاوى والبلاغات (تجاوب)', nameEn: 'Tajawob – national suggestions & complaints', url: 'https://tajawob.om/p/employees/login', logoUrl: `${EDM}/2025/02/tajawob2.svg`, icon: 'MessageSquare', category: 'gov' },
  { id: 'ncsi', nameAr: 'المركز الوطني للإحصاء والمعلومات', nameEn: 'National Centre for Statistics & Information', url: 'https://www.ncsi.gov.om/ar', logoUrl: `${EDM}/2026/06/National-Center-for-Statistics-and-Information.png`, icon: 'BarChart3', category: 'gov' },
  { id: 'osool', nameAr: 'نظام أصول', nameEn: 'Osool (national assets)', url: 'https://nar.mof.gov.om', logoUrl: `${EDM}/2024/11/asol-1.svg`, icon: 'Boxes', category: 'gov' },
  { id: 'aqrab', nameAr: 'نظام أقرب', nameEn: 'Aqrab', url: 'https://aqrab.edm.gov.om', logoUrl: `${EDM}/2021/10/aqrab.svg`, icon: 'MapPin', category: 'systems' },
  { id: 'mawred', nameAr: 'نظام مورد', nameEn: 'Mawred', url: 'https://mawred.mol.gov.om/OA_HTML/RF.jsp?function_id=30601&resp_id=-1&resp_appl_id=-1&security_group_id=0&lang_code=AR&oas=z54vEfjd-VLyEBxyzOXMwQ..&params=49TlpdAqlydFh.6cFSG7BQ', logoUrl: `${EDM}/2021/10/mawred.png`, icon: 'Globe', category: 'gov' },
  { id: 'ejada', nameAr: 'منصة إجادة', nameEn: 'Ejada performance platform', url: 'https://ejada.gov.om/', logoUrl: `${EDM}/2023/07/ejada.png`, icon: 'Award', category: 'hr' },
  // Finance & investment
  { id: 'ujor', nameAr: 'الأنظمة المالية (أجور)', nameEn: 'Financial systems (Ujor)', url: '', icon: 'Wallet', category: 'finance', isNew: true },
  { id: 'fawtra', nameAr: 'نظام الفوترة', nameEn: 'Invoicing (Fawtra)', url: '', icon: 'Receipt', category: 'finance', isNew: true },
  { id: 'estethmar', nameAr: 'منصة بلدية ظفار للاستثمار', nameEn: 'Dhofar Municipality investment platform', url: '', icon: 'TrendingUp', category: 'finance' },
  // Employee systems
  { id: 'suhail', nameAr: 'سهيل AI', nameEn: 'Suhail AI', url: '', icon: 'Bot', category: 'hr', isNew: true },
  { id: 'attendance', nameAr: 'نظام الحضور والانصراف', nameEn: 'Attendance', url: '', icon: 'Fingerprint', category: 'hr' },
  { id: 'projects', nameAr: 'نظام إدارة المشاريع', nameEn: 'Project management', url: '', icon: 'KanbanSquare', category: 'hr' },
  { id: 'risk', nameAr: 'نظام إدارة المخاطر', nameEn: 'Risk management', url: '', icon: 'ShieldAlert', category: 'hr', isNew: true },
  { id: 'contracts', nameAr: 'نظام العقود', nameEn: 'Contracts', url: '', icon: 'FileSignature', category: 'hr' },
  { id: 'health', nameAr: 'نظام الشؤون الصحية', nameEn: 'Health affairs', url: '', icon: 'HeartPulse', category: 'hr' },
  { id: 'engineering', nameAr: 'نظام الشؤون الهندسية', nameEn: 'Engineering affairs', url: '', icon: 'Building2', category: 'hr' },
  { id: 'excavation', nameAr: 'نظام تصريح الحفر', nameEn: 'Excavation permits', url: '', icon: 'Construction', category: 'hr' },
  // Guides & policies
  { id: 'risk-guide', nameAr: 'الدليل الاسترشادي لإجراءات إدارة المخاطر', nameEn: 'Risk management procedures guide', url: '', icon: 'BookOpen', category: 'guides' },
  { id: 'risk-policy', nameAr: 'سياسة إدارة المخاطر', nameEn: 'Risk management policy', url: '', icon: 'ScrollText', category: 'guides' },
];

export const PLATFORM_CATEGORIES: { id: StaffPlatform['category']; labelAr: string; labelEn: string }[] = [
  { id: 'systems', labelAr: 'الأنظمة العامة', labelEn: 'General systems' },
  { id: 'gov', labelAr: 'المنصات الحكومية', labelEn: 'Government platforms' },
  { id: 'finance', labelAr: 'الأنظمة المالية والاستثمارية', labelEn: 'Finance & investment' },
  { id: 'hr', labelAr: 'أنظمة الموظفين', labelEn: 'Employee systems' },
  { id: 'productivity', labelAr: 'أدوات الإنتاجية', labelEn: 'Productivity tools' },
  { id: 'guides', labelAr: 'الأدلة والسياسات', labelEn: 'Guides & policies' },
];

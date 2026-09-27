
export interface SiteConfig {
  heroTitle: string;
  heroSubtitle: string;
  contactPhone: string;
  contactEmail: string;
  stats?: {
    transactions: number;
    permits: number;
    contracts: number;
    tickets: number;
  };
  categories: string[];
  isMaintenanceMode: boolean;
  footerLinks?: {
    id: string;
    labelAr: string;
    labelEn: string;
    link: string;
    category: 'legal' | 'services' | 'important';
  }[];
  integrations?: {
    accessibilityKey?: string;
    analyticsId?: string;
    mapsApiKey?: string;
    paymentKey?: string;
    customScripts?: string;
  };
  meta?: {
    titleAr: string;
    titleEn: string;
    descriptionAr: string;
    descriptionEn: string;
  };
}

export interface MenuItem {
  id: string;
  labelAr: string;
  labelEn: string;
  link: string;
  order: number;
}

export interface CarouselItem {
  id: string;
  titleAr: string;
  titleEn: string;
  subtitleAr: string;
  subtitleEn: string;
  imageUrl: string;
  linkUrl?: string;
}

export interface NewsItem {
  id: string;
  titleAr: string;
  titleEn: string;
  contentAr: string;
  contentEn: string;
  imageUrl: string;
  createdAt: string;
}

export interface Service {
  id: string;
  title: string;
  titleEn?: string;
  description: string;
  descriptionEn?: string;
  iconName: string;
  customIconUrl?: string;
  category: string;
  isActive: boolean;
  isFeatured?: boolean;
  reqsAr: string[];
  reqsEn: string[];
  fees: string;
  feesEn?: string;
  durationAr?: string;
  durationEn?: string;
  conditionsAr?: string;
  conditionsEn?: string;
  linkUrl?: string;
  type?: 'workflow' | 'link';
}

export interface ServiceApplication {
  id: string;
  serviceId: string;
  serviceName: string;
  citizenName: string;
  status: 'pending' | 'in-review' | 'approved' | 'rejected';
  data: Record<string, any>;
  createdAt: string;
}

export type Vec3 = { x: number; y: number; z: number };

export interface SpatialWindow {
  id: string;
  contentId: string;
  position: Vec3;
  rotation: Vec3;
  scale: Vec3;
}

export interface BuilderComponent {
  id: string;
  type: 'hero' | 'stats' | 'services' | 'text' | 'image' | 'info' | 'heading' | 'video' | 'pdf' | 'accordion' | 'separator' | 'table' | 'progress' | 'avatar' | 'badge' | 'html' | 'stepper' | 'tabs' | 'cards_scroller' | 'style';
  content: any;
  customCss?: string;
  gridSpan?: number; 
  gridHeight?: string; // 'auto' | 'sm' | 'md' | 'lg' | 'full' | 'custom'
  customWidth?: string; 
  customHeight?: string;
  codeType?: 'html' | 'react' | 'dotnet';
}

export interface CustomPage {
  id: string;
  slug: string;
  titleAr: string;
  titleEn: string;
  components: BuilderComponent[];
  createdAt: string;
}

export interface FormField {
  id: string;
  type: 'text' | 'number' | 'email' | 'upload' | 'date' | 'select' | 'multichoice' | 'map' | 'visual_choice' | 'info';
  labelAr: string;
  labelEn: string;
  required: boolean;
  options?: string[];
}

export interface StepLogic {
  fieldId: string;
  value: string;
  targetStepId: string;
}

export interface ServiceStep {
  id: string;
  titleAr: string;
  titleEn: string;
  fields: FormField[];
  actionType?: 'submit' | 'payment';
  defaultNextStepId?: string;
  logic?: StepLogic[];
  position?: { x: number; y: number };
}

export interface ServiceFlow {
  id: string;
  serviceId: string;
  titleAr: string;
  titleEn: string;
  steps: ServiceStep[];
  isActive: boolean;
}

export interface SurveyQuestion {
  id: string;
  type: 'mcq' | 'text' | 'rating';
  iconName?: string;
  questionAr: string;
  questionEn: string;
  options?: { id: string; textAr: string; textEn: string; icon?: string }[];
}

export interface Survey {
  id: string;
  titleAr: string;
  titleEn: string;
  descriptionAr?: string;
  descriptionEn?: string;
  questions: SurveyQuestion[];
  isActive: boolean;
  isPublicPoll?: boolean;
  responsesCount: number;
}

// ─── Access control (RBAC per service) ───────────────────────────────

export type RolePermission =
  | 'view'          // عرض الطلبات
  | 'review'        // مراجعة الطلب
  | 'request_info'  // طلب معلومات إضافية
  | 'field_visit'   // زيارة / معاينة ميدانية
  | 'report'        // إعداد التقرير الفني
  | 'approve'       // اعتماد / موافقة
  | 'reject'        // رفض الطلب
  | 'assign';       // إعادة إسناد المهام

/** A role defined inside a single service, e.g. "مهندس" in ترخيص اللوحات الإرشادية */
export interface ServiceRole {
  id: string;
  serviceId: string;
  code: string;
  nameAr: string;
  nameEn: string;
  permissions: RolePermission[];
  isActive: boolean;
  createdAt: string;
}

/** Municipality staff member, identified by employee number (الرقم الوظيفي) */
export interface StaffUser {
  id: string;
  employeeNumber: string;
  nameAr: string;
  nameEn?: string;
  email?: string;
  department?: string;
  isActive: boolean;
  isSuperAdmin?: boolean;
  createdAt: string;
}

/** Many-to-many link: one user can hold many roles across many services */
export interface UserRoleAssignment {
  id: string;
  userId: string;
  roleId: string;
  serviceId: string;
  assignedAt: string;
  assignedBy?: string;
}

export interface PopupMessage {
  id: string;
  type: 'text' | 'image' | 'video';
  titleAr: string;
  titleEn: string;
  contentAr?: string;
  contentEn?: string;
  mediaUrl?: string;
  isActive: boolean;
  displayDelay?: number;
}

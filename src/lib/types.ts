
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
  /** Sitewide header/footer defaults; pages can override */
  template?: PageTemplateSettings;
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
  /** Staff actions taken on the request, newest last */
  history?: ApplicationEvent[];
}

export interface ApplicationEvent {
  at: string;
  byUserId: string;
  byEmployeeNumber: string;
  action: 'review' | 'request_info' | 'approve' | 'reject' | 'note';
  note?: string;
}

/** Internal platforms listed on the staff portal (available to every employee) */
export interface StaffPlatform {
  id: string;
  nameAr: string;
  nameEn: string;
  url: string;
  icon?: string;
  logoUrl?: string;
  category: 'systems' | 'finance' | 'hr' | 'gov' | 'guides' | 'productivity';
  isNew?: boolean;
}

export type Vec3 = { x: number; y: number; z: number };

export interface SpatialWindow {
  id: string;
  contentId: string;
  position: Vec3;
  rotation: Vec3;
  scale: Vec3;
}

export type BlockType =
  | 'hero' | 'heading' | 'text' | 'info' | 'stats' | 'features' | 'steps' | 'cta' | 'quote'
  | 'image' | 'video' | 'pdf' | 'table' | 'accordion' | 'tabs' | 'avatar' | 'team' | 'badge'
  | 'contact' | 'links' | 'separator' | 'spacer' | 'html' | 'style'
  // legacy types kept so older pages keep loading
  | 'services' | 'progress' | 'stepper' | 'cards_scroller';

/** Visual wrapper options every block can take (identity-bound, no free colors) */
export interface BlockStyle {
  background?: 'none' | 'white' | 'soft' | 'teal' | 'purple' | 'dark' | 'gradient';
  pattern?: 'none' | 'landmark' | 'wave' | 'tree' | 'circle' | 'matrix';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  align?: 'start' | 'center';
  radius?: 'none' | 'md' | 'xl';
  shadow?: boolean;
  animate?: boolean;
  hideOnMobile?: boolean;
  anchor?: string;
}

export interface BuilderComponent {
  id: string;
  type: BlockType;
  content: any;
  style?: BlockStyle;
  customCss?: string;
  gridSpan?: number;
  gridHeight?: string; // 'auto' | 'sm' | 'md' | 'lg' | 'full' | 'custom'
  customWidth?: string;
  customHeight?: string;
  codeType?: 'html' | 'react' | 'dotnet';
}

export type HeaderVariant = 'full' | 'compact' | 'minimal' | 'none';
export type FooterVariant = 'full' | 'compact' | 'none';

/** Header/footer/page-shell options; set per page, with sitewide defaults in siteConfig.template */
export interface PageTemplateSettings {
  header?: HeaderVariant;
  showTicker?: boolean;
  showTopBar?: boolean;
  stickyHeader?: boolean;
  footer?: FooterVariant;
  titleBand?: 'none' | 'simple' | 'pattern' | 'dark';
  width?: 'narrow' | 'normal' | 'wide' | 'full';
  showBreadcrumb?: boolean;
}

export interface CustomPage {
  id: string;
  slug: string;
  titleAr: string;
  titleEn: string;
  descriptionAr?: string;
  descriptionEn?: string;
  status?: 'draft' | 'published';
  template?: PageTemplateSettings;
  components: BuilderComponent[];
  createdAt: string;
  updatedAt?: string;
}

export interface FormField {
  id: string;
  type: 'text' | 'number' | 'email' | 'upload' | 'date' | 'select' | 'multichoice' | 'map' | 'visual_choice' | 'info';
  labelAr: string;
  labelEn: string;
  required: boolean;
  options?: string[];
  optionsEn?: string[];
  content?: { bodyAr?: string; bodyEn?: string };
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
  /** Back-office processing path after submission; staff stages are handled by a service role */
  processStages?: ProcessStage[];
  /** Full swimlane diagram as drawn in the service's process PDF (lanes, positioned boxes, arrows, notes) */
  blueprint?: FlowBlueprint;
  isActive: boolean;
}

export interface BlueprintLane {
  id: string;
  labelAr: string;
  labelEn: string;
  kind: 'applicant' | 'system' | 'staff';
  /** Staff lanes: matches ProcessStage.actorEn so the lane maps to the same service role */
  actorEn?: string;
  roleId?: string;
}

export interface BlueprintNode {
  id: string;
  lane: string;
  /** Horizontal grid position (left → right, as in the PDF) */
  col: number;
  kind: 'start' | 'end' | 'task' | 'decision' | 'subprocess' | 'connector';
  num?: string;
  labelAr: string;
  labelEn: string;
  /** Vertical placement inside the lane when two shapes share a column */
  offset?: 'top' | 'bottom';
  /** Staff tasks: named assignee among the lane role's holders */
  assigneeUserId?: string;
}

export interface BlueprintEdge {
  from: string;
  to: string;
  labelAr?: string;
  labelEn?: string;
  dashed?: boolean;
}

export interface BlueprintNote {
  num: number;
  textAr: string;
  textEn: string;
}

export interface FlowBlueprint {
  /** Source process document */
  source?: string;
  lanes: BlueprintLane[];
  nodes: BlueprintNode[];
  edges: BlueprintEdge[];
  notes: BlueprintNote[];
}

export interface ProcessStage {
  order: number;
  actorAr: string;
  actorEn: string;
  titleAr: string;
  titleEn: string;
  /** ServiceRole.id that handles this stage (staff stages only) */
  roleId?: string;
  /** Optional named assignee among the role holders; empty = any holder of the role */
  assigneeUserId?: string;
}

export interface SurveyQuestion {
  id: string;
  /** mcq = single choice, multi = several choices, text = short, longtext = paragraph */
  type: 'mcq' | 'multi' | 'dropdown' | 'yesno' | 'rating' | 'nps' | 'text' | 'longtext';
  iconName?: string;
  questionAr: string;
  questionEn: string;
  helpAr?: string;
  helpEn?: string;
  required?: boolean;
  options?: { id: string; textAr: string; textEn: string; icon?: string }[];
}

export interface Survey {
  id: string;
  titleAr: string;
  titleEn: string;
  descriptionAr?: string;
  descriptionEn?: string;
  thanksAr?: string;
  thanksEn?: string;
  questions: SurveyQuestion[];
  isActive: boolean;
  isPublicPoll?: boolean;
  anonymous?: boolean;
  startsAt?: string;
  endsAt?: string;
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
  | 'assign'        // إعادة إسناد المهام
  | 'complete';     // تنفيذ الخدمة وإغلاق الطلب

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
  /** Civil (national ID) number — used with the employee number to sign in, or matched from Thiqa */
  civilNumber?: string;
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

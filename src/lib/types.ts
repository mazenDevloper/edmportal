
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
  type: 'hero' | 'stats' | 'services' | 'text' | 'image' | 'info' | 'heading' | 'video' | 'pdf' | 'accordion' | 'separator' | 'table' | 'progress' | 'avatar' | 'badge' | 'html';
  content: any;
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
  type: 'text' | 'number' | 'email' | 'upload' | 'date' | 'select' | 'multichoice' | 'map';
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

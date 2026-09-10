
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
}

export interface NewsTicker {
  id: string;
  title?: string;
  text: string;
  link?: string;
  isActive: boolean;
  createdAt: string;
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

export interface Course {
  id: string;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  imageUrl: string;
  durationAr: string;
  durationEn: string;
  isOpen: boolean;
}

export interface Service {
  id: string;
  title: string;
  titleEn?: string;
  description: string;
  descriptionEn?: string;
  iconName: string;
  category: string;
  isActive: boolean;
  isFeatured?: boolean;
  reqsAr: string[];
  reqsEn: string[];
  fees: string;
  feesEn?: string;
  colorClass?: string;
  linkUrl?: string;
}

export interface ServiceApplication {
  id: string;
  serviceId: string;
  serviceName: string;
  citizenName: string;
  status: 'pending' | 'in-review' | 'approved' | 'rejected';
  data: Record<string, string>;
  createdAt: string;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  role: 'citizen' | 'admin';
  phoneNumber?: string;
}

export type Vec3 = { x: number; y: number; z: number };

export interface SpatialWindow {
  id: string;
  contentId: string;
  position: Vec3;
  rotation: Vec3;
  scale: Vec3;
}

// New Builder Types
export interface BuilderComponent {
  id: string;
  type: 'hero' | 'stats' | 'services' | 'contact' | 'text' | 'image';
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
  type: 'text' | 'number' | 'email' | 'upload' | 'date' | 'select';
  labelAr: string;
  labelEn: string;
  required: boolean;
  options?: string[];
}

export interface ServiceFlow {
  id: string;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  fields: FormField[];
  isActive: boolean;
}

export interface SurveyQuestion {
  id: string;
  type: 'mcq' | 'text' | 'rating';
  questionAr: string;
  questionEn: string;
  options?: string[];
}

export interface Survey {
  id: string;
  titleAr: string;
  titleEn: string;
  questions: SurveyQuestion[];
  isActive: boolean;
  responsesCount: number;
}

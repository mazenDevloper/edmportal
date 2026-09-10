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
  isMaintenanceMode: boolean;
}

export interface NewsTicker {
  id: string;
  text: string;
  link?: string;
  isActive: boolean;
  createdAt: string;
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
  reqsAr: string[];
  reqsEn: string[];
  fees: string;
  feesEn?: string;
  colorClass?: string;
}

export interface ServiceApplication {
  id: string;
  serviceId: string;
  userId: string;
  status: 'pending' | 'in-review' | 'approved' | 'rejected';
  data: any;
  createdAt: any;
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

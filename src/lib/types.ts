
export interface SiteConfig {
  heroTitle: string;
  heroSubtitle: string;
  contactPhone: string;
  contactEmail: string;
  isMaintenanceMode: boolean;
}

export interface Service {
  id: string;
  title: string;
  description: string;
  iconName: string;
  category: string;
  isActive: boolean;
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

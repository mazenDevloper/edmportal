'use client';

import React from 'react';
import * as Icons from 'lucide-react';
import { Service } from '@/lib/types';
import { cn } from '@/lib/utils';

/** A service's icon: its uploaded/external image when set, otherwise its library (lucide) icon */
export function ServiceIcon({ service, size = 24, className }: { service?: Partial<Pick<Service, 'iconName' | 'customIconUrl'>> | null; size?: number; className?: string }) {
  if (service?.customIconUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={service.customIconUrl} alt="" width={size} height={size} className={cn('object-contain', className)} style={{ width: size, height: size }} />;
  }
  const Cmp = (service?.iconName && (Icons as any)[service.iconName]) || Icons.FileText;
  return <Cmp size={size} className={className} aria-hidden />;
}

/** Icons offered in the service builder's library picker */
export const SERVICE_ICON_CHOICES = [
  'FileText', 'FileCheck', 'FileSignature', 'ClipboardList', 'Stamp', 'BadgeCheck', 'Landmark', 'Building', 'Building2', 'Home',
  'Construction', 'HardHat', 'Hammer', 'Ruler', 'MapPin', 'Map', 'Signpost', 'TrafficCone', 'CarFront', 'Truck',
  'Lightbulb', 'Zap', 'Droplets', 'Waves', 'Trash2', 'Recycle', 'Leaf', 'Trees', 'FlaskConical', 'Microscope',
  'Beef', 'Bone', 'Utensils', 'Store', 'ShoppingBag', 'Ticket', 'Tent', 'PartyPopper', 'Megaphone', 'Presentation',
  'GraduationCap', 'Users', 'UserCheck', 'Handshake', 'Scale', 'Gavel', 'Wallet', 'BadgeCent', 'Receipt', 'CreditCard',
  'Phone', 'Mail', 'MessageSquare', 'HelpCircle', 'Globe', 'Link', 'ShieldCheck', 'Clock', 'Calendar', 'Sparkles',
];

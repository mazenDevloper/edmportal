'use client';

import { LegalDocPage } from '@/components/legal/info-page';
import { SERVICE_CONTROLS } from '@/lib/footer-pages';

export default function ServiceControlsPage() {
  return <LegalDocPage doc={SERVICE_CONTROLS} />;
}

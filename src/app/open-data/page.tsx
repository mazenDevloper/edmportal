'use client';

import { LegalDocPage } from '@/components/legal/info-page';
import { OPEN_DATA_LICENSE } from '@/lib/footer-pages';

export default function OpenDataLicensePage() {
  return <LegalDocPage doc={OPEN_DATA_LICENSE} />;
}

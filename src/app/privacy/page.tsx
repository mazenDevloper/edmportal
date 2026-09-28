'use client';

import { LegalDocPage } from '@/components/legal/info-page';
import { PRIVACY } from '@/lib/footer-pages';

export default function PrivacyPage() {
  return <LegalDocPage doc={PRIVACY} />;
}

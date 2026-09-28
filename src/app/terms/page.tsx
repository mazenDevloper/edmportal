'use client';

import { LegalDocPage } from '@/components/legal/info-page';
import { TERMS } from '@/lib/footer-pages';

export default function TermsPage() {
  return <LegalDocPage doc={TERMS} />;
}

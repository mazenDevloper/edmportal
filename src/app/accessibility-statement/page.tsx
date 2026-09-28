'use client';

import { LegalDocPage } from '@/components/legal/info-page';
import { ACCESSIBILITY_STATEMENT } from '@/lib/footer-pages';

export default function AccessibilityStatementPage() {
  return <LegalDocPage doc={ACCESSIBILITY_STATEMENT} />;
}

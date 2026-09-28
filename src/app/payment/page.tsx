'use client';

import { LegalDocPage } from '@/components/legal/info-page';
import { PAYMENT_POLICY } from '@/lib/footer-pages';

export default function PaymentPolicyPage() {
  return <LegalDocPage doc={PAYMENT_POLICY} />;
}

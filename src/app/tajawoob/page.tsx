'use client';

import { ExternalLinkPage } from '@/components/legal/external-link-page';
import { EXTERNAL_LINKS } from '@/lib/footer-pages';

export default function TajawobPage() {
  const g = EXTERNAL_LINKS.tajawob;
  return (
    <ExternalLinkPage url={g.url} title={g.title} desc={g.desc} icon="MessagesSquare" points={[
      { ar: 'تقديم المقترحات والشكاوى والبلاغات لبلدية ظفار ولأي جهة حكومية أخرى.', en: 'Submit suggestions, complaints and reports to Dhofar Municipality or any other government body.' },
      { ar: 'متابعة حالة ما قدمته وتلقي الرد عليه.', en: 'Track what you submitted and receive the response.' },
      { ar: 'الدخول بالهوية الرقمية الوطنية.', en: 'Sign in with the national digital identity.' },
    ]} />
  );
}

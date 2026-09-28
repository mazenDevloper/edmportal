'use client';

import { ExternalLinkPage } from '@/components/legal/external-link-page';
import { EXTERNAL_LINKS } from '@/lib/footer-pages';

export default function GovernorPortalPage() {
  const g = EXTERNAL_LINKS.governor;
  return (
    <ExternalLinkPage url={g.url} title={g.title} desc={g.desc} icon="Landmark" points={[
      { ar: 'أخبار المحافظة وأنشطة مكتب المحافظ.', en: 'Governorate news and the Governor\'s office activities.' },
      { ar: 'المشاريع التنموية في ولايات محافظة ظفار.', en: 'Development projects across the wilayats of Dhofar.' },
      { ar: 'خدمات ومعلومات على مستوى المحافظة وروابط الجهات الحكومية.', en: 'Governorate-level services and information, and links to government bodies.' },
    ]} />
  );
}

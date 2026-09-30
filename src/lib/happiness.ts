/*
 * Happiness meter ("مؤشر السعادة"): anonymous 3-face rating per page, stored in the database as
 * happinessResponses. The index is the share of happy votes plus half the neutral ones (0–100).
 */

export type HappinessScore = 1 | 2 | 3; // 1 unhappy · 2 neutral · 3 happy

export interface HappinessResponse {
  id: string;
  at: string;
  page: string;
  score: HappinessScore;
  reasons: string[];
  comment?: string;
  lang: 'ar' | 'en';
}

export const REASONS: Record<HappinessScore, { id: string; ar: string; en: string }[]> = {
  3: [
    { id: 'easy', ar: 'سهولة الاستخدام', en: 'Easy to use' },
    { id: 'fast', ar: 'سرعة الإنجاز', en: 'Quick' },
    { id: 'clear', ar: 'وضوح المعلومات', en: 'Clear information' },
    { id: 'design', ar: 'تصميم جميل', en: 'Nice design' },
  ],
  2: [
    { id: 'ok_but_slow', ar: 'مقبول لكن بطيء', en: 'OK but slow' },
    { id: 'info_partial', ar: 'المعلومات غير مكتملة', en: 'Information incomplete' },
    { id: 'hard_find', ar: 'صعوبة الوصول لما أريد', en: 'Hard to find things' },
  ],
  1: [
    { id: 'error', ar: 'خطأ تقني', en: 'Technical error' },
    { id: 'missing', ar: 'لم أجد ما أحتاجه', en: "Couldn't find what I needed" },
    { id: 'slow', ar: 'بطء', en: 'Slow' },
    { id: 'confusing', ar: 'غير واضح', en: 'Confusing' },
  ],
};

export function happinessIndex(responses: Pick<HappinessResponse, 'score'>[]) {
  const total = responses.length;
  const happy = responses.filter(r => r.score === 3).length;
  const neutral = responses.filter(r => r.score === 2).length;
  const unhappy = total - happy - neutral;
  return { total, happy, neutral, unhappy, index: total ? Math.round(((happy + neutral / 2) / total) * 100) : null };
}

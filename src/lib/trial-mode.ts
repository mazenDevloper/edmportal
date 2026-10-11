/*
 * Trial phase: the portal is being demonstrated, so sign-in is not required.
 *  - "Start the service" signs the visitor in as a random demo beneficiary and opens the service.
 *  - The admin panels open without the sign-in form.
 * Set NEXT_PUBLIC_TRIAL_MODE=off (and rebuild) to restore Thiqa sign-in and the admin sign-in form.
 * This MUST be off before the portal is opened to the public: the admin panels write to the live database.
 */
export const TRIAL_MODE = (process.env.NEXT_PUBLIC_TRIAL_MODE || '').trim().toLowerCase() !== 'off';

const FIRST = ['أحمد', 'سالم', 'محمد', 'خالد', 'سعيد', 'علي', 'مريم', 'فاطمة', 'عائشة', 'نورة', 'هدى', 'بدر'];
const FAMILY = ['الكثيري', 'المعشني', 'الشحري', 'العمري', 'الرواس', 'باعمر', 'المهري', 'الحضري', 'تبوك', 'الغساني'];
const pick = (list: string[]) => list[Math.floor(Math.random() * list.length)];

/** A made-up beneficiary for the trial sign-in */
export function demoCitizen() {
  const first = pick(FIRST);
  return { name: `${first} ${pick(FIRST.slice(0, 6).filter(n => n !== first))} ${pick(FAMILY)} (تجريبي)`, ssoId: crypto.randomUUID() };
}

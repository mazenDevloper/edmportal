'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Clock, CreditCard, House, LayoutGrid, Wallet } from 'lucide-react';
import { useCitizen } from '@/lib/citizen-session';
import { cn } from '@/lib/utils';

const ITEMS = [
  { href: '/', ar: 'الرئيسية', en: 'Home', icon: House, match: (p: string) => p === '/' },
  { href: '/catalog', ar: 'محطات الحياة', en: 'Life stations', icon: LayoutGrid, match: (p: string) => p.startsWith('/catalog') || p.startsWith('/services') },
  { href: '/account?tab=requests', ar: 'المتابعة', en: 'Tracking', icon: Clock, match: (p: string, tab: string) => p.startsWith('/track') || (p === '/account' && !['documents', 'dues', 'deposits'].includes(tab)) },
  { href: '/account?tab=documents', ar: 'المحفظة', en: 'Wallet', icon: Wallet, match: (p: string, tab: string) => p === '/account' && tab === 'documents' },
  { href: '/account?tab=dues', ar: 'السداد', en: 'Payments', icon: CreditCard, match: (p: string, tab: string) => p === '/account' && ['dues', 'deposits'].includes(tab) },
];

function Bar({ isAr }: { isAr: boolean }) {
  const pathname = usePathname() || '/';
  const tab = useSearchParams().get('tab') || 'requests';
  return (
    <nav aria-label={isAr ? 'تنقل المستفيد' : 'Beneficiary navigation'} className="bg-[#f6f3fa] px-3 py-3">
      <ul className="mx-auto flex w-fit max-w-full items-center gap-1 overflow-x-auto rounded-full bg-white p-1.5 shadow-[0_8px_30px_rgba(71,13,103,0.10)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {ITEMS.map(it => {
          const active = it.match(pathname, tab);
          return (
            <li key={it.href} className="shrink-0">
              <Link href={it.href} aria-current={active ? 'page' : undefined}
                className={cn('flex h-11 items-center gap-2 whitespace-nowrap rounded-full px-4 text-sm font-bold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#470D67] md:px-5 md:text-base',
                  active ? 'bg-[#470D67] text-white' : 'text-slate-800 hover:bg-[#470D67]/5')}>
                <it.icon size={19} className={active ? 'text-[#03CFCB]' : 'text-[#470D67]'} aria-hidden />{isAr ? it.ar : it.en}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** The signed-in beneficiary's own bar under the header: home, life stations, tracking, wallet, payments */
export function CitizenBar({ isAr }: { isAr: boolean }) {
  const citizen = useCitizen();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted || !citizen) return null;
  return <Suspense fallback={null}><Bar isAr={isAr} /></Suspense>;
}

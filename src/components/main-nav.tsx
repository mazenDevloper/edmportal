'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronDown, ExternalLink, Fingerprint, LogOut, PlayCircle } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MAIN_MENU, MENU_HREFS, MENU_LABELS, MenuGroup, MenuLink } from '@/lib/main-menu';
import { MenuItem } from '@/lib/types';
import { maskPhone, useCitizen, useCitizenSession } from '@/lib/citizen-session';
import { cn } from '@/lib/utils';

/** Built-in menu plus database items that aren't already covered */
export function useMenu(dbItems: MenuItem[]): MenuGroup[] {
  const extra = dbItems
    .filter(m => !MENU_HREFS.has(m.link) && !MENU_LABELS.has(m.labelAr))
    .map(m => ({ id: m.id, label: { ar: m.labelAr, en: m.labelEn || m.labelAr }, href: m.link }));
  return [...MAIN_MENU, ...extra];
}

const isActive = (pathname: string, href?: string) => !!href && (href === '/' ? pathname === '/' : pathname.startsWith(href));

type ItemLinkProps = { item: MenuLink; isAr: boolean; className?: string; children?: React.ReactNode } & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'>;

// Forwards the ref and props: DropdownMenuItem (asChild) needs them to focus and drive the item
const ItemLink = React.forwardRef<HTMLAnchorElement, ItemLinkProps>(({ item, isAr, className, children, ...rest }, ref) => {
  const label = isAr ? item.label.ar : item.label.en;
  if (item.external) {
    return (
      <a ref={ref} {...rest} href={item.href} target="_blank" rel="noopener noreferrer" className={className}>
        {children ?? label}
        <ExternalLink size={12} className="shrink-0 opacity-50" aria-hidden />
        <span className="sr-only">{isAr ? ' (يفتح في نافذة جديدة)' : ' (opens in a new tab)'}</span>
      </a>
    );
  }
  return <Link ref={ref} {...rest} href={item.href} className={className}>{children ?? label}</Link>;
});
ItemLink.displayName = 'ItemLink';

/** Desktop bar: plain links and dropdown groups */
export function DesktopMenu({ groups, isAr, pathname }: { groups: MenuGroup[]; isAr: boolean; pathname: string }) {
  const base = 'relative h-10 px-3 rounded-xl text-[15px] font-black whitespace-nowrap flex items-center gap-1.5 transition-colors hover:text-primary hover:bg-primary/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary';
  return (
    <ul className="flex items-center gap-0.5">
      {groups.map(g => {
        const label = isAr ? g.label.ar : g.label.en;
        const active = isActive(pathname, g.href) || (g.children || []).some(c => !c.external && isActive(pathname, c.href));
        const inner = (
          <>
            {g.icon === 'play' && <PlayCircle size={16} className="text-red-500" aria-hidden />}
            {label}
            {g.badge && <span className="px-1.5 py-0.5 rounded-md bg-[#00ccaa] text-white text-[9px] leading-none">{isAr ? g.badge.ar : g.badge.en}</span>}
          </>
        );
        if (!g.children && g.href) {
          return (
            <li key={g.id}>
              <Link href={g.href} aria-current={active ? 'page' : undefined} className={cn(base, active ? 'text-primary' : 'text-slate-700')}>
                {inner}
                {active && <span aria-hidden className="absolute inset-x-3 -bottom-1 h-1 rounded-full bg-secondary" />}
              </Link>
            </li>
          );
        }
        return (
          <li key={g.id}>
            <DropdownMenu modal={false} dir={isAr ? 'rtl' : 'ltr'}>
              <DropdownMenuTrigger className={cn(base, active ? 'text-primary' : 'text-slate-700', 'data-[state=open]:text-primary data-[state=open]:bg-primary/5')}>
                {inner}<ChevronDown size={14} className="opacity-60" aria-hidden />
              </DropdownMenuTrigger>
              <DropdownMenuContent align={isAr ? 'end' : 'start'} sideOffset={8} className={cn('rounded-2xl p-2 z-[60]', g.intro ? 'w-[26rem]' : 'min-w-[16rem]')}>
                {g.intro && (
                  <div className="grid gap-2 p-2">
                    {g.intro.map(b => (
                      <div key={b.title.ar} className="rounded-xl bg-slate-50 p-3">
                        <p className="text-xs font-black text-secondary">{isAr ? b.title.ar : b.title.en}</p>
                        <p className="text-sm font-bold text-slate-700 leading-relaxed">{isAr ? b.text.ar : b.text.en}</p>
                      </div>
                    ))}
                  </div>
                )}
                {g.intro && <DropdownMenuSeparator />}
                {(g.children || []).map(c => (
                  <DropdownMenuItem key={c.href} asChild className="rounded-xl cursor-pointer">
                    <ItemLink item={c} isAr={isAr} className="flex items-center gap-2 px-3 py-2.5 text-sm font-bold text-slate-700">
                      <span className="flex-1">{isAr ? c.label.ar : c.label.en}</span>
                      {c.note && <span className="text-[10px] font-black text-slate-400" dir="ltr">{isAr ? c.note.ar : c.note.en}</span>}
                    </ItemLink>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </li>
        );
      })}
    </ul>
  );
}

/** Mobile sheet: groups open and close in place */
export function MobileMenu({ groups, isAr, pathname }: { groups: MenuGroup[]; isAr: boolean; pathname: string }) {
  return (
    <ul className="flex flex-col gap-1">
      {groups.map(g => {
        const label = isAr ? g.label.ar : g.label.en;
        if (!g.children && g.href) {
          return (
            <li key={g.id}>
              <Link href={g.href} aria-current={isActive(pathname, g.href) ? 'page' : undefined} className={cn('block px-3 py-3 rounded-xl text-xl font-black hover:bg-slate-50', isActive(pathname, g.href) ? 'text-primary' : 'text-slate-800')}>{label}</Link>
            </li>
          );
        }
        return (
          <li key={g.id}>
            <details className="group rounded-xl open:bg-slate-50">
              <summary className="list-none flex items-center gap-2 px-3 py-3 rounded-xl text-xl font-black text-slate-800 cursor-pointer hover:bg-slate-50 [&::-webkit-details-marker]:hidden">
                {g.icon === 'play' && <PlayCircle size={18} className="text-red-500" aria-hidden />}
                <span className="flex-1">{label}</span>
                {g.badge && <span className="px-1.5 py-0.5 rounded-md bg-[#00ccaa] text-white text-[10px]">{isAr ? g.badge.ar : g.badge.en}</span>}
                <ChevronDown size={18} className="transition-transform group-open:rotate-180" aria-hidden />
              </summary>
              <div className="pb-2 px-2 space-y-1">
                {g.intro?.map(b => (
                  <p key={b.title.ar} className="px-3 py-1 text-sm font-bold text-slate-600"><span className="font-black text-secondary">{isAr ? b.title.ar : b.title.en}: </span>{isAr ? b.text.ar : b.text.en}</p>
                ))}
                {(g.children || []).map(c => (
                  <ItemLink key={c.href} item={c} isAr={isAr} className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-base font-bold text-slate-700 hover:bg-white" />
                ))}
              </div>
            </details>
          </li>
        );
      })}
    </ul>
  );
}

/** Beneficiary sign-in through Thiqa (opens the pop-up), or the signed-in number with sign-out */
export function CitizenSignIn({ isAr, className }: { isAr: boolean; className?: string }) {
  const phone = useCitizen();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => { setMounted(true); }, []);
  if (mounted && phone) {
    return (
      <button type="button" onClick={() => useCitizenSession.getState().signOut()} className={cn('h-10 px-4 rounded-full bg-emerald-50 text-emerald-800 font-black text-sm flex items-center gap-2 hover:bg-emerald-100', className)}>
        <span dir="ltr">{maskPhone(phone)}</span><LogOut size={15} className={cn(isAr && '-scale-x-100')} aria-hidden />
        <span className="sr-only">{isAr ? 'تسجيل خروج' : 'Sign out'}</span>
      </button>
    );
  }
  return (
    <button type="button" onClick={() => useCitizenSession.getState().openPrompt()} className={cn('h-10 px-5 rounded-full bg-secondary text-white font-black text-sm flex items-center gap-2 hover:bg-secondary/90', className)}>
      <Fingerprint size={16} aria-hidden />{isAr ? 'تسجيل الدخول' : 'Sign in'}
    </button>
  );
}

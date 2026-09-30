
'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, Bell } from 'lucide-react';
import Image from 'next/image';
import { PopupMessage } from '@/lib/types';
import { useSettingsStore } from '@/lib/settings-store';
import { cn } from '@/lib/utils';
import { parseVideo } from '@/lib/video';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { markPopupSeen, popupEligible } from '@/lib/popup-design';
import { PopupCanvas, ScaledCanvas } from '@/components/popup/popup-canvas';

interface PopupManagerProps {
  popups: PopupMessage[];
}

export function PopupManager({ popups }: PopupManagerProps) {
  const { language } = useSettingsStore();
  const isAr = language === 'ar';
  const [activePopup, setActivePopup] = useState<PopupMessage | null>(null);

  useEffect(() => {
    // First popup that is active, in its schedule and not yet seen at its frequency
    const active = popups.find(p => popupEligible(p));
    if (active) {
      const timer = setTimeout(() => {
        setActivePopup(active);
        markPopupSeen(active);
      }, (active.displayDelay || 0) * 1000);
      return () => clearTimeout(timer);
    }
  }, [popups]);

  if (!activePopup) return null;
  if (activePopup.design) return <DesignedPopup popup={activePopup} isAr={isAr} onClose={() => setActivePopup(null)} />;
  const video = activePopup.type === 'video' ? parseVideo(activePopup.mediaUrl) : null;

  return (
    <Dialog open={!!activePopup} onOpenChange={() => setActivePopup(null)}>
      <DialogContent className={cn(
        "max-w-2xl overflow-hidden rounded-[2rem] border-none shadow-2xl p-0",
        isAr ? "font-arabic" : "font-sans"
      )}>
        <DialogHeader className="sr-only">
          <DialogTitle>{isAr ? activePopup.titleAr : activePopup.titleEn}</DialogTitle>
          <DialogDescription>
            {isAr ? "نافذة تنبيه منبثقة لمستخدمي البوابة" : "Portal announcement popup for users"}
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setActivePopup(null)}
            className="absolute top-4 right-4 z-50 bg-white/20 hover:bg-white/40 text-white rounded-full h-8 w-8 backdrop-blur-md"
          >
            <X size={16} />
          </Button>

          {activePopup.type === 'image' && activePopup.mediaUrl && (
            <div className="relative aspect-video w-full">
              <Image 
                src={activePopup.mediaUrl} 
                alt={isAr ? activePopup.titleAr : activePopup.titleEn} 
                fill 
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-8">
                <h3 className="text-2xl font-black text-white mb-2">{isAr ? activePopup.titleAr : activePopup.titleEn}</h3>
              </div>
            </div>
          )}

          {activePopup.type === 'video' && video && (
            <div className="aspect-video w-full bg-black">
              {video.kind === 'youtube' ? (
                <iframe src={video.embedUrl} title={isAr ? activePopup.titleAr : activePopup.titleEn || activePopup.titleAr}
                  className="w-full h-full" allow="accelerometer; autoplay; encrypted-media; picture-in-picture" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" />
              ) : video.kind === 'file' ? (
                <video src={video.url} controls playsInline className="w-full h-full" />
              ) : (
                <a href={video.url} target="_blank" rel="noopener noreferrer" className="w-full h-full flex items-center justify-center text-white font-black underline">{isAr ? 'مشاهدة الفيديو' : 'Watch the video'}</a>
              )}
            </div>
          )}

          {activePopup.type === 'text' && (
            <div className="p-10 space-y-6 text-center">
              <div className="size-16 rounded-full dm-gradient-primary mx-auto flex items-center justify-center text-white mb-6">
                <Bell className="animate-bounce" size={32} />
              </div>
              <h3 className="text-3xl font-black text-primary">{isAr ? activePopup.titleAr : activePopup.titleEn}</h3>
              <p className="text-slate-500 font-bold leading-loose text-lg">
                {isAr ? activePopup.contentAr : activePopup.contentEn}
              </p>
              <Button onClick={() => setActivePopup(null)} className="dm-gradient-primary rounded-full px-12 h-14 font-black shadow-xl mt-4">
                {isAr ? "فهمت" : "Got it"}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

const POSITION: Record<string, string> = {
  center: 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
  top: 'top-4 left-1/2 -translate-x-1/2',
  'bottom-end': 'bottom-4 ltr:right-4 rtl:left-4',
  'bottom-start': 'bottom-4 ltr:left-4 rtl:right-4',
};
const ANIMATION: Record<string, string> = {
  fade: 'motion-safe:animate-in motion-safe:fade-in duration-300',
  zoom: 'motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95 duration-300',
  'slide-up': 'motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-8 duration-500',
  none: '',
};

/** A popup made in the visual builder */
export function DesignedPopup({ popup, isAr, onClose }: { popup: PopupMessage; isAr: boolean; onClose: () => void }) {
  const d = popup.design!;
  const title = (isAr ? popup.titleAr : popup.titleEn || popup.titleAr) || (isAr ? 'إعلان' : 'Announcement');
  const modal = d.position === 'center' || d.position === 'top';
  return (
    <DialogPrimitive.Root open onOpenChange={o => !o && onClose()} modal={modal}>
      <DialogPrimitive.Portal>
        {modal && <DialogPrimitive.Overlay className="fixed inset-0 z-[80] motion-safe:animate-in motion-safe:fade-in" style={{ background: d.overlay }} />}
        <DialogPrimitive.Content dir={isAr ? 'rtl' : 'ltr'}
          onPointerDownOutside={e => { if (!d.closeOnOverlay) e.preventDefault(); }}
          onInteractOutside={e => { if (!d.closeOnOverlay) e.preventDefault(); }}
          className={cn('fixed z-[81] outline-none', POSITION[d.position] || POSITION.center, ANIMATION[d.animation])}
          style={{ filter: 'drop-shadow(0 25px 50px rgba(15,23,42,0.35))' }}>
          <DialogPrimitive.Title className="sr-only">{title}</DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">{isAr ? 'نافذة إعلان منبثقة' : 'Announcement popup'}</DialogPrimitive.Description>
          <ScaledCanvas design={d}>{() => <PopupCanvas design={d} isAr={isAr} onClose={onClose} />}</ScaledCanvas>
          {d.closeButton && (
            <DialogPrimitive.Close className="absolute top-3 ltr:right-3 rtl:left-3 z-10 size-9 rounded-full bg-black/35 hover:bg-black/55 text-white flex items-center justify-center backdrop-blur focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
              aria-label={isAr ? 'إغلاق' : 'Close'}>
              <X size={18} />
            </DialogPrimitive.Close>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}


'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, Bell } from 'lucide-react';
import Image from 'next/image';
import { PopupMessage } from '@/lib/types';
import { useSettingsStore } from '@/lib/settings-store';
import { cn } from '@/lib/utils';

interface PopupManagerProps {
  popups: PopupMessage[];
}

export function PopupManager({ popups }: PopupManagerProps) {
  const { language } = useSettingsStore();
  const isAr = language === 'ar';
  const [activePopup, setActivePopup] = useState<PopupMessage | null>(null);

  useEffect(() => {
    const active = popups.find(p => p.isActive);
    if (active) {
      const timer = setTimeout(() => {
        setActivePopup(active);
      }, (active.displayDelay || 0) * 1000);
      return () => clearTimeout(timer);
    }
  }, [popups]);

  if (!activePopup) return null;

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

          {activePopup.type === 'video' && activePopup.mediaUrl && (
            <div className="aspect-video w-full bg-black">
              <iframe 
                src={activePopup.mediaUrl.replace('watch?v=', 'embed/')} 
                className="w-full h-full" 
                allow="autoplay; encrypted-media" 
                allowFullScreen 
              />
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

"use client";

import React from 'react';
import { GlassXIcon } from '@/components/icons';

const SpatialWindow = React.memo(({ title, children, onClose, onMouseDown, size }: { title: string; children: React.ReactNode, onClose: (e: React.MouseEvent) => void; onMouseDown: (e: React.MouseEvent) => void; size: { width: number, height: number } }) => {
  return (
    <div className="glass-window" style={{ width: `${size.width}px`, height: `${size.height}px` }}>
      <div className="relative flex h-full flex-col">
        <header onMouseDown={onMouseDown} className="glass-window-header flex items-center justify-between border-b border-accent/10 px-4 py-2">
          <h3 className="font-medium text-white/80">{title}</h3>
          <button onClick={onClose} className="z-10 rounded-full p-1 text-white/50 transition-colors hover:bg-white/10 hover:text-white" aria-label="Close Window">
            <GlassXIcon wrapperClassName='bg-transparent hover:bg-white/10' className='size-4 text-white/70 hover:text-white' />
          </button>
        </header>
        <div className="flex-grow overflow-hidden">{children}</div>
      </div>
    </div>
  );
});
SpatialWindow.displayName = 'SpatialWindow';

export default SpatialWindow;

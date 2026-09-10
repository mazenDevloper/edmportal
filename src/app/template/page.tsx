'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Layout } from 'lucide-react';
import Link from 'next/link';

// Dynamically import the immersion canvas to prevent potential SSR/window constraints during layout generation
const ImmersionCanvas = dynamic(
  () => import('@/components/immersion-canvas'),
  { ssr: false }
);

export default function ImmersionTemplatePage() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans select-none">
      {/* Immersive Top Control Bar */}
      <div className="absolute top-4 left-4 z-50 flex items-center gap-4 bg-background/60 backdrop-blur-md px-4 py-2 rounded-xl border border-accent/20 text-white">
        <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-white/10 rounded-lg" asChild>
          <Link href="/">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="h-4 w-px bg-white/20" />
        <div className="flex items-center gap-2">
          <Layout className="h-4 w-4 text-accent" />
          <span className="text-xs font-black tracking-wider uppercase">Dhofar Immersive Spatial Hub</span>
        </div>
      </div>

      {/* Primary 3D Workspace Environment */}
      <div className="w-full h-full">
        <ImmersionCanvas />
      </div>
    </div>
  );
}

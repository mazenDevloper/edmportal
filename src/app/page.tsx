'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

const ImmersionCanvas = dynamic(
  () => import('@/components/immersion-canvas'),
  {
    ssr: false,
    loading: () => (
      <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        <div className="flex flex-col items-center gap-4">
          <Skeleton className="h-24 w-48 rounded-lg" />
          <p className="text-lg text-white/80">Loading Immersive Environment...</p>
          <Skeleton className="h-4 w-64" />
        </div>
      </div>
    ),
  }
);

export default function Home() {
  return (
    <main className="h-dvh w-screen overflow-hidden bg-background">
      <ImmersionCanvas />
    </main>
  );
}

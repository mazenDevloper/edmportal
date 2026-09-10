
'use client';

import React, { useMemo } from 'react';
import Image from 'next/image';
import { useFirestore, useCollection, useDoc, useUser } from '@/firebase';
import { collection, doc, query, where, addDoc, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Search, 
  Building2, 
  FileText, 
  MapPin, 
  CreditCard, 
  UserCircle, 
  Phone, 
  Info,
  Calendar,
  Gavel,
  Globe,
  PlusCircle,
  LayoutDashboard
} from 'lucide-react';
import Link from 'next/link';
import { Service, SiteConfig } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

const ICON_MAP: Record<string, any> = {
  Building2, FileText, MapPin, CreditCard, UserCircle, Phone, Info, Calendar, Gavel, Globe
};

export default function DhofarPortal() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const siteConfigRef = useMemo(() => doc(firestore, 'config', 'site'), [firestore]);
  const { data: siteConfig, loading: siteLoading } = useDoc<SiteConfig>(siteConfigRef);

  const servicesQuery = useMemo(() => 
    query(collection(firestore, 'services'), where('isActive', '==', true)), 
    [firestore]
  );
  const { data: services, loading: servicesLoading } = useCollection<Service>(servicesQuery);

  const handleApply = (service: Service) => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please sign in to apply for municipal services.",
      });
      return;
    }

    addDoc(collection(firestore, 'applications'), {
      serviceId: service.id,
      userId: user.uid,
      status: 'pending',
      createdAt: serverTimestamp(),
      data: { appliedFrom: 'Portal' }
    });

    toast({
      title: "Application Submitted",
      description: `Your request for ${service.title} has been received.`,
    });
  };

  if (siteLoading || servicesLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center p-8">
        <div className="space-y-4 w-full max-w-4xl">
          <Skeleton className="h-12 w-3/4" />
          <Skeleton className="h-[400px] w-full" />
          <div className="grid grid-cols-3 gap-4">
            <Skeleton className="h-40" /><Skeleton className="h-40" /><Skeleton className="h-40" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Top Bar */}
      <div className="bg-[#008E91] px-4 py-2 text-xs text-white sm:px-8 border-b border-white/10">
        <div className="mx-auto flex max-w-7xl justify-between items-center">
          <div className="flex gap-6 items-center">
            <span className="flex items-center gap-1 font-semibold"><Phone className="h-3.5 w-3.5" /> {siteConfig?.contactPhone || '1111'}</span>
            <span className="hidden sm:inline opacity-90">Dhofar Municipality Call Center</span>
          </div>
          <div className="flex gap-4 items-center">
            <Link href="/admin" className="flex items-center gap-1 hover:text-[#94F7F2] font-semibold">
              <LayoutDashboard className="h-3 w-3" /> Dashboard
            </Link>
            <div className="h-4 w-px bg-white/20" />
            <button className="flex items-center gap-1 hover:text-[#94F7F2] font-bold">
              <Globe className="h-3 w-3" /> العربية
            </button>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className="sticky top-0 z-50 border-b bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-8">
          <div className="flex items-center">
            <div className="relative h-16 w-64 md:h-20 md:w-80">
              <Image
                src="https://edm.gov.om/wp-content/uploads/2026/09/headerlogo2.png"
                alt="Dhofar Municipality Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Button className="dm-gradient-primary dm-gradient-hover px-8 font-bold">
              {user ? user.displayName || 'My Account' : 'Sign In'}
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative h-[450px] w-full overflow-hidden bg-[#008E91]">
        <Image
          src="https://picsum.photos/seed/salalah/1920/800"
          alt="Salalah Landscape"
          fill
          className="object-cover brightness-[0.6] opacity-40"
          priority
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="mx-auto max-w-4xl px-4 text-center text-white">
            <h2 className="mb-6 text-4xl font-bold tracking-tight sm:text-6xl drop-shadow-lg text-white">
              {siteConfig?.heroTitle || 'Gateway to Municipal Services'}
            </h2>
            <p className="mb-8 text-xl opacity-90">{siteConfig?.heroSubtitle}</p>
            <div className="relative mx-auto max-w-2xl bg-white/10 p-2 rounded-full backdrop-blur-sm">
              <Search className="absolute left-6 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <Input 
                className="h-14 w-full rounded-full border-none bg-white pl-14 pr-8 text-lg text-black shadow-2xl focus-visible:ring-2 focus-visible:ring-[#03CFCB]" 
                placeholder="Search for a service... (e.g. Building Permit)"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <main className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-8">
        <div className="mb-12 border-b-2 border-[#94F7F2] pb-4 flex justify-between items-end">
          <div>
            <h3 className="text-3xl font-extrabold text-[#008E91]">E-Services Portal</h3>
            <p className="mt-2 text-slate-600">Unified access to digital municipal transactions</p>
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {services?.map((service) => {
            const Icon = ICON_MAP[service.iconName] || Info;
            return (
              <Card key={service.id} className="transition-all hover:shadow-lg hover:-translate-y-1 group">
                <CardHeader className="flex flex-row items-center gap-4 bg-slate-50/50 group-hover:bg-[#94F7F2]/10">
                  <div className="rounded-lg bg-white p-3 shadow-sm border border-slate-100">
                    <Icon className="h-7 w-7 text-[#008E91]" />
                  </div>
                  <div>
                    <CardTitle className="text-lg text-[#008E91]">{service.title}</CardTitle>
                    <span className="text-[10px] uppercase font-bold text-slate-400">{service.category}</span>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <CardDescription className="text-sm mb-4 line-clamp-2">{service.description}</CardDescription>
                  <Button 
                    variant="link" 
                    className="px-0 text-[#008E91] font-bold"
                    onClick={() => handleApply(service)}
                  >
                    Start Application →
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </main>
    </div>
  );
}

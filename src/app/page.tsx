'use client';

import React from 'react';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
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
  Gavel
} from 'lucide-react';

export default function DhofarPortal() {
  const heroImage = PlaceHolderImages.find(img => img.id === 'dhofar-hero');

  const services = [
    { title: 'Building Permits', icon: Building2, desc: 'Apply for residential and commercial permits', color: 'text-blue-600' },
    { title: 'Health Certificates', icon: FileText, desc: 'Medical clearance for workers and businesses', color: 'text-green-600' },
    { title: 'Rent Contracts', icon: Gavel, desc: 'Register and authenticate tenancy agreements', color: 'text-amber-600' },
    { title: 'Bill Payments', icon: CreditCard, desc: 'Pay municipal taxes and utility fees', color: 'text-purple-600' },
    { title: 'Land Services', icon: MapPin, desc: 'Land survey and allocation requests', color: 'text-emerald-600' },
    { title: 'Appointments', icon: Calendar, desc: 'Book an office visit with municipal officials', color: 'text-rose-600' },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      {/* Top Bar */}
      <div className="bg-primary px-4 py-2 text-xs text-white sm:px-8">
        <div className="mx-auto flex max-w-7xl justify-between items-center">
          <div className="flex gap-4">
            <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> 1111</span>
            <span className="hidden sm:inline">Dhofar Municipality Call Center</span>
          </div>
          <div className="flex gap-4">
            <button className="hover:underline">العربية</button>
            <button className="hover:underline">Login</button>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Building2 className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-primary leading-tight">Dhofar Municipality</h1>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Sultanate of Oman</p>
            </div>
          </div>
          
          <nav className="hidden lg:flex items-center gap-8 text-sm font-medium">
            <a href="#" className="text-primary border-b-2 border-primary pb-1">Home</a>
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors">E-Services</a>
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors">Open Data</a>
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors">Tenders</a>
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors">Contact</a>
          </nav>

          <div className="flex items-center gap-4">
            <Button variant="outline" className="hidden sm:flex gap-2">
              <UserCircle className="h-4 w-4" />
              My Account
            </Button>
            <Button className="bg-primary text-white hover:bg-primary/90">Sign In</Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative h-[500px] w-full overflow-hidden">
        {heroImage && (
          <Image
            src={heroImage.imageUrl}
            alt={heroImage.description}
            fill
            className="object-cover brightness-[0.7]"
            priority
            data-ai-hint={heroImage.imageHint}
          />
        )}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="mx-auto max-w-4xl px-4 text-center text-white">
            <h2 className="mb-6 text-4xl font-bold tracking-tight sm:text-6xl">
              Excellence in Service, <br />Sustainable Future for Dhofar
            </h2>
            <div className="relative mx-auto max-w-2xl">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input 
                className="h-14 w-full rounded-full border-none bg-white pl-12 pr-6 text-lg text-black shadow-2xl focus-visible:ring-primary" 
                placeholder="Search for a service... (e.g. Building Permit)"
              />
            </div>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Button size="lg" className="bg-secondary text-secondary-foreground hover:bg-secondary/90">View All Services</Button>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">Follow Application Status</Button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Services Grid */}
      <main className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-8">
        <div className="mb-12 text-center">
          <h3 className="text-3xl font-bold text-slate-900">Popular Services</h3>
          <p className="mt-2 text-muted-foreground">Access our most requested e-services instantly</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service, i) => (
            <Card key={i} className="transition-all hover:gov-shadow hover:-translate-y-1 group">
              <CardHeader className="flex flex-row items-center gap-4">
                <div className={`rounded-xl bg-slate-100 p-3 group-hover:bg-primary/5 transition-colors`}>
                  <service.icon className={`h-8 w-8 ${service.color}`} />
                </div>
                <div>
                  <CardTitle className="text-lg">{service.title}</CardTitle>
                  <CardDescription className="text-xs">{service.desc}</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <Button variant="link" className="px-0 text-primary hover:text-primary/80 group-hover:underline">
                  Access Service →
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Announcement Section */}
        <section className="mt-24 rounded-3xl bg-primary px-8 py-12 text-white">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur-sm">
                <Info className="h-3 w-3" />
                Latest Update
              </div>
              <h3 className="text-3xl font-bold">New Unified Portal for Property Registration</h3>
              <p className="mt-4 text-white/80 leading-relaxed">
                In line with our digital transformation goals, we have launched a new portal for all property and building-related services. This update includes simplified documentation and faster processing times.
              </p>
              <Button className="mt-8 bg-white text-primary hover:bg-white/90">Read More</Button>
            </div>
            <div className="relative h-64 overflow-hidden rounded-2xl border border-white/20 sm:h-80">
              <Image 
                src="https://picsum.photos/seed/dhofar-portal/800/600" 
                alt="Digital Portal" 
                fill 
                className="object-cover"
              />
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t bg-slate-900 pt-16 pb-8 text-slate-300">
        <div className="mx-auto max-w-7xl px-4 sm:px-8">
          <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Building2 className="h-6 w-6 text-secondary" />
                <span className="text-lg font-bold text-white">Dhofar Municipality</span>
              </div>
              <p className="text-sm leading-relaxed">
                Dedicated to improving the quality of life in Dhofar through sustainable urban planning and citizen-centric services.
              </p>
            </div>
            <div>
              <h4 className="mb-4 font-bold text-white">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white">Services Directory</a></li>
                <li><a href="#" className="hover:text-white">Town Planning</a></li>
                <li><a href="#" className="hover:text-white">Health & Environment</a></li>
                <li><a href="#" className="hover:text-white">Tenders & Contracts</a></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 font-bold text-white">Contact Info</h4>
              <ul className="space-y-2 text-sm">
                <li>Toll Free: 1111</li>
                <li>Email: info@dm.gov.om</li>
                <li>Salalah, Dhofar Governorate</li>
                <li>Sultanate of Oman</li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 font-bold text-white">Stay Connected</h4>
              <div className="flex gap-4">
                {/* Social icons could go here */}
                <div className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 transition-colors cursor-pointer" />
                <div className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 transition-colors cursor-pointer" />
                <div className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 transition-colors cursor-pointer" />
              </div>
              <p className="mt-4 text-xs">Download our mobile app</p>
              <div className="mt-2 flex gap-2">
                <div className="h-8 w-24 rounded bg-white/10" />
                <div className="h-8 w-24 rounded bg-white/10" />
              </div>
            </div>
          </div>
          <div className="mt-16 border-t border-slate-800 pt-8 text-center text-xs">
            <p>&copy; 2024 Dhofar Municipality. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

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
  Gavel,
  Globe
} from 'lucide-react';

export default function DhofarPortal() {
  const heroImage = PlaceHolderImages.find(img => img.id === 'dhofar-hero');
  const mainLogo = PlaceHolderImages.find(img => img.id === 'dm-main-logo');

  const services = [
    { title: 'Building Permits', icon: Building2, desc: 'Apply for residential and commercial permits' },
    { title: 'Health Certificates', icon: FileText, desc: 'Medical clearance for workers and businesses' },
    { title: 'Rent Contracts', icon: Gavel, desc: 'Register and authenticate tenancy agreements' },
    { title: 'Bill Payments', icon: CreditCard, desc: 'Pay municipal taxes and utility fees' },
    { title: 'Land Services', icon: MapPin, desc: 'Land survey and allocation requests' },
    { title: 'Appointments', icon: Calendar, desc: 'Book an office visit with municipal officials' },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Top Bar */}
      <div className="bg-[#008E91] px-4 py-2 text-xs text-white sm:px-8 border-b border-white/10">
        <div className="mx-auto flex max-w-7xl justify-between items-center">
          <div className="flex gap-6 items-center">
            <span className="flex items-center gap-1 font-semibold"><Phone className="h-3.5 w-3.5" /> 1111</span>
            <span className="hidden sm:inline opacity-90">Dhofar Municipality Call Center</span>
            <span className="hidden md:flex items-center gap-2 border-l border-white/20 pl-4">
              <Calendar className="h-3.5 w-3.5" />
              Monday, 20 May 2024
            </span>
          </div>
          <div className="flex gap-4 items-center">
            <button className="flex items-center gap-1 hover:text-[#94F7F2] font-bold">
              <Globe className="h-3 w-3" /> العربية
            </button>
            <div className="h-4 w-px bg-white/20" />
            <button className="hover:text-[#94F7F2] font-semibold">Login</button>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className="sticky top-0 z-50 border-b bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-8">
          <div className="flex items-center">
            {mainLogo && (
              <div className="relative h-16 w-64 md:h-20 md:w-80">
                <Image
                  src={mainLogo.imageUrl}
                  alt={mainLogo.description}
                  fill
                  className="object-contain"
                  priority
                  data-ai-hint={mainLogo.imageHint}
                />
              </div>
            )}
            {/* Tower logo hidden per instruction */}
          </div>
          
          <div className="flex items-center gap-4">
            <Button variant="outline" className="hidden sm:flex gap-2 border-[#008E91] text-[#008E91] hover:bg-[#008E91]/5 font-bold">
              <UserCircle className="h-4 w-4" />
              Portal Access
            </Button>
            <Button className="dm-gradient-primary dm-gradient-hover px-8 font-bold">
              Sign In
            </Button>
          </div>
        </div>
        
        {/* Main Navigation */}
        <nav className="bg-[#008E91] hidden lg:block">
          <div className="mx-auto max-w-7xl px-8">
            <ul className="flex items-center">
              <li><a href="#" className="dm-nav-link dm-nav-link-active inline-block">Home</a></li>
              <li><a href="#" className="dm-nav-link inline-block">E-Services</a></li>
              <li><a href="#" className="dm-nav-link inline-block">About Municipality</a></li>
              <li><a href="#" className="dm-nav-link inline-block">Open Data</a></li>
              <li><a href="#" className="dm-nav-link inline-block">Tenders</a></li>
              <li><a href="#" className="dm-nav-link inline-block">Contact Us</a></li>
            </ul>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative h-[450px] w-full overflow-hidden">
        {heroImage && (
          <Image
            src={heroImage.imageUrl}
            alt={heroImage.description}
            fill
            className="object-cover brightness-[0.75]"
            priority
            data-ai-hint={heroImage.imageHint}
          />
        )}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="mx-auto max-w-4xl px-4 text-center text-white">
            <h2 className="mb-6 text-4xl font-bold tracking-tight sm:text-6xl drop-shadow-lg text-white">
              Gateway to Municipal Services
            </h2>
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

      {/* Main Services Grid */}
      <main className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-8 bg-[#fefefe]">
        <div className="mb-12 border-b-2 border-[#94F7F2] pb-4">
          <h3 className="text-3xl font-extrabold text-[#008E91]">E-Services Portal</h3>
          <p className="mt-2 text-slate-600">Unified access to all municipal transactions and digital services</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service, i) => (
            <Card key={i} className="transition-all hover:gov-shadow hover:-translate-y-1 border-slate-100 overflow-hidden group">
              <CardHeader className="flex flex-row items-center gap-4 bg-slate-50/50 group-hover:bg-[#94F7F2]/10 transition-colors">
                <div className="rounded-lg bg-white p-3 shadow-sm border border-slate-100">
                  <service.icon className="h-7 w-7 text-[#008E91]" />
                </div>
                <div>
                  <CardTitle className="text-lg text-[#008E91]">{service.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <CardDescription className="text-sm mb-4 line-clamp-2">{service.desc}</CardDescription>
                <Button variant="link" className="px-0 text-[#008E91] font-bold hover:text-[#470D67]">
                  Start Application →
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Info Card */}
        <section className="mt-20 rounded-2xl overflow-hidden shadow-xl border border-slate-100">
          <div className="grid lg:grid-cols-2">
            <div className="bg-[#008E91] p-12 text-white flex flex-col justify-center">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-1.5 text-xs font-bold uppercase tracking-wider backdrop-blur-sm">
                <Info className="h-4 w-4" />
                Latest Update
              </div>
              <h3 className="text-3xl font-bold text-white !important">Property Registration Digital Portal</h3>
              <p className="mt-6 text-white/90 leading-relaxed text-lg">
                We have enhanced our property registration workflow to be 100% digital. Track your applications in real-time and receive notifications via SMS.
              </p>
              <div className="mt-10 flex gap-4">
                <Button className="bg-white text-[#008E91] hover:bg-[#94F7F2] font-bold px-8">Read More</Button>
                <Button variant="outline" className="border-white text-white hover:bg-white/10 font-bold">Watch Tutorial</Button>
              </div>
            </div>
            <div className="relative h-80 lg:h-auto">
              <Image 
                src="https://picsum.photos/seed/dhofar-gov-service/800/600" 
                alt="Digital Transformation" 
                fill 
                className="object-cover"
              />
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t">
        <div className="bg-[#008E91] py-16 text-white">
          <div className="mx-auto max-w-7xl px-8">
            <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-white rounded-lg flex items-center justify-center">
                    <Building2 className="text-[#008E91] h-6 w-6" />
                  </div>
                  <span className="text-xl font-black tracking-tight text-white !important">DHOFAR MUNICIPALITY</span>
                </div>
                <p className="text-sm leading-relaxed opacity-80">
                  Providing sustainable and efficient municipal services to enhance the standard of living in the Dhofar Governorate.
                </p>
              </div>
              
              <div>
                <h4 className="mb-6 text-lg font-bold border-b border-white/20 pb-2 text-white !important">Citizen Tools</h4>
                <ul className="space-y-3 text-sm font-medium">
                  <li><a href="#" className="hover:text-[#94F7F2] transition-colors">Apply for Service</a></li>
                  <li><a href="#" className="hover:text-[#94F7F2] transition-colors">Application Status</a></li>
                  <li><a href="#" className="hover:text-[#94F7F2] transition-colors">Payment Portal</a></li>
                  <li><a href="#" className="hover:text-[#94F7F2] transition-colors">Suggestion Box</a></li>
                </ul>
              </div>

              <div>
                <h4 className="mb-6 text-lg font-bold border-b border-white/20 pb-2 text-white !important">Direct Contact</h4>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-center gap-2"><Phone className="h-4 w-4" /> Toll Free: 1111</li>
                  <li className="flex items-center gap-2"><Globe className="h-4 w-4" /> info@dm.gov.om</li>
                  <li className="flex items-start gap-2"><MapPin className="h-4 w-4 mt-0.5" /> Salalah, Sultanate of Oman</li>
                </ul>
              </div>

              <div>
                <h4 className="mb-6 text-lg font-bold border-b border-white/20 pb-2 text-white !important">Follow DM</h4>
                <div className="flex gap-3 mb-6">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="h-9 w-9 rounded-full bg-white/10 hover:bg-[#03CFCB] transition-colors cursor-pointer flex items-center justify-center border border-white/10" />
                  ))}
                </div>
                <p className="text-xs uppercase tracking-widest opacity-60 mb-2">Download App</p>
                <div className="flex gap-2">
                  <div className="h-8 w-24 rounded bg-white/20 hover:bg-white/30 transition-colors cursor-pointer" />
                  <div className="h-8 w-24 rounded bg-white/20 hover:bg-white/30 transition-colors cursor-pointer" />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-[#007a7c] py-6 text-center text-xs text-white/70 font-medium">
          <div className="mx-auto max-w-7xl px-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p>&copy; 2024 Dhofar Municipality. Sultanate of Oman. All rights reserved.</p>
            <div className="flex gap-6 uppercase tracking-widest">
              <a href="#" className="hover:text-white">Privacy Policy</a>
              <a href="#" className="hover:text-white">Terms of Use</a>
              <a href="#" className="hover:text-white">Sitemap</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

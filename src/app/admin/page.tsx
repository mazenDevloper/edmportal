
'use client';

import React, { useState, useMemo } from 'react';
import { useFirestore, useCollection, useDoc } from '@/firebase';
import { collection, doc, setDoc, addDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Service, SiteConfig, ServiceApplication, NewsTicker } from '@/lib/types';
import { Settings, Plus, Save, Trash2, CheckCircle, Clock, Megaphone, BarChart3 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function AdminDashboard() {
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const siteConfigRef = useMemo(() => doc(firestore, 'config', 'site'), [firestore]);
  const { data: siteConfig } = useDoc<SiteConfig>(siteConfigRef);
  
  const newsQuery = useMemo(() => collection(firestore, 'news_ticker'), [firestore]);
  const { data: newsItems } = useCollection<NewsTicker>(newsQuery);

  const servicesQuery = useMemo(() => collection(firestore, 'services'), [firestore]);
  const { data: services } = useCollection<Service>(servicesQuery);

  const applicationsQuery = useMemo(() => collection(firestore, 'applications'), [firestore]);
  const { data: applications } = useCollection<ServiceApplication>(applicationsQuery);

  const [newService, setNewService] = useState({ title: '', description: '', iconName: 'Info', category: 'General' });
  const [newNews, setNewNews] = useState('');

  const updateConfig = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setDoc(siteConfigRef, {
      heroTitle: formData.get('heroTitle'),
      heroSubtitle: formData.get('heroSubtitle'),
      contactPhone: formData.get('contactPhone'),
      stats: {
        transactions: Number(formData.get('statTransactions')),
        permits: Number(formData.get('statPermits')),
        contracts: Number(formData.get('statContracts')),
        tickets: Number(formData.get('statTickets')),
      },
      isMaintenanceMode: false
    }, { merge: true });
    toast({ title: "Config Saved", description: "Site identity and stats updated." });
  };

  const addTickerItem = () => {
    if (!newNews) return;
    addDoc(collection(firestore, 'news_ticker'), {
      text: newNews,
      isActive: true,
      createdAt: new Date().toISOString()
    });
    setNewNews('');
    toast({ title: "News Added", description: "The ticker item is now live." });
  };

  const toggleNews = (id: string, current: boolean) => {
    updateDoc(doc(firestore, 'news_ticker', id), { isActive: !current });
  };

  const createService = () => {
    addDoc(collection(firestore, 'services'), { ...newService, isActive: true });
    setNewService({ title: '', description: '', iconName: 'Info', category: 'General' });
    toast({ title: "Service Created" });
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="mx-auto max-w-7xl">
        <h1 className="text-3xl font-bold text-[#008E91] mb-8 flex items-center gap-2">
          <Settings className="h-8 w-8" /> Admin Control Panel
        </h1>

        <Tabs defaultValue="site" className="w-full">
          <TabsList className="bg-white border mb-8 flex overflow-x-auto">
            <TabsTrigger value="site">Site Identity</TabsTrigger>
            <TabsTrigger value="stats">Portal Statistics</TabsTrigger>
            <TabsTrigger value="ticker">News Ticker</TabsTrigger>
            <TabsTrigger value="services">Services Catalog</TabsTrigger>
            <TabsTrigger value="applications">Applications</TabsTrigger>
          </TabsList>

          <TabsContent value="site">
            <Card>
              <CardHeader><CardTitle>Branding & Hero Content</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={updateConfig} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-600">Hero Title</label>
                      <Input name="heroTitle" defaultValue={siteConfig?.heroTitle} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-600">Support Phone</label>
                      <Input name="contactPhone" defaultValue={siteConfig?.contactPhone} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-600">Hero Subtitle</label>
                    <Textarea name="heroSubtitle" defaultValue={siteConfig?.heroSubtitle} />
                  </div>
                  <Button type="submit" className="dm-gradient-primary">
                    <Save className="h-4 w-4 mr-2" /> Update Content
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stats">
            <Card>
              <CardHeader><CardTitle>Municipal Performance Stats</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={updateConfig} className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase text-slate-500">Electronic Transactions</label>
                      <Input name="statTransactions" type="number" defaultValue={siteConfig?.stats?.transactions} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase text-slate-500">Building Permits</label>
                      <Input name="statPermits" type="number" defaultValue={siteConfig?.stats?.permits} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase text-slate-500">Lease Contracts</label>
                      <Input name="statContracts" type="number" defaultValue={siteConfig?.stats?.contracts} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase text-slate-500">E-Tickets</label>
                      <Input name="statTickets" type="number" defaultValue={siteConfig?.stats?.tickets} />
                    </div>
                  </div>
                  <Button type="submit" className="dm-gradient-primary">
                    <BarChart3 className="h-4 w-4 mr-2" /> Sync Statistics
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ticker">
            <div className="grid lg:grid-cols-3 gap-8">
              <Card className="lg:col-span-1">
                <CardHeader><CardTitle>Add Announcement</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <Textarea 
                    placeholder="Enter breaking news text..." 
                    value={newNews} 
                    onChange={e => setNewNews(e.target.value)} 
                  />
                  <Button onClick={addTickerItem} className="w-full bg-[#470D67]">
                    <Plus className="h-4 w-4 mr-2" /> Add to Ticker
                  </Button>
                </CardContent>
              </Card>
              <Card className="lg:col-span-2">
                <CardHeader><CardTitle>Active Announcements</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {newsItems?.map(item => (
                      <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg bg-white">
                        <p className="text-sm font-medium line-clamp-1">{item.text}</p>
                        <div className="flex gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className={item.isActive ? "text-green-600" : "text-slate-400"}
                            onClick={() => toggleNews(item.id, item.isActive)}
                          >
                            {item.isActive ? 'Live' : 'Hidden'}
                          </Button>
                          <Button variant="ghost" size="sm" className="text-red-500" onClick={() => deleteDoc(doc(firestore, 'news_ticker', item.id))}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="services">
            <div className="grid lg:grid-cols-3 gap-8">
              <Card className="lg:col-span-1 h-fit">
                <CardHeader><CardTitle>Add New Service</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <Input placeholder="Title" value={newService.title} onChange={e => setNewService({...newService, title: e.target.value})} />
                  <Textarea placeholder="Description" value={newService.description} onChange={e => setNewService({...newService, description: e.target.value})} />
                  <Input placeholder="Icon Name (e.g., Building2, FileText)" value={newService.iconName} onChange={e => setNewService({...newService, iconName: e.target.value})} />
                  <Input placeholder="Category" value={newService.category} onChange={e => setNewService({...newService, category: e.target.value})} />
                  <Button onClick={createService} className="w-full bg-[#008E91]">
                    <Plus className="h-4 w-4 mr-2" /> Add to Catalog
                  </Button>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader><CardTitle>Live Services</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {services?.map(service => (
                      <div key={service.id} className="flex items-center justify-between p-4 border rounded-lg bg-white shadow-sm group">
                        <div className="flex items-center gap-4">
                           <div className="bg-slate-100 p-2 rounded-lg">
                              <trendingUp className="h-5 w-5 text-[#008E91]" />
                           </div>
                           <div>
                            <p className="font-bold text-[#008E91]">{service.title}</p>
                            <p className="text-xs text-slate-500">{service.category}</p>
                           </div>
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="sm" className="text-red-500" onClick={() => deleteDoc(doc(firestore, 'services', service.id))}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="applications">
            <Card>
              <CardHeader><CardTitle>Citizen Submissions</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {applications?.map(app => (
                    <div key={app.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50">
                      <div className="flex items-center gap-4">
                        <div className="bg-[#94F7F2]/20 p-2 rounded">
                          <Clock className="h-5 w-5 text-[#008E91]" />
                        </div>
                        <div>
                          <p className="font-bold">Application #{app.id.slice(-6)}</p>
                          <p className="text-sm text-slate-500">Service: {app.serviceId}</p>
                        </div>
                      </div>
                      <span className="text-xs font-black uppercase bg-[#94F7F2] text-[#008E91] px-3 py-1 rounded-full">{app.status}</span>
                    </div>
                  ))}
                  {applications?.length === 0 && <p className="text-center text-slate-400 py-8">No active submissions.</p>}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

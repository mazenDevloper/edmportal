
'use client';

import React, { useState, useMemo } from 'react';
import { useFirestore, useCollection, useDoc } from '@/firebase';
import { collection, doc, setDoc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Service, SiteConfig, ServiceApplication } from '@/lib/types';
import { Settings, Plus, Save, Trash2, CheckCircle, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function AdminDashboard() {
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const siteConfigRef = useMemo(() => doc(firestore, 'config', 'site'), [firestore]);
  const { data: siteConfig } = useDoc<SiteConfig>(siteConfigRef);
  
  const servicesQuery = useMemo(() => collection(firestore, 'services'), [firestore]);
  const { data: services } = useCollection<Service>(servicesQuery);

  const applicationsQuery = useMemo(() => collection(firestore, 'applications'), [firestore]);
  const { data: applications } = useCollection<ServiceApplication>(applicationsQuery);

  const [newService, setNewService] = useState({ title: '', description: '', iconName: 'Info', category: 'General' });

  const updateConfig = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setDoc(siteConfigRef, {
      heroTitle: formData.get('heroTitle'),
      heroSubtitle: formData.get('heroSubtitle'),
      contactPhone: formData.get('contactPhone'),
      isMaintenanceMode: false
    }, { merge: true });
    toast({ title: "Config Saved", description: "Site identity updated successfully." });
  };

  const createService = () => {
    addDoc(collection(firestore, 'services'), { ...newService, isActive: true });
    setNewService({ title: '', description: '', iconName: 'Info', category: 'General' });
    toast({ title: "Service Created" });
  };

  const toggleService = (service: Service) => {
    updateDoc(doc(firestore, 'services', service.id), { isActive: !service.isActive });
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="mx-auto max-w-7xl">
        <h1 className="text-3xl font-bold text-[#008E91] mb-8 flex items-center gap-2">
          <Settings className="h-8 w-8" /> Admin Control Panel
        </h1>

        <Tabs defaultValue="site" className="w-full">
          <TabsList className="bg-white border mb-8">
            <TabsTrigger value="site">Site Management</TabsTrigger>
            <TabsTrigger value="services">Services Catalog</TabsTrigger>
            <TabsTrigger value="applications">Citizen Requests</TabsTrigger>
          </TabsList>

          <TabsContent value="site">
            <Card>
              <CardHeader>
                <CardTitle>Branding & Hero Content</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={updateConfig} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-bold">Hero Title</label>
                      <Input name="heroTitle" defaultValue={siteConfig?.heroTitle} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold">Support Phone</label>
                      <Input name="contactPhone" defaultValue={siteConfig?.contactPhone} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold">Hero Subtitle</label>
                    <Textarea name="heroSubtitle" defaultValue={siteConfig?.heroSubtitle} />
                  </div>
                  <Button type="submit" className="dm-gradient-primary">
                    <Save className="h-4 w-4 mr-2" /> Save Site Identity
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="services">
            <div className="grid lg:grid-cols-3 gap-8">
              <Card className="lg:col-span-1 h-fit">
                <CardHeader><CardTitle>Add New Service</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <Input placeholder="Title" value={newService.title} onChange={e => setNewService({...newService, title: e.target.value})} />
                  <Textarea placeholder="Description" value={newService.description} onChange={e => setNewService({...newService, description: e.target.value})} />
                  <Input placeholder="Icon Name (Lucide)" value={newService.iconName} onChange={e => setNewService({...newService, iconName: e.target.value})} />
                  <Button onClick={createService} className="w-full bg-[#470D67]">
                    <Plus className="h-4 w-4 mr-2" /> Add to Catalog
                  </Button>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader><CardTitle>Live Services</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {services?.map(service => (
                      <div key={service.id} className="flex items-center justify-between p-4 border rounded-lg bg-white shadow-sm">
                        <div>
                          <p className="font-bold text-[#008E91]">{service.title}</p>
                          <p className="text-xs text-slate-500">{service.category}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className={service.isActive ? "text-green-600 border-green-200" : "text-slate-400"}
                            onClick={() => toggleService(service)}
                          >
                            {service.isActive ? 'Active' : 'Disabled'}
                          </Button>
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
              <CardHeader><CardTitle>Active Submissions</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {applications?.map(app => (
                    <div key={app.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50">
                      <div className="flex items-center gap-4">
                        <div className="bg-[#94F7F2]/20 p-2 rounded">
                          <Clock className="h-5 w-5 text-[#008E91]" />
                        </div>
                        <div>
                          <p className="font-bold">App #{app.id.slice(-6)}</p>
                          <p className="text-sm text-slate-500">User: {app.userId}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <span className="text-xs font-black uppercase bg-slate-100 px-2 py-1 rounded">{app.status}</span>
                        <Button size="sm" className="dm-gradient-primary">Process</Button>
                      </div>
                    </div>
                  ))}
                  {applications?.length === 0 && <p className="text-center text-slate-400 py-8">No applications found.</p>}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

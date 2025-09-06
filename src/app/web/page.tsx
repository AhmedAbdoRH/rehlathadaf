
"use client";

import * as React from 'react';
import { DomainDashboard } from '@/components/domain-dashboard';
import { StatusPanel } from '@/components/status-panel';
import { Icons } from '@/components/icons';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getDomains } from '@/services/domainService';
import { checkDomainStatus } from '@/ai/flows/checkDomainStatus';
import type { Domain } from '@/lib/types';
import Link from 'next/link';

export default function WebPage() {
  const [isSecretVisible, setSecretVisible] = React.useState(false);
  const [clickCount, setClickCount] = React.useState(0);
  const [allDomains, setAllDomains] = React.useState<Domain[]>([]);
  const [domainStatuses, setDomainStatuses] = React.useState<Record<string, 'checking' | 'online' | 'offline'>>({});
  const [loading, setLoading] = React.useState(true);

  const handleSecretClick = () => {
    const newClickCount = clickCount + 1;
    setClickCount(newClickCount);
    if (newClickCount >= 2) {
      setSecretVisible(true);
    }
  };

  // Load all domains and check their status
  React.useEffect(() => {
    const fetchDomainsAndStatuses = async () => {
      try {
        setLoading(true);
        const domainsFromDb = await getDomains();
        const domainsWithProject = domainsFromDb.map(d => ({
          ...d,
          projects: d.projects && d.projects.length > 0 ? d.projects as any[] : ['rehlethadaf']
        }));
        setAllDomains(domainsWithProject);

        // Set all to checking initially
        const initialStatuses: Record<string, 'checking' | 'online' | 'offline'> = {};
        domainsWithProject.forEach(d => {
            if (d.id) initialStatuses[d.id] = 'checking';
        });
        setDomainStatuses(initialStatuses);
        
        // Check statuses sequentially
        for (const domain of domainsWithProject) {
          if (domain.id) {
            try {
              const { isOnline } = await checkDomainStatus({ domainName: domain.domainName });
              setDomainStatuses(prev => ({ ...prev, [domain.id!]: isOnline ? 'online' : 'offline' }));
            } catch (e) {
               setDomainStatuses(prev => ({ ...prev, [domain.id!]: 'offline' }));
            }
            // Add a small delay between checks for sequential effect
            await new Promise(resolve => setTimeout(resolve, 200));
          }
        }

      } catch (error) {
        console.error("Error fetching domains:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDomainsAndStatuses();
  }, []);

  // Function to refresh domains and statuses
  const refreshDomains = React.useCallback(async () => {
    try {
      const domainsFromDb = await getDomains();
      const domainsWithProject = domainsFromDb.map(d => ({
        ...d,
        projects: d.projects && d.projects.length > 0 ? d.projects as any[] : ['rehlethadaf']
      }));
      setAllDomains(domainsWithProject);

      // Set all to checking initially
      const initialStatuses: Record<string, 'checking' | 'online' | 'offline'> = {};
      domainsWithProject.forEach(d => {
          if (d.id) initialStatuses[d.id] = 'checking';
      });
      setDomainStatuses(initialStatuses);
      
      // Check statuses sequentially
      for (const domain of domainsWithProject) {
        if (domain.id) {
          try {
            const { isOnline } = await checkDomainStatus({ domainName: domain.domainName });
            setDomainStatuses(prev => ({ ...prev, [domain.id!]: isOnline ? 'online' : 'offline' }));
          } catch (e) {
             setDomainStatuses(prev => ({ ...prev, [domain.id!]: 'offline' }));
          }
          // Add a small delay between checks for sequential effect
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }
    } catch (error) {
      console.error("Error refreshing domains:", error);
    }
  }, []);

  return (
    <>
      <div 
        onClick={handleSecretClick} 
        className="fixed left-0 top-0 h-full w-4 cursor-pointer z-10"
        title="Secret"
      />
      <Link href="/" passHref>
        <div 
          className="fixed bottom-0 left-0 h-8 w-8 cursor-pointer z-10 opacity-0"
          title="العودة للصفحة الرئيسية"
        />
      </Link>
      <div className="min-h-screen bg-background text-foreground">
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
          
          <header className="mb-4 flex items-center gap-4">
            <div className="relative cursor-pointer" onClick={handleSecretClick}>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
                <Icons.logo className="h-8 w-8 text-primary-foreground" />
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">إدارة المواقع وتطبيقات الويب</h1>
            </div>
          </header>

          <div className="w-full mb-2">
            <StatusPanel domains={allDomains} domainStatuses={domainStatuses} />
          </div>

          <main>
            <Card className="shadow-lg bg-card">
              <CardContent className="p-0 pt-0">
                <Tabs defaultValue="pova" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="rehlethadaf">رحلة هدف</TabsTrigger>
                    <TabsTrigger value="pova">Pova</TabsTrigger>
                    <TabsTrigger value="other">مشاريع أخرى</TabsTrigger>
                  </TabsList>
                  <TabsContent value="rehlethadaf">
                    {isSecretVisible ? (
                      <DomainDashboard project="rehlethadaf" onDomainChange={refreshDomains} />
                    ) : (
                      <div className="flex h-64 items-center justify-center text-muted-foreground">
                        
                      </div>
                    )}
                  </TabsContent>
                  <TabsContent value="pova">
                    <DomainDashboard project="pova" onDomainChange={refreshDomains} />
                  </TabsContent>
                  <TabsContent value="other">
                     {isSecretVisible ? (
                      <DomainDashboard project="other" onDomainChange={refreshDomains} />
                    ) : (
                      <div className="flex h-64 items-center justify-center text-muted-foreground">
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </>
  );
}

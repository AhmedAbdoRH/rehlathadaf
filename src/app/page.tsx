"use client";

import * as React from 'react';
import { DomainDashboard } from '@/components/domain-dashboard';
import { StatusPanel } from '@/components/status-panel';
import { Icons } from '@/components/icons';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getDomains } from '@/services/domainService';
import { checkDomainStatus } from '@/ai/flows/checkDomainStatus';
import { checkApiKeyStatus } from '@/ai/flows/checkApiKeyStatus';
import type { Domain, Todo, ApiKeyStatus } from '@/lib/types';
import Link from 'next/link';
import { getTodosForDomains } from '@/services/todoService';
import { AllTodosPanel } from '@/components/all-todos-panel';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from '@/components/ui/button';
import { ChevronDown, DollarSign, PiggyBank, ShieldAlert, Code2, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FaultsSheet } from '@/components/faults-sheet';

const StatCard = ({ title, value, icon, className }: { title: string, value: string, icon: React.ElementType, className?: string }) => {
    const Icon = icon;
    return (
        <Card className={cn("bg-card/50", className)}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
            </CardContent>
        </Card>
    );
};


export default function WebPage() {
  const [isSecretVisible, setSecretVisible] = React.useState(false);
  const [clickCount, setClickCount] = React.useState(0);
  const [activeTab, setActiveTab] = React.useState('pova');
  const [allDomains, setAllDomains] = React.useState<Domain[]>([]);
  const [domainStatuses, setDomainStatuses] = React.useState<Record<string, 'checking' | 'online' | 'offline'>>({});
  const [apiKeyStatuses, setApiKeyStatuses] = React.useState<ApiKeyStatus[]>([]);
  const [domainTodos, setDomainTodos] = React.useState<Record<string, Todo[]>>({});
  const [loading, setLoading] = React.useState(true);
  const [isFaultsSheetOpen, setFaultsSheetOpen] = React.useState(false);


  const apiKeysData = [
    { key: 'AIzaSyAwPSkhtVxkIHvLEph99ipAcjtq3ZIqjy4', name: 'سمارت تيم' },
    { key: 'AIzaSyADRxtILZAQ7EeJA9fKju7tj_YkMErqZH0', name: 'السماح للمفروشات' },
    { key: 'AIzaSyAY7XTQpSR4nws-xRIhABZn3f3kYdGIVDs', name: 'بيرفيوم امبسدور' },
    { key: 'AIzaSyDohlhUWuaygB35M2EY-JB1_F1xztx_lO4', name: 'سمارت تيم ماسنجر' }
  ];
  
  const apiKeys = apiKeysData.map(item => item.key);

  const handleSecretClick = () => {
    const newClickCount = clickCount + 1;
    setClickCount(newClickCount);
    if (newClickCount >= 2) {
      setSecretVisible(true);
      setActiveTab('rehlethadaf');
    }
  };
  
  const refreshTodos = React.useCallback(async () => {
    try {
        const domainsFromDb = await getDomains(); // Re-fetch domains to ensure we have the latest list
        const domainIds = domainsFromDb.map(d => d.id).filter((id): id is string => !!id);
        if (domainIds.length > 0) {
            const todosByDomain = await getTodosForDomains(domainIds);
            setDomainTodos(todosByDomain);
        } else {
            setDomainTodos({});
        }
    } catch (error) {
        console.error("Error refreshing todos:", error);
    }
  }, []);


  const refreshAllStatuses = React.useCallback(async () => {
    try {
      setLoading(true);
      
      // Domains
      const domainsFromDb = await getDomains();
      const domainsWithProject = domainsFromDb.map(d => ({
        ...d,
        projects: d.projects && d.projects.length > 0 ? d.projects as any[] : ['rehlethadaf']
      }));
      setAllDomains(domainsWithProject);

      // Set all domains to checking initially
      const initialDomainStatuses: Record<string, 'checking' | 'online' | 'offline'> = {};
      domainsWithProject.forEach(d => {
        if (d.id) initialDomainStatuses[d.id] = 'checking';
      });
      setDomainStatuses(initialDomainStatuses);
      
      // Set all API keys to checking initially
      setApiKeyStatuses(apiKeysData.map(item => ({ key: item.key, name: item.name, status: 'checking' as const })));

      // Refresh todos in parallel
      const domainIds = domainsWithProject.map(d => d.id).filter((id): id is string => !!id);
      if (domainIds.length > 0) {
        const todosByDomain = await getTodosForDomains(domainIds);
        setDomainTodos(todosByDomain);
      } else {
        setDomainTodos({});
      }

      // Check domain statuses
      for (const domain of domainsWithProject) {
        if (domain.id) {
          checkDomainStatus({ domainName: domain.domainName })
            .then(({ isOnline }) => {
              setDomainStatuses(prev => ({ ...prev, [domain.id!]: isOnline ? 'online' : 'offline' }));
            })
            .catch(() => {
              setDomainStatuses(prev => ({ ...prev, [domain.id!]: 'offline' }));
            });
        }
      }

      // Check API key statuses
      apiKeysData.forEach((item) => {
        checkApiKeyStatus({ apiKey: item.key })
          .then(({ isWorking }) => {
            setApiKeyStatuses(prev => prev.map(s => s.key === item.key ? { ...s, status: isWorking ? 'online' : 'offline' } : s));
          })
          .catch(() => {
            setApiKeyStatuses(prev => prev.map(s => s.key === item.key ? { ...s, status: 'offline' } : s));
          });
      });

    } catch (error) {
      console.error("Error refreshing domains and statuses:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  React.useEffect(() => {
    refreshAllStatuses();
  }, [refreshAllStatuses]);
  
  const hasTodosMap = React.useMemo(() => {
    const hasTodos: Record<string, boolean> = {};
    Object.keys(domainTodos).forEach(domainId => {
      hasTodos[domainId] = domainTodos[domainId].some(todo => !todo.completed);
    });
    return hasTodos;
  }, [domainTodos]);

  const rehlethadafStats = React.useMemo(() => {
        const rehlethadafDomains = allDomains.filter(d => d.projects?.includes('rehlethadaf'));
        const totalIncome = rehlethadafDomains.reduce((acc, domain) => acc + (Number(domain.renewalCostClient) || 0), 0);
        const netProfit = rehlethadafDomains.reduce((acc, domain) => {
            const clientCost = Number(domain.renewalCostClient) || 0;
            const officeCost = Number(domain.renewalCostOffice) || 0;
            return acc + (clientCost - officeCost);
        }, 0);
        return { totalIncome, netProfit };
    }, [allDomains]);


  return (
    <>
      <div 
        onClick={handleSecretClick} 
        className="fixed left-0 top-0 h-full w-4 cursor-pointer z-10"
        title="Secret"
      />
      
      <FaultsSheet open={isFaultsSheetOpen} onOpenChange={setFaultsSheetOpen} />

      <div className="min-h-screen bg-background text-foreground pb-16">
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
          
          <header className="mb-4 flex items-center gap-4">
            <div className="relative cursor-pointer" onClick={handleSecretClick}>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
                <Icons.logo className="h-8 w-8 text-primary-foreground" />
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">لوحة  المواقع وتطبيقات الويب</h1>
            </div>
          </header>

          <Collapsible className="w-full mb-2">
            <StatusPanel domains={allDomains} domainStatuses={domainStatuses} domainTodos={hasTodosMap} apiKeyStatuses={apiKeyStatuses} />
            <CollapsibleTrigger asChild>
              <div className="w-full h-4 bg-card hover:bg-muted/80 border-x border-b border-border/60 rounded-b-lg flex items-center justify-center cursor-pointer">
                <ChevronDown className="h-4 w-4 text-muted-foreground opacity-50 transition-transform data-[state=open]:rotate-180" />
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="mt-2">
                <AllTodosPanel onUpdate={refreshTodos} />
              </div>
            </CollapsibleContent>
          </Collapsible>


          <main className="mt-4">
            <Card className="shadow-lg bg-card">
              <CardContent className="p-0 pt-0">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="rehlethadaf">رحلة هدف</TabsTrigger>
                    <TabsTrigger value="pova">Pova</TabsTrigger>
                    <TabsTrigger value="other">مشاريع أخرى</TabsTrigger>
                  </TabsList>
                  <TabsContent value="rehlethadaf">
                    {isSecretVisible ? (
                      <>
                        <DomainDashboard 
                          project="rehlethadaf"
                          allDomains={allDomains}
                          allTodos={domainTodos}
                          domainStatuses={domainStatuses}
                          loading={loading}
                          onDomainChange={refreshAllStatuses} 
                          onTodoChange={refreshTodos} 
                        />
                        <div className="p-4 border-t border-border mt-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <StatCard 
                                    title="صافي الربح السنوي" 
                                    value={`$${rehlethadafStats.netProfit.toFixed(2)}`} 
                                    icon={DollarSign}
                                    className="border-green-500/30"
                                />
                                <StatCard 
                                    title="إجمالي الدخل السنوي" 
                                    value={`$${rehlethadafStats.totalIncome.toFixed(2)}`} 
                                    icon={PiggyBank} 
                                    className="border-blue-500/30"
                                />
                            </div>
                        </div>
                      </>
                    ) : (
                      <div className="flex h-64 items-center justify-center text-muted-foreground">
                        
                      </div>
                    )}
                  </TabsContent>
                  <TabsContent value="pova">
                    <DomainDashboard 
                       project="pova"
                       allDomains={allDomains}
                       allTodos={domainTodos}
                       domainStatuses={domainStatuses}
                       loading={loading}
                       onDomainChange={refreshAllStatuses} 
                       onTodoChange={refreshTodos}
                    />
                  </TabsContent>
                  <TabsContent value="other">
                     {isSecretVisible ? (
                       <DomainDashboard 
                         project="other"
                         allDomains={allDomains}
                         allTodos={domainTodos}
                         domainStatuses={domainStatuses}
                         loading={loading}
                         onDomainChange={refreshAllStatuses} 
                         onTodoChange={refreshTodos} 
                       />
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
      
      <footer className="fixed bottom-0 left-0 w-full bg-background/80 backdrop-blur-sm border-t border-border/60 p-2 z-50">
        <div className="container mx-auto flex justify-center items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-10 w-10 rounded-full bg-red-500/10 text-red-500 hover:bg-red-500/20 hover:text-red-400"
              onClick={() => setFaultsSheetOpen(true)}
              title="الأعطال"
              >
              <ShieldAlert className="h-5 w-5" />
            </Button>
            <Link href="https://rhsales.netlify.app" target="_blank" rel="noopener noreferrer">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-10 w-10 rounded-full bg-purple-500/10 text-purple-500 hover:bg-purple-500/20 hover:text-purple-400"
                title="لوحة إدارة المبيعات"
                >
                <TrendingUp className="h-5 w-5" />
              </Button>
            </Link>
            <Link href="https://studio.firebase.google.com/u/1/studio-256607151" target="_blank" rel="noopener noreferrer">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-10 w-10 rounded-full bg-green-500/10 text-green-500 hover:bg-green-500/20 hover:text-green-400"
                title="بيئة التطوير"
                >
                <Code2 className="h-5 w-5" />
              </Button>
            </Link>
        </div>
      </footer>
    </>
  );
}

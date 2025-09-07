
"use client";

import * as React from 'react';
import { DomainDashboard } from '@/components/domain-dashboard';
import { StatusPanel } from '@/components/status-panel';
import { Icons } from '@/components/icons';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getDomains } from '@/services/domainService';
import { checkDomainStatus } from '@/ai/flows/checkDomainStatus';
import type { Domain, Todo } from '@/lib/types';
import Link from 'next/link';
import { getTodosForDomains } from '@/services/todoService';
import { AllTodosPanel } from '@/components/all-todos-panel';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from '@/components/ui/button';
import { ChevronDown, DollarSign, PiggyBank } from 'lucide-react';
import { cn } from '@/lib/utils';

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
  const [domainTodos, setDomainTodos] = React.useState<Record<string, Todo[]>>({});
  const [loading, setLoading] = React.useState(true);

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
      const domainIds = allDomains.map(d => d.id).filter((id): id is string => !!id);
      if (domainIds.length > 0) {
        const todosByDomain = await getTodosForDomains(domainIds);
        setDomainTodos(todosByDomain);
      } else {
        setDomainTodos({});
      }
    } catch (error) {
      console.error("Error refreshing todos:", error);
    }
  }, [allDomains]);


  const refreshDomainsAndStatuses = React.useCallback(async () => {
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
      
      // Refresh todos in parallel
      const domainIds = domainsWithProject.map(d => d.id).filter((id): id is string => !!id);
      if (domainIds.length > 0) {
        const todosByDomain = await getTodosForDomains(domainIds);
        setDomainTodos(todosByDomain);
      } else {
        setDomainTodos({});
      }


      // Check statuses
      for (const domain of domainsWithProject) {
        if (domain.id) {
          try {
            const { isOnline } = await checkDomainStatus({ domainName: domain.domainName });
            setDomainStatuses(prev => ({ ...prev, [domain.id!]: isOnline ? 'online' : 'offline' }));
          } catch (e) {
            setDomainStatuses(prev => ({ ...prev, [domain.id!]: 'offline' }));
          }
        }
      }
    } catch (error) {
      console.error("Error refreshing domains and statuses:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  React.useEffect(() => {
    refreshDomainsAndStatuses();
  }, [refreshDomainsAndStatuses]);
  
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
      <Link href="/" passHref>
        <div 
          className="fixed bottom-0 left-0 h-8 w-8 cursor-pointer z-10"
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
              <h1 className="text-3xl font-bold text-foreground">لوحة  المواقع وتطبيقات الويب</h1>
            </div>
          </header>

          <Collapsible className="w-full mb-2">
            <StatusPanel domains={allDomains} domainStatuses={domainStatuses} domainTodos={hasTodosMap} />
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
                          onDomainChange={refreshDomainsAndStatuses} 
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
                       onDomainChange={refreshDomainsAndStatuses} 
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
                         onDomainChange={refreshDomainsAndStatuses} 
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
    </>
  );
}

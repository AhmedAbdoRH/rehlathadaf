import { DomainDashboard } from '@/components/domain-dashboard';
import { Icons } from '@/components/icons';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <header className="mb-8 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
            <Icons.logo className="h-8 w-8 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">عرض النطاق</h1>
            <p className="text-muted-foreground">نظرة شاملة على نطاقاتك.</p>
          </div>
        </header>
        <main>
          <Card className="shadow-lg">
            <CardContent>
               <Tabs defaultValue="rehlethadaf" className="w-full pt-4">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="rehlethadaf">مشاريع رحلة هدف</TabsTrigger>
                  <TabsTrigger value="bofa">مشاريع بوفا</TabsTrigger>
                  <TabsTrigger value="other">مشاريع أخرى</TabsTrigger>
                </TabsList>
                <TabsContent value="rehlethadaf">
                  <DomainDashboard project="rehlethadaf" />
                </TabsContent>
                <TabsContent value="bofa">
                   <DomainDashboard project="bofa" />
                </TabsContent>
                <TabsContent value="other">
                   <DomainDashboard project="other" />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}

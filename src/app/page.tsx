import { domains } from '@/lib/data';
import { DomainDashboard } from '@/components/domain-dashboard';
import { Icons } from '@/components/icons';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <header className="mb-8 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
            <Icons.logo className="h-8 w-8 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">DomainView</h1>
            <p className="text-muted-foreground">A comprehensive overview of your domains.</p>
          </div>
        </header>
        <main>
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Managed Domains</CardTitle>
              <CardDescription>
                View, manage, and generate renewal reminders for your client domains.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DomainDashboard initialDomains={domains} />
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}

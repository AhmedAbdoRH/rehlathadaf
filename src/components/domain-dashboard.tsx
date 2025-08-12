"use client";

import * as React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { generateRenewalReminders, type GenerateRenewalRemindersInput, type GenerateRenewalRemindersOutput } from '@/ai/flows/generate-renewal-reminders';
import type { Domain } from '@/lib/types';
import { format, parseISO } from 'date-fns';
import { Send, Clipboard, Info, CheckCircle, AlertCircle } from 'lucide-react';

const StatusIndicator = ({ status }: { status: 'active' | 'inactive' }) => {
  const isActive = status === 'active';
  return (
    <div className="flex items-center gap-2">
      <span className={cn('h-2.5 w-2.5 rounded-full', isActive ? 'bg-green-500' : 'bg-red-500')} />
      <span className="capitalize text-sm">{status}</span>
    </div>
  );
};

export function DomainDashboard({ initialDomains }: { initialDomains: Domain[] }) {
  const [domains] = React.useState<Domain[]>(initialDomains);
  const [selectedDomainIds, setSelectedDomainIds] = React.useState<Set<number>>(new Set());
  const [isReminderOpen, setReminderOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [reminders, setReminders] = React.useState<GenerateRenewalRemindersOutput | null>(null);
  const { toast } = useToast();

  const selectedDomains = React.useMemo(() => {
    return domains.filter(d => selectedDomainIds.has(d.id));
  }, [domains, selectedDomainIds]);

  const handleSelectAll = (checked: boolean | 'indeterminate') => {
    if (checked === true) {
      const allIds = new Set(domains.map(d => d.id));
      setSelectedDomainIds(allIds);
    } else {
      setSelectedDomainIds(new Set());
    }
  };

  const handleSelectRow = (domainId: number, checked: boolean) => {
    const newSelectedIds = new Set(selectedDomainIds);
    if (checked) {
      newSelectedIds.add(domainId);
    } else {
      newSelectedIds.delete(domainId);
    }
    setSelectedDomainIds(newSelectedIds);
  };

  const openReminderDialog = () => {
    setReminders(null);
    setReminderOpen(true);
  };

  const handleGenerate = async () => {
    if (selectedDomains.length === 0) return;
    
    setIsLoading(true);
    setReminders(null);
    
    const input: GenerateRenewalRemindersInput = {
      domains: selectedDomains.map(d => ({
        domainName: d.domainName,
        renewalDate: d.renewalDate,
        clientName: d.clientName,
        clientEmail: d.clientEmail,
        outstandingBalance: d.outstandingBalance,
        isPastDue: new Date(d.renewalDate) < new Date(),
      })),
    };
    
    try {
      const result = await generateRenewalReminders(input);
      setReminders(result);
    } catch (error) {
      console.error("Failed to generate reminders:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate reminders. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard!",
      description: "The reminder message has been copied.",
    });
  };

  const isAllSelected = selectedDomainIds.size > 0 && selectedDomainIds.size === domains.length;
  const isIndeterminate = selectedDomainIds.size > 0 && selectedDomainIds.size < domains.length;

  return (
    <>
      <div className="mb-4 flex items-center justify-end">
        <Button onClick={openReminderDialog} disabled={selectedDomainIds.size === 0}>
          <Send className="mr-2 h-4 w-4" />
          Generate Reminders ({selectedDomainIds.size})
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox
                  onCheckedChange={handleSelectAll}
                  checked={isAllSelected ? true : isIndeterminate ? 'indeterminate' : false}
                  aria-label="Select all rows"
                />
              </TableHead>
              <TableHead>Domain & Registrar</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Collection Date</TableHead>
              <TableHead>Renewal Date</TableHead>
              <TableHead>Client Email</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {domains.map(domain => (
              <TableRow key={domain.id} data-state={selectedDomainIds.has(domain.id) && "selected"}>
                <TableCell>
                  <Checkbox
                    onCheckedChange={(checked) => handleSelectRow(domain.id, !!checked)}
                    checked={selectedDomainIds.has(domain.id)}
                    aria-label={`Select row for ${domain.domainName}`}
                  />
                </TableCell>
                <TableCell>
                  <div className="font-medium text-primary">{domain.domainName}</div>
                  <div className="text-sm text-muted-foreground">{domain.registrar}</div>
                </TableCell>
                <TableCell>
                  <StatusIndicator status={domain.status} />
                </TableCell>
                <TableCell>{format(parseISO(domain.collectionDate), 'MMM d, yyyy')}</TableCell>
                <TableCell>{format(parseISO(domain.renewalDate), 'MMM d, yyyy')}</TableCell>
                <TableCell>{domain.clientEmail}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isReminderOpen} onOpenChange={setReminderOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Generate Renewal Reminders</DialogTitle>
            <DialogDescription>
              AI will generate personalized reminder emails for the selected domains.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: selectedDomains.length }).map((_, i) => (
                   <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-[250px]" />
                      <Skeleton className="h-4 w-[200px]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : reminders ? (
              <div>
                <Alert variant="default" className="mb-4 bg-teal-50 border-teal-200 text-teal-800 dark:bg-teal-950 dark:border-teal-800 dark:text-teal-200">
                  <CheckCircle className="h-4 w-4 !text-teal-600 dark:!text-teal-400" />
                  <AlertTitle>Generation Complete</AlertTitle>
                  <AlertDescription>
                    Review the generated reminders below. You can copy them to your clipboard.
                  </AlertDescription>
                </Alert>
                <Accordion type="single" collapsible className="w-full">
                  {reminders.reminders.map((r) => (
                    <AccordionItem value={r.domainName} key={r.domainName}>
                      <AccordionTrigger>{r.domainName}</AccordionTrigger>
                      <AccordionContent>
                        <div className="prose prose-sm dark:prose-invert max-w-none rounded-md border bg-muted/50 p-4 whitespace-pre-wrap font-sans">
                          {r.reminderMessage}
                        </div>
                        <Button variant="ghost" size="sm" className="mt-2 text-accent" onClick={() => copyToClipboard(r.reminderMessage)}>
                          <Clipboard className="mr-2 h-4 w-4" />
                          Copy Message
                        </Button>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            ) : (
              <div>
                <Alert className="mb-4">
                  <Info className="h-4 w-4" />
                  <AlertTitle>Confirm Selection</AlertTitle>
                  <AlertDescription>
                    You are about to generate reminders for {selectedDomains.length} domain(s).
                  </AlertDescription>
                </Alert>
                <ul className="max-h-60 overflow-y-auto space-y-2 rounded-md border p-4">
                    {selectedDomains.map(d => (
                        <li key={d.id} className="text-sm font-medium">{d.domainName} - <span className="text-muted-foreground">{d.clientName}</span></li>
                    ))}
                </ul>
              </div>
            )}
          </div>
          {!reminders && (
             <DialogFooter>
               <Button variant="outline" onClick={() => setReminderOpen(false)}>Cancel</Button>
              <Button onClick={handleGenerate} disabled={isLoading}>
                {isLoading ? 'Generating...' : `Generate ${selectedDomains.length} Reminders`}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function cn(...inputs: (string | undefined | null | false)[]): string {
    return inputs.filter(Boolean).join(' ');
}

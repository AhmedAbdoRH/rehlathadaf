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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { generateRenewalReminders, type GenerateRenewalRemindersInput, type GenerateRenewalRemindersOutput } from '@/ai/flows/generate-renewal-reminders';
import type { Domain } from '@/lib/types';
import { format, parseISO, formatISO } from 'date-fns';
import { Send, Clipboard, Info, CheckCircle, Plus, Trash2, Calendar as CalendarIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar } from './ui/calendar';

const StatusIndicator = ({ status }: { status: 'active' | 'inactive' }) => {
  const isActive = status === 'active';
  const statusText = isActive ? 'نشط' : 'غير نشط';
  return (
    <div className="flex items-center gap-2">
      <span className={cn('h-2.5 w-2.5 rounded-full', isActive ? 'bg-green-500' : 'bg-red-500')} />
      <span className="capitalize text-sm">{statusText}</span>
    </div>
  );
};

export function DomainDashboard({ initialDomains }: { initialDomains: Domain[] }) {
  const [domains, setDomains] = React.useState<Domain[]>(initialDomains);
  const [selectedDomainIds, setSelectedDomainIds] = React.useState<Set<number>>(new Set());
  const [isReminderOpen, setReminderOpen] = React.useState(false);
  const [isAddDomainOpen, setAddDomainOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [reminders, setReminders] = React.useState<GenerateRenewalRemindersOutput | null>(null);
  const { toast } = useToast();

  const [newDomain, setNewDomain] = React.useState({
    domainName: '',
    registrar: '',
    renewalDate: new Date(),
    clientName: '',
    clientEmail: '',
    outstandingBalance: 0,
  });

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
        title: "خطأ",
        description: "فشل في إنشاء التذكيرات. يرجى المحاولة مرة أخرى.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "تم النسخ إلى الحافظة!",
      description: "تم نسخ رسالة التذكير.",
    });
  };

  const handleAddDomain = (e: React.FormEvent) => {
    e.preventDefault();
    const newDomainEntry: Domain = {
      id: Math.max(0, ...domains.map(d => d.id)) + 1,
      domainName: newDomain.domainName,
      registrar: newDomain.registrar,
      renewalDate: formatISO(newDomain.renewalDate),
      clientName: newDomain.clientName,
      clientEmail: newDomain.clientEmail,
      outstandingBalance: Number(newDomain.outstandingBalance) || 0,
      status: 'active',
      collectionDate: formatISO(new Date()),
    };
    setDomains([...domains, newDomainEntry]);
    toast({
        title: "تمت إضافة النطاق",
        description: `تمت إضافة ${newDomain.domainName} بنجاح.`,
    });
    setAddDomainOpen(false);
    setNewDomain({
        domainName: '',
        registrar: '',
        renewalDate: new Date(),
        clientName: '',
        clientEmail: '',
        outstandingBalance: 0,
    });
  };

  const handleDeleteDomain = (domainId: number) => {
    const domainToDelete = domains.find(d => d.id === domainId);
    setDomains(domains.filter(d => d.id !== domainId));
    if (domainToDelete) {
        toast({
            title: "تم حذف النطاق",
            description: `تم حذف ${domainToDelete.domainName} بنجاح.`,
            variant: "destructive"
        });
    }
  };

  const isAllSelected = selectedDomainIds.size > 0 && selectedDomainIds.size === domains.length;
  const isIndeterminate = selectedDomainIds.size > 0 && selectedDomainIds.size < domains.length;

  return (
    <>
      <div className="mb-4 flex items-center justify-end gap-2">
        <Button onClick={() => setAddDomainOpen(true)}>
          <Plus className="ml-2 h-4 w-4" />
          إضافة نطاق
        </Button>
        <Button onClick={openReminderDialog} disabled={selectedDomainIds.size === 0}>
          <Send className="ml-2 h-4 w-4" />
          إنشاء تذكيرات ({selectedDomainIds.size})
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
                  aria-label="تحديد كل الصفوف"
                />
              </TableHead>
              <TableHead>النطاق والمسجل</TableHead>
              <TableHead>الحالة</TableHead>
              <TableHead>تاريخ التحصيل</TableHead>
              <TableHead>تاريخ التجديد</TableHead>
              <TableHead>بريد العميل الإلكتروني</TableHead>
              <TableHead className="text-left">إجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {domains.map(domain => (
              <TableRow key={domain.id} data-state={selectedDomainIds.has(domain.id) && "selected"}>
                <TableCell>
                  <Checkbox
                    onCheckedChange={(checked) => handleSelectRow(domain.id, !!checked)}
                    checked={selectedDomainIds.has(domain.id)}
                    aria-label={`تحديد صف لـ ${domain.domainName}`}
                  />
                </TableCell>
                <TableCell>
                  <div className="font-medium text-primary">{domain.domainName}</div>
                  <div className="text-sm text-muted-foreground">{domain.registrar}</div>
                </TableCell>
                <TableCell>
                  <StatusIndicator status={domain.status} />
                </TableCell>
                <TableCell>{format(parseISO(domain.collectionDate), 'd MMM, yyyy')}</TableCell>
                <TableCell>{format(parseISO(domain.renewalDate), 'd MMM, yyyy')}</TableCell>
                <TableCell>{domain.clientEmail}</TableCell>
                <TableCell className="text-left">
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
                        <AlertDialogDescription>
                          لا يمكن التراجع عن هذا الإجراء. سيؤدي هذا إلى حذف النطاق بشكل دائم
                          <span className="font-bold"> {domain.domainName}</span>.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>إلغاء</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeleteDomain(domain.id)}>
                          متابعة
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Generate Reminders Dialog */}
      <Dialog open={isReminderOpen} onOpenChange={setReminderOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>إنشاء تذكيرات التجديد</DialogTitle>
            <DialogDescription>
              سيقوم الذكاء الاصطناعي بإنشاء رسائل تذكير شخصية عبر البريد الإلكتروني للنطاقات المحددة.
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
                  <AlertTitle>اكتمل الإنشاء</AlertTitle>
                  <AlertDescription>
                    راجع التذكيرات التي تم إنشاؤها أدناه. يمكنك نسخها إلى الحافظة الخاصة بك.
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
                          <Clipboard className="ml-2 h-4 w-4" />
                          نسخ الرسالة
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
                  <AlertTitle>تأكيد الاختيار</AlertTitle>
                  <AlertDescription>
                    أنت على وشك إنشاء تذكيرات لـ {selectedDomains.length} نطاق (نطاقات).
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
               <Button variant="outline" onClick={() => setReminderOpen(false)}>إلغاء</Button>
              <Button onClick={handleGenerate} disabled={isLoading}>
                {isLoading ? 'جارٍ الإنشاء...' : `إنشاء ${selectedDomains.length} تذكيرات`}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Add Domain Dialog */}
      <Dialog open={isAddDomainOpen} onOpenChange={setAddDomainOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>إضافة نطاق جديد</DialogTitle>
                <DialogDescription>
                    أدخل تفاصيل النطاق الجديد الذي تريد إدارته.
                </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddDomain}>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="domainName" className="text-right">النطاق</Label>
                        <Input id="domainName" value={newDomain.domainName} onChange={(e) => setNewDomain({...newDomain, domainName: e.target.value})} className="col-span-3" required />
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="registrar" className="text-right">المسجل</Label>
                        <Input id="registrar" value={newDomain.registrar} onChange={(e) => setNewDomain({...newDomain, registrar: e.target.value})} className="col-span-3" required />
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="clientName" className="text-right">اسم العميل</Label>
                        <Input id="clientName" value={newDomain.clientName} onChange={(e) => setNewDomain({...newDomain, clientName: e.target.value})} className="col-span-3" required />
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="clientEmail" className="text-right">بريد العميل</Label>
                        <Input id="clientEmail" type="email" value={newDomain.clientEmail} onChange={(e) => setNewDomain({...newDomain, clientEmail: e.target.value})} className="col-span-3" required />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="outstandingBalance" className="text-right">الرصيد</Label>
                        <Input id="outstandingBalance" type="number" value={newDomain.outstandingBalance} onChange={(e) => setNewDomain({...newDomain, outstandingBalance: Number(e.target.value)})} className="col-span-3" required />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">تاريخ التجديد</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                        "col-span-3 justify-start text-left font-normal",
                                        !newDomain.renewalDate && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="ml-2 h-4 w-4" />
                                    {newDomain.renewalDate ? format(newDomain.renewalDate, "PPP") : <span>اختر تاريخًا</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={newDomain.renewalDate}
                                    onSelect={(date) => setNewDomain({...newDomain, renewalDate: date || new Date()})}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>
                 <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="outline">إلغاء</Button>
                    </DialogClose>
                    <Button type="submit">إضافة نطاق</Button>
                </DialogFooter>
            </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

function cn(...inputs: (string | undefined | null | false)[]): string {
    return inputs.filter(Boolean).join(' ');
}

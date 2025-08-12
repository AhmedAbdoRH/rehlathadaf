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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import type { Domain } from '@/lib/types';
import { format, parseISO, formatISO, differenceInDays } from 'date-fns';
import { Plus, Trash2, Calendar as CalendarIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar } from './ui/calendar';
import { Progress } from './ui/progress';

const USD_TO_EGP_RATE = 47.5; // سعر الصرف التقريبي

export function DomainDashboard({ initialDomains }: { initialDomains: Domain[] }) {
  const [domains, setDomains] = React.useState<Domain[]>(initialDomains);
  const [isAddDomainOpen, setAddDomainOpen] = React.useState(false);
  const { toast } = useToast();

  const [newDomain, setNewDomain] = React.useState({
    domainName: '',
    registrar: '',
    renewalDate: new Date(),
    clientName: '',
    clientEmail: '',
    outstandingBalance: 0,
    renewalCostClient: 0,
    renewalCostOffice: 0,
  });

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
      renewalCostClient: Number(newDomain.renewalCostClient) || 0,
      renewalCostOffice: Number(newDomain.renewalCostOffice) || 0,
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
        renewalCostClient: 0,
        renewalCostOffice: 0,
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
  
  const getRenewalProgress = (renewalDate: string, collectionDate: string) => {
    const renewal = parseISO(renewalDate);
    const collection = parseISO(collectionDate);
    const today = new Date();

    const totalDays = differenceInDays(renewal, collection);
    const elapsedDays = differenceInDays(today, collection);

    if (totalDays <= 0) {
      return 100;
    }

    const progress = Math.max(0, Math.min(100, (elapsedDays / totalDays) * 100));
    return progress;
  };

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>النطاق والإدارة</TableHead>
              <TableHead>تكلفة العميل</TableHead>
              <TableHead>تكلفة المكتب</TableHead>
              <TableHead className="text-left">إجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {domains.map(domain => (
              <TableRow key={domain.id}>
                <TableCell>
                  <div className="font-medium text-lg text-primary">{domain.domainName}</div>
                  <div className="text-sm text-muted-foreground">{domain.registrar}</div>
                  <div className="text-sm text-muted-foreground">{domain.clientEmail}</div>
                  <div className='mt-2'>
                    <div>{format(parseISO(domain.renewalDate), 'dd/MM/yyyy')}</div>
                    <Progress value={getRenewalProgress(domain.renewalDate, domain.collectionDate)} className="h-2 mt-1" />
                  </div>
                </TableCell>
                <TableCell>
                    <div>${domain.renewalCostClient.toFixed(2)}</div>
                    <div className="text-xs text-muted-foreground">{(domain.renewalCostClient * USD_TO_EGP_RATE).toFixed(2)} ج.م</div>
                </TableCell>
                <TableCell>
                    <div>${domain.renewalCostOffice.toFixed(2)}</div>
                    <div className="text-xs text-muted-foreground">{(domain.renewalCostOffice * USD_TO_EGP_RATE).toFixed(2)} ج.م</div>
                </TableCell>
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

      <Button 
        onClick={() => setAddDomainOpen(true)} 
        className="fixed bottom-8 left-8 z-50 h-14 w-14 rounded-full shadow-lg"
        size="icon"
      >
        <Plus className="h-6 w-6" />
      </Button>

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
                        <Label htmlFor="registrar" className="text-right">الإدارة</Label>
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
                        <Label htmlFor="renewalCostClient" className="text-right">تكلفة العميل</Label>
                        <Input id="renewalCostClient" type="number" value={newDomain.renewalCostClient} onChange={(e) => setNewDomain({...newDomain, renewalCostClient: Number(e.target.value)})} className="col-span-3" required />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="renewalCostOffice" className="text-right">تكلفة المكتب</Label>
                        <Input id="renewalCostOffice" type="number" value={newDomain.renewalCostOffice} onChange={(e) => setNewDomain({...newDomain, renewalCostOffice: Number(e.target.value)})} className="col-span-3" required />
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

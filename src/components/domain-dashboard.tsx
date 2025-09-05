"use client";

import * as React from 'react';
import {
  Table,
  TableBody,
  TableCell,
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
import type { Domain, Project } from '@/lib/types';
import { format, parseISO, formatISO, differenceInDays, subYears, addYears } from 'date-fns';
import { Plus, Trash2, Calendar as CalendarIcon, Loader2, Pencil, Check, FileText } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar } from './ui/calendar';
import { Progress } from './ui/progress';
import { Card, CardContent } from './ui/card';
import { getDomains, addDomain, deleteDomain, updateDomain } from '@/services/domainService';
import { cn } from "@/lib/utils"
import { Textarea } from './ui/textarea';
import { Checkbox } from './ui/checkbox';
import { checkDomainStatus } from '@/ai/flows/checkDomainStatus';


const USD_TO_EGP_RATE_OFFICE = 47.5; // سعر الصرف لمصاريف المكتب
const USD_TO_EGP_RATE_CLIENT = 50; // سعر الصرف لتحصيل العميل

type DomainStatus = 'checking' | 'online' | 'offline';


const projectLabels: Record<Project, string> = {
  rehlethadaf: 'مشاريع رحلة هدف',
  bofa: 'مشاريع بوفا',
  other: 'مشاريع أخرى',
};
const projectOptions: Project[] = ['rehlethadaf', 'bofa', 'other'];


export function DomainDashboard({ project }: { project: Project }) {
  const [domains, setDomains] = React.useState<Domain[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isAddDomainOpen, setAddDomainOpen] = React.useState(false);
  const [isEditDomainOpen, setEditDomainOpen] = React.useState(false);
  const [domainToEdit, setDomainToEdit] = React.useState<Domain | null>(null);
  const [isDataSheetOpen, setDataSheetOpen] = React.useState(false);
  const [dataSheetContent, setDataSheetContent] = React.useState({ title: '', content: '' });
  const [editingDataSheetDomain, setEditingDataSheetDomain] = React.useState<Domain | null>(null);
  const [domainStatuses, setDomainStatuses] = React.useState<Record<string, DomainStatus>>({});
  const { toast } = useToast();

  React.useEffect(() => {
    const fetchDomainsAndStatuses = async () => {
      try {
        setLoading(true);
        const domainsFromDb = await getDomains();
        const domainsWithProject = domainsFromDb.map(d => ({
          ...d,
          projects: d.projects && d.projects.length > 0 ? d.projects : ['rehlethadaf']
        }));
        const sortedDomains = domainsWithProject.sort((a, b) => differenceInDays(parseISO(a.renewalDate as string), new Date()) - differenceInDays(parseISO(b.renewalDate as string), new Date()));
        setDomains(sortedDomains);

        // Set all to checking initially
        const initialStatuses: Record<string, DomainStatus> = {};
        sortedDomains.forEach(d => {
            if (d.id) initialStatuses[d.id] = 'checking';
        });
        setDomainStatuses(initialStatuses);
        
        // Check statuses
        sortedDomains.forEach(async (domain) => {
          if (domain.id) {
            try {
              const { isOnline } = await checkDomainStatus({ domainName: domain.domainName });
              setDomainStatuses(prev => ({ ...prev, [domain.id!]: isOnline ? 'online' : 'offline' }));
            } catch (e) {
               setDomainStatuses(prev => ({ ...prev, [domain.id!]: 'offline' }));
            }
          }
        });

      } catch (error) {
        console.error("Error fetching domains:", error);
        toast({
          title: "خطأ",
          description: "فشل في تحميل النطاقات من قاعدة البيانات.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchDomainsAndStatuses();
  }, [toast]);

  const [newDomain, setNewDomain] = React.useState<{
    domainName: string;
    dataSheet: string;
    renewalDate: Date;
    renewalCostClient: number | '';
    renewalCostOffice: number | '';
    clientEmail: string;
    projects: Project[];
  }>({
    domainName: '',
    dataSheet: '',
    renewalDate: new Date(),
    renewalCostClient: '',
    renewalCostOffice: '',
    clientEmail: '',
    projects: [project]
  });

  const handleAddDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDomain.domainName) {
      toast({
        title: "خطأ",
        description: "يرجى ملء حقل اسم النطاق.",
        variant: "destructive",
      });
      return;
    }

    if (newDomain.projects.length === 0) {
      toast({
        title: "خطأ",
        description: "يرجى تحديد مشروع واحد على الأقل.",
        variant: "destructive",
      });
      return;
    }

    const newDomainEntry: Omit<Domain, 'id'> = {
      domainName: newDomain.domainName,
      dataSheet: newDomain.dataSheet,
      renewalDate: formatISO(newDomain.renewalDate),
      renewalCostClient: Number(newDomain.renewalCostClient) || 0,
      renewalCostOffice: Number(newDomain.renewalCostOffice) || 0,
      status: 'active',
      collectionDate: formatISO(new Date()),
      clientEmail: newDomain.clientEmail,
      projects: newDomain.projects
    };
    
    try {
      const addedDomain = await addDomain(newDomainEntry);
      setDomains(prevDomains => [...prevDomains, addedDomain].sort((a, b) => differenceInDays(parseISO(a.renewalDate as string), new Date()) - differenceInDays(parseISO(b.renewalDate as string), new Date())));
      toast({
          title: "تمت إضافة النطاق",
          description: `تمت إضافة ${newDomain.domainName} بنجاح.`,
      });
      setAddDomainOpen(false);
      setNewDomain({
          domainName: '',
          dataSheet: '',
          renewalDate: new Date(),
          renewalCostClient: '',
          renewalCostOffice: '',
          clientEmail: '',
          projects: [project],
      });
    } catch (error) {
       console.error("Error adding domain:", error);
       toast({
          title: "خطأ",
          description: `فشل في إضافة النطاق.`,
          variant: "destructive",
      });
    }
  };

  const handleDeleteDomain = async (domainId: string) => {
    const domainToDelete = domains.find(d => d.id === domainId);
    if (!domainToDelete) return;

    try {
      await deleteDomain(domainId);
      setDomains(domains.filter(d => d.id !== domainId));
      toast({
          title: "تم حذف النطاق",
          description: `تم حذف ${domainToDelete.domainName} بنجاح.`,
          variant: "destructive"
      });
    } catch (error) {
       toast({
          title: "خطأ",
          description: `فشل في حذف النطاق.`,
          variant: "destructive",
      });
    }
  };

  const handleUpdateDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!domainToEdit || !domainToEdit.id) return;

    if (!domainToEdit.projects || domainToEdit.projects.length === 0) {
      toast({
        title: "خطأ",
        description: "يرجى تحديد مشروع واحد على الأقل.",
        variant: "destructive",
      });
      return;
    }

    const { id, ...updatedData } = domainToEdit;

    if (typeof updatedData.renewalDate !== 'string') {
        updatedData.renewalDate = formatISO(updatedData.renewalDate as Date);
    }
     
    try {
      const finalData = {
          ...updatedData,
          renewalCostClient: Number(updatedData.renewalCostClient) || 0,
          renewalCostOffice: Number(updatedData.renewalCostOffice) || 0,
      };

      await updateDomain(id, finalData);
      setDomains(prevDomains => prevDomains.map(d => d.id === id ? { ...d, ...domainToEdit, renewalDate: finalData.renewalDate, renewalCostClient: finalData.renewalCostClient, renewalCostOffice: finalData.renewalCostOffice } : d).sort((a, b) => differenceInDays(parseISO(a.renewalDate as string), new Date()) - differenceInDays(parseISO(b.renewalDate as string), new Date())));
      toast({
        title: "تم تحديث النطاق",
        description: `تم تحديث ${domainToEdit.domainName} بنجاح.`,
      });
      setEditDomainOpen(false);
      setDomainToEdit(null);
    } catch (error) {
      console.error("Error updating domain:", error);
      toast({
        title: "خطأ",
        description: "فشل في تحديث النطاق.",
        variant: "destructive",
      });
    }
  };
  
  const handleRenewDomain = async (domain: Domain) => {
    if (!domain.id) return;

    const currentRenewalDate = parseISO(domain.renewalDate as string);
    const nextRenewalDate = addYears(currentRenewalDate, 1);
    const nextRenewalDateISO = formatISO(nextRenewalDate);

    try {
        await updateDomain(domain.id, { renewalDate: nextRenewalDateISO });
        setDomains(prevDomains =>
            prevDomains.map(d =>
                d.id === domain.id ? { ...d, renewalDate: nextRenewalDateISO } : d
            ).sort((a, b) => differenceInDays(parseISO(a.renewalDate as string), new Date()) - differenceInDays(parseISO(b.renewalDate as string), new Date()))
        );
        toast({
            title: "تم تجديد النطاق",
            description: `تم تحديث تاريخ تجديد ${domain.domainName} إلى ${format(nextRenewalDate, 'dd/MM/yyyy')}.`,
        });
    } catch (error) {
        console.error("Error renewing domain:", error);
        toast({
            title: "خطأ",
            description: "فشل في تجديد النطاق.",
            variant: "destructive",
        });
    }
  };

  const openEditDialog = (domain: Domain) => {
    setDomainToEdit({
        ...domain,
        renewalDate: parseISO(domain.renewalDate as string),
        renewalCostClient: domain.renewalCostClient || '',
        renewalCostOffice: domain.renewalCostOffice || '',
        clientEmail: domain.clientEmail || '',
        projects: domain.projects || [],
    });
    setEditDomainOpen(true);
  };
  
  const openDataSheetDialog = (domain: Domain) => {
    setDataSheetContent({ title: `شيت بيانات: ${domain.domainName}`, content: domain.dataSheet });
    setEditingDataSheetDomain(domain);
    setDataSheetOpen(true);
  };

  const handleDataSheetChange = (content: string) => {
      setDataSheetContent(prev => ({ ...prev, content }));
      if (editingDataSheetDomain) {
          setEditingDataSheetDomain(prev => prev ? { ...prev, dataSheet: content } : null);
      }
  };

  const handleSaveDataSheet = async () => {
    if (!editingDataSheetDomain || !editingDataSheetDomain.id) return;

    try {
        await updateDomain(editingDataSheetDomain.id, { dataSheet: editingDataSheetDomain.dataSheet });
        setDomains(prevDomains => prevDomains.map(d => d.id === editingDataSheetDomain.id ? editingDataSheetDomain : d));
        toast({
            title: "تم حفظ شيت البيانات",
            description: `تم تحديث شيت بيانات ${editingDataSheetDomain.domainName}.`,
        });
        setDataSheetOpen(false);
        setEditingDataSheetDomain(null);
    } catch (error) {
        console.error("Error saving data sheet:", error);
        toast({
            title: "خطأ",
            description: "فشل في حفظ شيت البيانات.",
            variant: "destructive",
        });
    }
  };


  const getRenewalProgress = (renewalDate: string) => {
    const renewal = parseISO(renewalDate);
    const today = new Date();
    
    // If renewal date is in the past, progress is 100%
    if (differenceInDays(renewal, today) <= 0) {
      return 100;
    }

    const lastRenewal = subYears(renewal, 1);
    const totalDaysInYear = differenceInDays(renewal, lastRenewal);
    
    if (totalDaysInYear <= 0) {
      return 0; // Or 100, depending on desired behavior for edge case
    }
    
    const daysPassed = differenceInDays(today, lastRenewal);
    const progress = Math.max(0, Math.min(100, (daysPassed / totalDaysInYear) * 100));

    return progress;
  };

  const handleProjectToggle = (
    toggledProject: Project,
    setter: React.Dispatch<React.SetStateAction<any>>,
    fieldName: string
  ) => {
    setter((prevState: any) => {
        const currentProjects = prevState[fieldName] || [];
        const newProjects = currentProjects.includes(toggledProject)
            ? currentProjects.filter((p: Project) => p !== toggledProject)
            : [...currentProjects, toggledProject];
        return { ...prevState, [fieldName]: newProjects };
    });
  };

  const renderStatusDot = (domainId: string) => {
    const status = domainStatuses[domainId];
    if (status === 'checking') {
      return <div className="h-2 w-2 rounded-full bg-yellow-500 animate-pulse" title="يتم التحقق..."></div>;
    }
    if (status === 'offline') {
      return <div className="h-2 w-2 rounded-full bg-red-500" title="غير متصل"></div>;
    }
    if (status === 'online') {
      return <div className="h-2 w-2 rounded-full bg-green-500" title="متصل"></div>;
    }
    return null;
  };

  const getUrl = (domainName: string) => {
    return domainName.startsWith('http') ? domainName : `https://${domainName}`;
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const filteredDomains = domains.filter(d => d.projects?.includes(project));

  return (
    <>
      {/* Desktop Table */}
      <div className="hidden md:block rounded-md border mt-4">
        <Table>
          <TableBody>
            {filteredDomains.map(domain => (
              <TableRow key={domain.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {domain.id && renderStatusDot(domain.id)}
                    <a href={getUrl(domain.domainName)} target="_blank" rel="noopener noreferrer" className="font-medium text-lg text-primary hover:underline">{domain.domainName}</a>
                  </div>
                  <div className='mt-2'>
                    <div>{format(parseISO(domain.renewalDate as string), 'dd/MM/yyyy')}</div>
                    <Progress value={getRenewalProgress(domain.renewalDate as string)} className="h-2 mt-1" />
                  </div>
                </TableCell>
                <TableCell>
                    <div className="text-accent font-semibold">${Number(domain.renewalCostClient).toFixed(2)}</div>
                    <div className="text-xs text-muted-foreground">{(Number(domain.renewalCostClient) * USD_TO_EGP_RATE_CLIENT).toFixed(2)} ج.م</div>
                </TableCell>
                {project === 'rehlethadaf' && (
                  <TableCell>
                      <div className="text-destructive font-semibold">${Number(domain.renewalCostOffice).toFixed(2)}</div>
                      <div className="text-xs text-muted-foreground">{(Number(domain.renewalCostOffice) * USD_TO_EGP_RATE_OFFICE).toFixed(2)} ج.م</div>
                  </TableCell>
                )}
                <TableCell className="text-left flex items-center">
                   <Button variant="ghost" size="icon" onClick={() => openDataSheetDialog(domain)}>
                     <FileText className="h-4 w-4" />
                   </Button>
                   <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <Check className="h-4 w-4 text-green-500" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>تأكيد التجديد</AlertDialogTitle>
                        <AlertDialogDescription>
                          هل أنت متأكد من أنك تريد تجديد النطاق 
                          <span className="font-bold"> {domain.domainName}</span>؟ 
                          سيتم تحديث تاريخ التجديد للعام القادم.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>إلغاء</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleRenewDomain(domain)}>
                          تجديد
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  <Button variant="ghost" size="icon" onClick={() => openEditDialog(domain)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" disabled={!domain.id}>
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
                        <AlertDialogAction onClick={() => handleDeleteDomain(domain.id!)}>
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

      {/* Mobile Cards */}
      <div className="md:hidden grid grid-cols-1 gap-4 mt-4">
        {filteredDomains.map(domain => (
          <Card key={domain.id} className="w-full overflow-hidden">
             <div className="bg-muted/50 p-2 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={() => openDataSheetDialog(domain)}>
                    <FileText className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <Check className="h-4 w-4 text-green-500" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>تأكيد التجديد</AlertDialogTitle>
                        <AlertDialogDescription>
                           هل أنت متأكد من أنك تريد تجديد النطاق 
                           <span className="font-bold"> {domain.domainName}</span>؟ 
                           سيتم تحديث تاريخ التجديد للعام القادم.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>إلغاء</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleRenewDomain(domain)}>
                          تجديد
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
                <div className="flex items-center">
                  <Button variant="ghost" size="icon" onClick={() => openEditDialog(domain)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" disabled={!domain.id}>
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
                        <AlertDialogAction onClick={() => handleDeleteDomain(domain.id!)}>
                          متابعة
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                {domain.id && renderStatusDot(domain.id)}
                 <a href={getUrl(domain.domainName)} target="_blank" rel="noopener noreferrer" className="font-medium text-lg text-primary hover:underline">{domain.domainName}</a>
              </div>
              
              <div className='mt-4'>
                <div>{format(parseISO(domain.renewalDate as string), 'dd/MM/yyyy')}</div>
                <Progress value={getRenewalProgress(domain.renewalDate as string)} className="h-2 mt-1" />
              </div>

              <div className={`mt-4 grid ${project === 'rehlethadaf' ? 'grid-cols-2' : 'grid-cols-1'} gap-4 text-center`}>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">تكلفة العميل</div>
                  <div className="text-accent font-semibold">${Number(domain.renewalCostClient).toFixed(2)}</div>
                  <div className="text-xs text-muted-foreground">{(Number(domain.renewalCostClient) * USD_TO_EGP_RATE_CLIENT).toFixed(2)} ج.م</div>
                </div>
                {project === 'rehlethadaf' && (
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">تكلفة المكتب</div>
                     <div className="text-destructive font-semibold">${Number(domain.renewalCostOffice).toFixed(2)}</div>
                     <div className="text-xs text-muted-foreground">{(Number(domain.renewalCostOffice) * USD_TO_EGP_RATE_OFFICE).toFixed(2)} ج.م</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Button 
        onClick={() => {
          setNewDomain(prev => ({ ...prev, projects: [project] }));
          setAddDomainOpen(true);
        }}
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
                        <Label htmlFor="clientEmail" className="text-right">بريد العميل</Label>
                        <Input id="clientEmail" value={newDomain.clientEmail} onChange={(e) => setNewDomain({...newDomain, clientEmail: e.target.value})} className="col-span-3" />
                    </div>
                     <div className="grid grid-cols-4 items-start gap-4">
                        <Label htmlFor="dataSheet" className="text-right pt-2">شيت البيانات</Label>
                        <Textarea id="dataSheet" value={newDomain.dataSheet} onChange={(e) => setNewDomain({...newDomain, dataSheet: e.target.value})} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                           <Label htmlFor="renewalCostClient">تكلفة العميل (بالدولار)</Label>
                           <div className="relative">
                               <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">$</span>
                               <Input id="renewalCostClient" type="number" placeholder="0.00" value={newDomain.renewalCostClient} onChange={(e) => setNewDomain({...newDomain, renewalCostClient: e.target.value === '' ? '' : Number(e.target.value)})} className="pl-7" />
                           </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="renewalCostOffice">تكلفة المكتب (بالدولار)</Label>
                            <div className="relative">
                               <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">$</span>
                               <Input id="renewalCostOffice" type="number" placeholder="0.00" value={newDomain.renewalCostOffice} onChange={(e) => setNewDomain({...newDomain, renewalCostOffice: e.target.value === '' ? '' : Number(e.target.value)})} className="pl-7" />
                           </div>
                        </div>
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
                                    {newDomain.renewalDate ? format(newDomain.renewalDate, "dd/MM/yyyy") : <span>اختر تاريخًا</span>}
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
                    <div className="grid grid-cols-4 items-start gap-4">
                        <Label className="text-right pt-2">المشاريع</Label>
                        <div className="col-span-3 space-y-2">
                            {projectOptions.map(p => (
                                <div key={p} className="flex items-center space-x-2 space-x-reverse">
                                    <Checkbox
                                        id={`add-${p}`}
                                        checked={newDomain.projects.includes(p)}
                                        onCheckedChange={() => handleProjectToggle(p, setNewDomain, 'projects')}
                                    />
                                    <Label htmlFor={`add-${p}`} className="font-normal">{projectLabels[p]}</Label>
                                </div>
                            ))}
                        </div>
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
      
      {/* Edit Domain Dialog */}
      <Dialog open={isEditDomainOpen} onOpenChange={setEditDomainOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تعديل النطاق</DialogTitle>
            <DialogDescription>
              قم بتحديث تفاصيل النطاق المحدد.
            </DialogDescription>
          </DialogHeader>
          {domainToEdit && (
            <form onSubmit={handleUpdateDomain}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="editDomainName" className="text-right">النطاق</Label>
                  <Input id="editDomainName" value={domainToEdit.domainName} onChange={(e) => setDomainToEdit({ ...domainToEdit, domainName: e.target.value })} className="col-span-3" required />
                </div>
                 <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="editClientEmail" className="text-right">بريد العميل</Label>
                    <Input id="editClientEmail" value={domainToEdit.clientEmail} onChange={(e) => setDomainToEdit({ ...domainToEdit, clientEmail: e.target.value })} className="col-span-3" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="editRenewalCostClient">تكلفة العميل (بالدولار)</Label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">$</span>
                      <Input id="editRenewalCostClient" type="number" placeholder="0.00" value={domainToEdit.renewalCostClient} onChange={(e) => setDomainToEdit({ ...domainToEdit, renewalCostClient: e.target.value === '' ? '' : Number(e.target.value) })} className="pl-7" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="editRenewalCostOffice">تكلفة المكتب (بالدولار)</Label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">$</span>
                      <Input id="editRenewalCostOffice" type="number" placeholder="0.00" value={domainToEdit.renewalCostOffice} onChange={(e) => setDomainToEdit({ ...domainToEdit, renewalCostOffice: e.target.value === '' ? '' : Number(e.target.value) })} className="pl-7" />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">تاريخ التجديد</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "col-span-3 justify-start text-left font-normal",
                          !domainToEdit.renewalDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="ml-2 h-4 w-4" />
                        {domainToEdit.renewalDate ? format(domainToEdit.renewalDate as Date, "dd/MM/yyyy") : <span>اختر تاريخًا</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={domainToEdit.renewalDate as Date}
                        onSelect={(date) => setDomainToEdit({ ...domainToEdit, renewalDate: date || new Date() })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                 <div className="grid grid-cols-4 items-start gap-4">
                    <Label className="text-right pt-2">المشاريع</Label>
                    <div className="col-span-3 space-y-2">
                        {projectOptions.map(p => (
                            <div key={p} className="flex items-center space-x-2 space-x-reverse">
                                <Checkbox
                                    id={`edit-${p}`}
                                    checked={domainToEdit.projects?.includes(p)}
                                    onCheckedChange={() => handleProjectToggle(p, setDomainToEdit, 'projects')}
                                />
                                <Label htmlFor={`edit-${p}`} className="font-normal">{projectLabels[p]}</Label>
                            </div>
                        ))}
                    </div>
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline" onClick={() => setEditDomainOpen(false)}>إلغاء</Button>
                </DialogClose>
                <Button type="submit">حفظ التغييرات</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Data Sheet Dialog */}
      <Dialog open={isDataSheetOpen} onOpenChange={(isOpen) => {
          if (!isOpen) {
              setEditingDataSheetDomain(null);
          }
          setDataSheetOpen(isOpen);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dataSheetContent.title}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              value={dataSheetContent.content}
              onChange={(e) => handleDataSheetChange(e.target.value)}
              className="min-h-[200px] w-full"
              readOnly={!editingDataSheetDomain}
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">إغلاق</Button>
            </DialogClose>
            {editingDataSheetDomain && <Button type="button" onClick={handleSaveDataSheet}>حفظ</Button>}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

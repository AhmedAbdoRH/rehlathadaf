
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
import type { Domain, Project, Todo } from '@/lib/types';
import { format, parseISO, formatISO, differenceInDays, subYears, addYears } from 'date-fns';
import { Plus, Trash2, Calendar as CalendarIcon, Loader2, Pencil, Check, FileText, CalendarPlus, ChevronDown } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar } from './ui/calendar';
import { Progress } from './ui/progress';
import { Card, CardContent } from './ui/card';
import { addDomain, deleteDomain, updateDomain } from '@/services/domainService';
import { cn } from "@/lib/utils"
import { Textarea } from './ui/textarea';
import { Checkbox } from './ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { TodoList } from './todo-list';

const USD_TO_EGP_RATE_OFFICE = 47.5; // سعر الصرف لمصاريف المكتب
const USD_TO_EGP_RATE_CLIENT = 50; // سعر الصرف لتحصيل العميل

type DomainStatus = 'checking' | 'online' | 'offline';


const projectLabels: Record<Project, string> = {
  rehlethadaf: 'رحلة هدف',
  pova: 'Pova',
  other: 'مشاريع أخرى',
};
const projectOptions: Project[] = ['rehlethadaf', 'pova', 'other'];

interface DomainDashboardProps {
  project: Project;
  allDomains: Domain[];
  allTodos: Record<string, Todo[]>;
  domainStatuses: Record<string, DomainStatus>;
  loading: boolean;
  onDomainChange: () => void;
  onTodoChange: () => void;
}

export function DomainDashboard({ 
  project, 
  allDomains,
  allTodos,
  domainStatuses,
  loading,
  onDomainChange, 
  onTodoChange 
}: DomainDashboardProps) {
  const [isAddDomainOpen, setAddDomainOpen] = React.useState(false);
  const [isEditDomainOpen, setEditDomainOpen] = React.useState(false);
  const [domainToEdit, setDomainToEdit] = React.useState<Domain | null>(null);
  const [isDataSheetOpen, setDataSheetOpen] = React.useState(false);
  const [dataSheetContent, setDataSheetContent] = React.useState({ title: '', content: '' });
  const [editingDataSheetDomain, setEditingDataSheetDomain] = React.useState<Domain | null>(null);
  const { toast } = useToast();
  const [initialRenewalDate, setInitialRenewalDate] = React.useState<Date | null>(null);
  
    React.useEffect(() => {
        setInitialRenewalDate(addYears(new Date(), 1));
    }, []);

  const [newDomain, setNewDomain] = React.useState<{
    domainName: string;
    dataSheet: string;
    renewalDate: Date | null;
    renewalCostClient: number | '';
    renewalCostOffice: number | '';
    renewalCostPova: number | '';
    projects: Project[];
  }>({
    domainName: '',
    dataSheet: '',
    renewalDate: null,
    renewalCostClient: '',
    renewalCostOffice: '',
    renewalCostPova: '',
    projects: [project]
  });
  
  React.useEffect(() => {
    if (initialRenewalDate) {
        setNewDomain(prev => ({...prev, renewalDate: initialRenewalDate, projects: [project]}));
    }
  }, [initialRenewalDate, project]);

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
    
    if (!newDomain.renewalDate) {
        toast({
            title: "خطأ",
            description: "يرجى تحديد تاريخ التجديد.",
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
      renewalCostPova: Number(newDomain.renewalCostPova) || 0,
      status: 'active',
      collectionDate: formatISO(new Date()),
      projects: newDomain.projects
    };
    
    try {
      await addDomain(newDomainEntry);
      toast({
          title: "تمت إضافة النطاق",
          description: `تمت إضافة ${newDomain.domainName} بنجاح.`,
      });
      setAddDomainOpen(false);
      setNewDomain({
          domainName: '',
          dataSheet: '',
          renewalDate: initialRenewalDate,
          renewalCostClient: '',
          renewalCostOffice: '',
          renewalCostPova: '',
          projects: [project],
      });
      onDomainChange();
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
    const domainToDelete = allDomains.find(d => d.id === domainId);
    if (!domainToDelete) return;

    try {
      await deleteDomain(domainId);
      toast({
          title: "تم حذف النطاق",
          description: `تم حذف ${domainToDelete.domainName} بنجاح.`,
          variant: "destructive"
      });
      onDomainChange();
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
          renewalCostPova: Number(updatedData.renewalCostPova) || 0,
      };

      await updateDomain(id, finalData);
      toast({
        title: "تم تحديث النطاق",
        description: `تم تحديث ${domainToEdit.domainName} بنجاح.`,
      });
      setEditDomainOpen(false);
      setDomainToEdit(null);
      onDomainChange();
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
        toast({
            title: "تم تجديد النطاق",
            description: `تم تحديث تاريخ تجديد ${domain.domainName} إلى ${format(nextRenewalDate, 'dd/MM/yyyy')}.`,
        });
        onDomainChange();
    } catch (error) {
        console.error("Error renewing domain:", error);
        toast({
            title: "خطأ",
            description: "فشل في تجديد النطاق.",
        });
    }
  };

  const openEditDialog = (domain: Domain) => {
    setDomainToEdit({
        ...domain,
        renewalDate: parseISO(domain.renewalDate as string),
        renewalCostClient: domain.renewalCostClient || '',
        renewalCostOffice: domain.renewalCostOffice || '',
        renewalCostPova: domain.renewalCostPova || '',
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
        toast({
            title: "تم حفظ شيت البيانات",
            description: `تم تحديث شيت بيانات ${editingDataSheetDomain.domainName}.`,
        });
        setDataSheetOpen(false);
        setEditingDataSheetDomain(null);
        onDomainChange();
    } catch (error) {
        console.error("Error saving data sheet:", error);
        toast({
            title: "خطأ",
            description: "فشل في حفظ شيت البيانات.",
        });
    }
  };

  const getGoogleCalendarLink = (domain: Domain) => {
    const renewalDate = parseISO(domain.renewalDate as string);
    const dateStr = format(renewalDate, 'yyyyMMdd');
    const title = encodeURIComponent(`تذكير تجديد نطاق: ${domain.domainName}`);
    const details = encodeURIComponent(
      `لا تنسَ تجديد نطاق ${domain.domainName}.\n` +
      `قيمة التجديد: $${Number(domain.renewalCostClient).toFixed(2)} (${(Number(domain.renewalCostClient) * USD_TO_EGP_RATE_CLIENT).toFixed(2)} ج.م)\n` +
      (project === 'rehlethadaf' ? `تكلفة المكتب: $${Number(domain.renewalCostOffice).toFixed(2)} (${(Number(domain.renewalCostOffice) * USD_TO_EGP_RATE_OFFICE).toFixed(2)} ج.م)` : '')
    );
    return `https://www.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dateStr}/${dateStr}&details=${details}&sf=true&output=xml`;
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
    const todosForDomain = allTodos[domainId] || [];
    const hasTodos = todosForDomain.some(t => !t.completed);

    if (hasTodos) {
      return <div className="h-2 w-2 rounded-full bg-blue-500 shadow-[0_0_8px_2px] shadow-blue-500/60 animate-pulse" title="يحتوي على مهام"></div>;
    }
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

  const [sortedDomains, setSortedDomains] = React.useState<Domain[]>([]);

    React.useEffect(() => {
        const filtered = allDomains
            .filter(d => d.projects?.includes(project))
            .sort((a, b) => differenceInDays(parseISO(a.renewalDate as string), new Date()) - differenceInDays(parseISO(b.renewalDate as string), new Date()));
        setSortedDomains(filtered);
    }, [allDomains, project]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }


  return (
    <>
      {/* Desktop Table */}
      <div className="hidden md:block rounded-md border mt-4">
        <Table>
          <TableBody>
            {sortedDomains.map(domain => (
              <Collapsible asChild key={domain.id}>
              <React.Fragment key={domain.id}>
              <TableRow>
                <TableCell colSpan={project === 'pova' ? 6 : 5}>
                  <div className='flex items-start'>
                    <div className='flex-grow'>
                      <div className="flex items-center gap-2">
                        {domain.id && renderStatusDot(domain.id)}
                        <a href={getUrl(domain.domainName)} target="_blank" rel="noopener noreferrer" className="font-medium text-lg" style={{ color: '#90b8f8' }}>{domain.domainName}</a>
                      </div>
                      <div className='mt-2'>
                        <div className="text-right">{`${format(parseISO(domain.renewalDate as string), 'dd/MM/yyyy')}`}</div>
                        <Progress value={getRenewalProgress(domain.renewalDate as string)} className="h-2 mt-1" />
                      </div>
                    </div>
                    <div className='flex items-center gap-4 px-4'>
                      {project === 'pova' ? (
                        <div className="text-center">
                            <div className="text-destructive font-semibold">${Number(domain.renewalCostClient).toFixed(2)}</div>
                            <div className="text-xs text-muted-foreground">{(Number(domain.renewalCostClient) * USD_TO_EGP_RATE_CLIENT).toFixed(2)} ج.م</div>
                            <div className="text-xs text-muted-foreground mt-1">B2B</div>
                        </div>
                      ) : project !== 'other' && (
                        <div className="text-center">
                            <div className="text-accent font-semibold">${Number(domain.renewalCostClient).toFixed(2)}</div>
                            <div className="text-xs text-muted-foreground">{(Number(domain.renewalCostClient) * USD_TO_EGP_RATE_CLIENT).toFixed(2)} ج.م</div>
                        </div>
                      )}
                      {project === 'pova' && (
                          <div className="text-center">
                            <div className="text-accent font-semibold">${Number(domain.renewalCostPova).toFixed(2)}</div>
                            <div className="text-xs text-muted-foreground">{(Number(domain.renewalCostPova) * USD_TO_EGP_RATE_CLIENT).toFixed(2)} ج.م</div>
                            <div className="text-xs text-muted-foreground mt-1">Pova</div>
                        </div>
                      )}
                      {(project === 'rehlethadaf' || project === 'other') && (
                        <div className="text-center">
                            <div className="text-destructive font-semibold">${Number(domain.renewalCostOffice).toFixed(2)}</div>
                            <div className="text-xs text-muted-foreground">{(Number(domain.renewalCostOffice) * USD_TO_EGP_RATE_OFFICE).toFixed(2)} ج.م</div>
                        </div>
                      )}
                    </div>
                     <div className="flex items-center justify-end gap-2">
                   <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        title="تجديد"
                        className="rounded-full w-8 h-8 bg-green-500/10 hover:bg-green-500/20 hover:scale-110 transition-all duration-300 hover:shadow-xl hover:shadow-green-500/30 border border-green-500/20 hover:border-green-500/40"
                      >
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
                   <a href={getGoogleCalendarLink(domain)} target="_blank" rel="noopener noreferrer" title="إضافة للتقويم">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="rounded-full w-8 h-8 bg-yellow-500/10 hover:bg-yellow-500/20 hover:scale-110 transition-all duration-300 hover:shadow-xl hover:shadow-yellow-500/30 border border-yellow-500/20 hover:border-yellow-500/40"
                      >
                        <CalendarPlus className="h-4 w-4 text-yellow-500" />
                      </Button>
                    </a>
                  {project !== 'pova' && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => openEditDialog(domain)} 
                    title="تعديل"
                                            className="rounded-full w-8 h-8 bg-blue-500/10 hover:bg-blue-500/20 hover:scale-110 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/30 border border-blue-500/20 hover:border-blue-500/40"
                  >
                    <Pencil className="h-4 w-4 text-blue-500" />
                  </Button>
                  )}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        disabled={!domain.id} 
                        title="حذف"
                        className="rounded-full w-8 h-8 bg-red-500/10 hover:bg-red-500/20 hover:scale-110 transition-all duration-300 hover:shadow-xl hover:shadow-red-500/30 border border-red-500/20 hover:border-red-500/40 disabled:opacity-50 disabled:hover:scale-100 disabled:hover:shadow-none"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
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
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => openDataSheetDialog(domain)} 
                    title="عرض شيت البيانات"
                                            className="rounded-full w-8 h-8 bg-purple-500/10 hover:bg-purple-500/20 hover:scale-110 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/30 border border-purple-500/20 hover:border-purple-500/40"
                  >
                     <FileText className="h-4 w-4 text-purple-500" />
                   </Button>
                   <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="w-9 p-0 data-[state=open]:rotate-180">
                          <ChevronDown className="h-4 w-4" />
                          <span className="sr-only">Toggle</span>
                      </Button>
                    </CollapsibleTrigger>
                  </div>
                  </div>
                </TableCell>
              </TableRow>
              <CollapsibleContent asChild>
                <TableRow>
                  <TableCell colSpan={project === 'pova' ? 6 : 5} className="p-0">
                    <div className="p-4 bg-muted/50">
                        <TodoList 
                          domainId={domain.id!} 
                          initialTodos={allTodos[domain.id!] || []}
                          onUpdate={onTodoChange}
                        />
                      </div>
                  </TableCell>
                </TableRow>
              </CollapsibleContent>
              </React.Fragment>
            </Collapsible>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden grid grid-cols-1 gap-4 mt-4">
        {sortedDomains.map(domain => (
          <Collapsible asChild key={domain.id}>
            <Card className="w-full overflow-hidden">
              <div className="bg-muted/50 p-2 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                      <AlertDialog>
                          <AlertDialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                title="تجديد"
                                className="rounded-full w-8 h-8 bg-green-500/10 hover:bg-green-500/20 hover:scale-110 transition-all duration-300 hover:shadow-xl hover:shadow-green-500/30 border border-green-500/20 hover:border-green-500/40"
                              >
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
                      <a href={getGoogleCalendarLink(domain)} target="_blank" rel="noopener noreferrer" title="إضافة للتقويم">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="rounded-full w-8 h-8 bg-yellow-500/10 hover:bg-yellow-500/20 hover:scale-110 transition-all duration-300 hover:shadow-xl hover:shadow-yellow-500/30 border border-yellow-500/20 hover:border-yellow-500/40"
                          >
                              <CalendarPlus className="h-4 w-4 text-yellow-500" />
                          </Button>
                      </a>
                  </div>
                  <div className="flex items-center gap-2">
                      {project !== 'pova' && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => openEditDialog(domain)} 
                        title="تعديل"
                                                className="rounded-full w-8 h-8 bg-blue-500/10 hover:bg-blue-500/20 hover:scale-110 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/30 border border-blue-500/20 hover:border-blue-500/40"
                      >
                          <Pencil className="h-4 w-4 text-blue-500" />
                      </Button>
                      )}
                      <AlertDialog>
                          <AlertDialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                disabled={!domain.id} 
                                title="حذف"
                                className="rounded-full w-8 h-8 bg-red-500/10 hover:bg-red-500/20 hover:scale-110 transition-all duration-300 hover:shadow-xl hover:shadow-red-500/30 border border-red-500/20 hover:border-red-500/40 disabled:opacity-50 disabled:hover:scale-100 disabled:hover:shadow-none"
                              >
                                  <Trash2 className="h-4 w-4 text-red-500" />
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
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => openDataSheetDialog(domain)} 
                        title="عرض شيت البيانات"
                                                className="rounded-full w-8 h-8 bg-purple-500/10 hover:bg-purple-500/20 hover:scale-110 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/30 border border-purple-500/20 hover:border-purple-500/40"
                      >
                          <FileText className="h-4 w-4 text-purple-500" />
                      </Button>
                  </div>
                </div>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  {domain.id && renderStatusDot(domain.id)}
                  <a href={getUrl(domain.domainName)} target="_blank" rel="noopener noreferrer" className="font-medium text-lg" style={{ color: '#90b8f8' }}>{domain.domainName}</a>
                </div>
                
                <div className='mt-4'>
                  <div className="text-right">{`${format(parseISO(domain.renewalDate as string), 'dd/MM/yyyy')}`}</div>
                  <Progress value={getRenewalProgress(domain.renewalDate as string)} className="h-2 mt-1" />
                </div>
                
                <div className={`mt-4 grid ${project === 'rehlethadaf' || project === 'other' ? 'grid-cols-2' : (project === 'pova' ? 'grid-cols-2' : 'grid-cols-1')} gap-4 text-center`}>
                  {project === 'pova' ? (
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">قيمة التجديد (B2B)</div>
                      <div className="text-destructive font-semibold">${Number(domain.renewalCostClient).toFixed(2)}</div>
                      <div className="text-xs text-muted-foreground">{(Number(domain.renewalCostClient) * USD_TO_EGP_RATE_CLIENT).toFixed(2)} ج.م</div>
                    </div>
                  ) : project !== 'other' && (
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">قيمة التجديد</div>
                      <div className="text-accent font-semibold">${Number(domain.renewalCostClient).toFixed(2)}</div>
                      <div className="text-xs text-muted-foreground">{(Number(domain.renewalCostClient) * USD_TO_EGP_RATE_CLIENT).toFixed(2)} ج.م</div>
                    </div>
                  )}
                  {project === 'pova' && (
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">قيمة التجديد (Pova)</div>
                      <div className="text-accent font-semibold">${Number(domain.renewalCostPova).toFixed(2)}</div>
                      <div className="text-xs text-muted-foreground">{(Number(domain.renewalCostPova) * USD_TO_EGP_RATE_CLIENT).toFixed(2)} ج.م</div>
                    </div>
                  )}
                  {(project === 'rehlethadaf' || project === 'other') && (
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">تكلفة المكتب</div>
                      <div className="text-destructive font-semibold">${Number(domain.renewalCostOffice).toFixed(2)}</div>
                      <div className="text-xs text-muted-foreground">{(Number(domain.renewalCostOffice) * USD_TO_EGP_RATE_OFFICE).toFixed(2)} ج.م</div>
                    </div>
                  )}
                </div>
              </CardContent>
              <CollapsibleTrigger asChild>
                  <div className="bg-muted/50 p-2 text-center cursor-pointer hover:bg-muted transition-colors">
                      <ChevronDown className="h-5 w-5 mx-auto text-muted-foreground data-[state=open]:rotate-180" />
                  </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="p-4 bg-muted/30 border-t">
                  <TodoList 
                    domainId={domain.id!}
                    initialTodos={allTodos[domain.id!] || []}
                    onUpdate={onTodoChange}
                   />
                </div>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        ))}
      </div>

      <Button 
        onClick={() => {
          setAddDomainOpen(true);
        }}
        className="fixed bottom-8 left-8 z-50 h-14 w-14 rounded-full shadow-lg bg-primary text-primary-foreground hover:bg-primary/90"
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
                     <div className="grid grid-cols-4 items-start gap-4">
                        <Label htmlFor="dataSheet" className="text-right pt-2">شيت البيانات</Label>
                        <Textarea id="dataSheet" value={newDomain.dataSheet} onChange={(e) => setNewDomain({...newDomain, dataSheet: e.target.value})} className="col-span-3 text-left" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                           <Label htmlFor="renewalCostClient">قيمة التجديد (بالدولار)</Label>
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
                    <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-2">
                           <Label htmlFor="renewalCostPova">قيمة التجديد (Pova)</Label>
                           <div className="relative">
                               <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">$</span>
                               <Input id="renewalCostPova" type="number" placeholder="0.00" value={newDomain.renewalCostPova} onChange={(e) => setNewDomain({...newDomain, renewalCostPova: e.target.value === '' ? '' : Number(e.target.value)})} className="pl-7" />
                           </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">التجديد</Label>
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
                                    selected={newDomain.renewalDate ?? undefined}
                                    onSelect={(date) => setNewDomain({...newDomain, renewalDate: date || null})}
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
                        <Button 
                          type="button" 
                          variant="outline"
                          className="hover:bg-gray-100 hover:scale-105 transition-all duration-200 hover:shadow-md"
                        >
                          إلغاء
                        </Button>
                    </DialogClose>
                    <Button 
                      type="submit"
                      className="bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105 transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/25"
                    >
                      إضافة نطاق
                    </Button>
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
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="editRenewalCostClient">قيمة التجديد (بالدولار)</Label>
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
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="editRenewalCostPova">قيمة التجديد (Pova)</Label>
                     <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">$</span>
                      <Input id="editRenewalCostPova" type="number" placeholder="0.00" value={domainToEdit.renewalCostPova} onChange={(e) => setDomainToEdit({ ...domainToEdit, renewalCostPova: e.target.value === '' ? '' : Number(e.target.value) })} className="pl-7" />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">التجديد</Label>
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
                        {domainToEdit.renewalDate ? format(domainToEdit.renewalDate as Date, "PPP") : <span>اختر تاريخًا</span>}
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
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setEditDomainOpen(false)}
                    className="hover:bg-gray-100 hover:scale-105 transition-all duration-200 hover:shadow-md"
                  >
                    إلغاء
                  </Button>
                </DialogClose>
                <Button 
                  type="submit"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105 transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/25"
                >
                  حفظ التغييرات
                </Button>
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
              className="min-h-[200px] w-full text-left"
              readOnly={!editingDataSheetDomain}
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button 
                type="button" 
                variant="outline"
                className="hover:bg-gray-100 hover:scale-105 transition-all duration-200 hover:shadow-md"
              >
                إغلاق
              </Button>
            </DialogClose>
            {editingDataSheetDomain && (
              <Button 
                type="button" 
                onClick={handleSaveDataSheet}
                className="bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105 transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/25"
              >
                حفظ
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

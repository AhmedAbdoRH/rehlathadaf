"use client";

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { addFault, deleteFault, getFaults } from '@/services/faultService';
import type { Fault } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from './ui/scroll-area';

interface FaultsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FaultsSheet({ open, onOpenChange }: FaultsSheetProps) {
  const [faults, setFaults] = React.useState<Fault[]>([]);
  const [newFault, setNewFault] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const { toast } = useToast();

  const fetchFaults = React.useCallback(async () => {
    try {
      setLoading(true);
      const fetchedFaults = await getFaults();
      setFaults(fetchedFaults);
    } catch (error) {
      console.error("Error fetching faults:", error);
      toast({
        title: "خطأ",
        description: "فشل في تحميل قائمة الأعطال.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);
  
  React.useEffect(() => {
    if (open) {
      fetchFaults();
    }
  }, [open, fetchFaults]);


  const handleAddFault = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = newFault.trim();
    if (!text) return;

    const tempId = `temp-${Date.now()}`;
    const optimisticFault: Fault = {
      id: tempId,
      text,
      createdAt: new Date().toISOString(),
    };

    setFaults(prevFaults => [optimisticFault, ...prevFaults]);
    setNewFault('');

    try {
      const addedFault = await addFault({ text });
      setFaults(prevFaults => 
        prevFaults.map(f => (f.id === tempId ? addedFault : f))
      );
    } catch (error) {
      setFaults(prevFaults => prevFaults.filter(f => f.id !== tempId));
      console.error("Error adding fault:", error);
      toast({
        title: "خطأ",
        description: "فشل في إضافة العطل.",
        variant: "destructive",
      });
    }
  };
  
  const handleDeleteFault = async (faultId: string) => {
    if (!faultId || faultId.startsWith('temp-')) return;
  
    const originalFaults = faults;
    setFaults(prev => prev.filter(f => f.id !== faultId));
  
    try {
      await deleteFault(faultId);
      toast({
        title: "نجاح",
        description: "تم حذف العطل.",
        variant: "destructive"
      });
    } catch (error) {
      setFaults(originalFaults);
      console.error("Error deleting fault:", error);
      toast({
        title: "خطأ",
        description: "فشل في حذف العطل.",
        variant: "destructive",
      });
    }
  };

  const handleLabelClick = (e: React.MouseEvent<HTMLLabelElement>) => {
    const range = document.createRange();
    range.selectNodeContents(e.currentTarget);
    const selection = window.getSelection();
    if (selection) {
      selection.removeAllRanges();
      selection.addRange(range);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col">
        <SheetHeader>
          <SheetTitle>أشهر الأعطال</SheetTitle>
          <SheetDescription>
            أضف أو احذف الأعطال المتكررة لسهولة الوصول إليها لاحقًا.
          </SheetDescription>
        </SheetHeader>
        <form onSubmit={handleAddFault} className="flex gap-2 my-4">
          <Input
            type="text"
            placeholder="أضف عطل جديد..."
            value={newFault}
            onChange={e => setNewFault(e.target.value)}
            className="bg-background"
          />
          <Button type="submit" size="icon">
            <Plus className="h-4 w-4" />
          </Button>
        </form>
        <ScrollArea className="flex-1">
          {loading ? (
            <div className="flex justify-center items-center h-24">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <div className="space-y-2 pr-4">
              {faults.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">لا توجد أعطال مسجلة.</p>
              ) : (
                faults.map(fault => (
                  <div key={fault.id} className="flex items-start gap-3 p-2 rounded-md bg-background/50 hover:bg-background transition-colors group">
                    <label 
                      onClick={handleLabelClick}
                      className="flex-1 text-sm select-all whitespace-pre-wrap text-foreground"
                    >
                      {fault.text}
                    </label>
                    <span className="text-xs text-muted-foreground mt-1">
                      {fault.createdAt ? formatDistanceToNow(new Date(fault.createdAt), { addSuffix: true, locale: ar }) : ''}
                    </span>
                    <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => fault.id && handleDeleteFault(fault.id)}>
                      <Trash2 className="h-4 w-4 text-destructive/80" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

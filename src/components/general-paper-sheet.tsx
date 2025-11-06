"use client";

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save } from 'lucide-react';
import { getGeneralPaper, saveGeneralPaper } from '@/services/generalPaperService';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Textarea } from './ui/textarea';

interface GeneralPaperSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GeneralPaperSheet({ open, onOpenChange }: GeneralPaperSheetProps) {
  const [content, setContent] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const { toast } = useToast();

  const fetchPaper = React.useCallback(async () => {
    try {
      setLoading(true);
      const paperContent = await getGeneralPaper();
      setContent(paperContent);
    } catch (error) {
      console.error("Error fetching general paper:", error);
      toast({
        title: "خطأ",
        description: "فشل في تحميل الورقة العامة.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);
  
  React.useEffect(() => {
    if (open) {
      fetchPaper();
    }
  }, [open, fetchPaper]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveGeneralPaper(content);
      toast({
        title: "تم الحفظ",
        description: "تم حفظ محتوى الورقة العامة بنجاح.",
      });
    } catch (error) {
      console.error("Error saving general paper:", error);
      toast({
        title: "خطأ",
        description: "فشل في حفظ الورقة العامة.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>الورقة العامة</SheetTitle>
          <SheetDescription>
            مكان لتدوين الملاحظات والأفكار العامة. يتم الحفظ تلقائيًا.
          </SheetDescription>
        </SheetHeader>
        
        <div className="flex-1 py-4">
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Textarea
              placeholder="اكتب شيئًا هنا..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="h-full resize-none bg-muted/50"
            />
          )}
        </div>

        <SheetFooter>
          <Button onClick={handleSave} disabled={saving || loading}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            <span className="mr-2">حفظ</span>
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

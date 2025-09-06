
"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Copy } from 'lucide-react';

type CopyableField = 'name' | 'account' | 'iban' | 'bank';

export default function TransferPage() {
  const [copiedField, setCopiedField] = useState<CopyableField | null>(null);

  const copyText = (id: CopyableField, value: string) => {
    navigator.clipboard.writeText(value).then(() => {
      setCopiedField(id);
      setTimeout(() => {
        setCopiedField(null);
      }, 1500);
    }).catch(err => {
      console.error("لم يتم النسخ: ", err);
    });
  };

  const fields: { id: CopyableField; label: string; value: string }[] = [
    { id: 'name', label: 'الاسم', value: 'محمد رزق جوده جاد' },
    { id: 'account', label: 'رقم الحساب', value: '991000010006087124455' },
    { id: 'iban', label: 'رقم الايبان', value: 'SA04 8000 0991 6080 1712 4455' },
    { id: 'bank', label: 'البنك', value: 'ALRAJHI BANKING CORPORATION' },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex justify-center items-center p-4">
      <Card className="w-full max-w-2xl shadow-lg">
        <CardHeader>
          <CardTitle className="text-center text-2xl">بيانات التحويل</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {fields.map(({ id, label, value }) => (
            <div key={id} className="space-y-2">
              <Label htmlFor={id} className="text-muted-foreground">{label}</Label>
              <div className="flex gap-2">
                <Input id={id} type="text" value={value} readOnly className="bg-muted/30" />
                <Button variant="secondary" onClick={() => copyText(id, value)}>
                  <Copy className="ml-2 h-4 w-4" />
                  {copiedField === id ? 'تم النسخ!' : 'نسخ'}
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

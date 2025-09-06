
"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Copy } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type CopyableField = 'name' | 'account' | 'iban' | 'bank';
type AccountDetails = {
  id: string;
  name: string;
  fields: { id: CopyableField; label: string; value: string }[];
};

const accounts: AccountDetails[] = [
  {
    id: 'hadaf',
    name: 'حساب مؤسسة رحلة هدف',
    fields: [
      { id: 'name', label: 'الاسم', value: 'مؤسسة رحلة هدف التجارية' },
      { id: 'account', label: 'رقم الحساب', value: '262354467001' },
      { id: 'iban', label: 'رقم الايبان', value: 'SA3145000000262354467001' },
      { id: 'bank', label: 'البنك', value: 'بنك الأول ساب' },
    ]
  },
  {
    id: 'mohamed',
    name: 'حساب محمد رزق',
    fields: [
      { id: 'name', label: 'الاسم', value: 'محمد رزق جوده جاد' },
      { id: 'account', label: 'رقم الحساب', value: '991000010006087124455' },
      { id: 'iban', label: 'رقم الايبان', value: 'SA04 8000 0991 6080 1712 4455' },
      { id: 'bank', label: 'البنك', value: 'ALRAJHI BANKING CORPORATION' },
    ]
  }
];

const AccountInfo = ({ details }: { details: AccountDetails }) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyText = (id: string, value: string) => {
    navigator.clipboard.writeText(value).then(() => {
      setCopiedField(id);
      setTimeout(() => {
        setCopiedField(null);
      }, 1500);
    }).catch(err => {
      console.error("لم يتم النسخ: ", err);
    });
  };

  return (
    <div className="space-y-4">
      {details.fields.map(({ id, label, value }) => (
        <div key={`${details.id}-${id}`} className="space-y-2">
          <Label htmlFor={`${details.id}-${id}`} className="text-muted-foreground">{label}</Label>
          <div className="flex gap-2">
            <Input id={`${details.id}-${id}`} type="text" value={value} readOnly className="bg-muted/30" />
            <Button variant="secondary" onClick={() => copyText(`${details.id}-${id}`, value)}>
              <Copy className="ml-2 h-4 w-4" />
              {copiedField === `${details.id}-${id}` ? 'تم النسخ!' : 'نسخ'}
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default function TransferPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex justify-center items-center p-4">
      <Card className="w-full max-w-2xl shadow-lg">
        <CardHeader>
          <CardTitle className="text-center text-2xl">بيانات التحويل</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="hadaf" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              {accounts.map(account => (
                <TabsTrigger key={account.id} value={account.id}>{account.name}</TabsTrigger>
              ))}
            </TabsList>
            {accounts.map(account => (
              <TabsContent key={account.id} value={account.id} className="pt-4">
                <AccountInfo details={account} />
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

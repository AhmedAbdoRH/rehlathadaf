
"use client";

import * as React from 'react';
import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  deleteDoc, 
  doc, 
  serverTimestamp, 
  query, 
  orderBy,
  limit,
  startAfter
} from "firebase/firestore";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Trash2, Share } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import html2canvas from 'html2canvas';

// Firebase config from your HTML
const firebaseConfig = {
  apiKey: "AIzaSyBt33Ut9nw0WX-DDRi46pB4klvXB8eNe90",
  authDomain: "rhm-banking.firebaseapp.com",
  projectId: "rhm-banking",
  storageBucket: "rhm-banking.appspot.com",
  messagingSenderId: "441668952624",
  appId: "1:441668952624:web:f45150dcdc42c6c48203f5",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig, "cashHubApp"); // Use a unique name
const db = getFirestore(app);

const ITEMS_PER_PAGE = 10;

interface Transaction {
  id: string;
  name: string;
  cost: number;
  date: string;
  timestamp: { seconds: number };
}

export default function CashHubPage() {
  const { toast } = useToast();
  const pageRef = React.useRef<HTMLDivElement>(null);

  const [exchangeRate, setExchangeRate] = React.useState(30.9);
  const [transactions, setTransactions] = React.useState<Transaction[]>([]);
  const [lastTransaction, setLastTransaction] = React.useState<any>(null);
  const [hasMore, setHasMore] = React.useState(true);
  const [transactionName, setTransactionName] = React.useState('');
  const [transactionCost, setTransactionCost] = React.useState('');
  const [transactionCurrency, setTransactionCurrency] = React.useState('SAR');
  const [totalIncome, setTotalIncome] = React.useState(0);

  const convertToUSD = (amount: number, currency: string) => {
    if (!amount || !currency) return 0;
    switch (currency) {
      case "SAR": return amount / 3.75;
      case "EGP": return amount / exchangeRate;
      default: return amount;
    }
  };
  
  const loadTransactions = React.useCallback(async (loadMore = false) => {
    try {
      let q;
      const transactionsRef = collection(db, "transactions");
      const baseQuery = [orderBy("timestamp", "desc")];

      if (loadMore && lastTransaction) {
        q = query(transactionsRef, ...baseQuery, startAfter(lastTransaction), limit(ITEMS_PER_PAGE));
      } else {
        q = query(transactionsRef, ...baseQuery, limit(ITEMS_PER_PAGE));
      }

      const querySnapshot = await getDocs(q);
      const newTransactions = querySnapshot.docs.map(docSnapshot => ({ id: docSnapshot.id, ...docSnapshot.data() } as Transaction));
      
      setLastTransaction(querySnapshot.docs[querySnapshot.docs.length - 1]);
      setHasMore(newTransactions.length === ITEMS_PER_PAGE);

      setTransactions(prev => loadMore ? [...prev, ...newTransactions] : newTransactions);
    } catch (error) {
      console.error("Error loading transactions:", error);
      toast({ title: "خطأ", description: "فشل تحميل سجل العمليات", variant: "destructive" });
    }
  }, [lastTransaction, toast]);
  
  const addTransaction = async (isPositive: boolean) => {
    const name = transactionName.trim();
    let cost = parseFloat(transactionCost);
    if (!name || isNaN(cost) || cost <= 0) {
      toast({ title: "خطأ", description: "يرجى إدخال اسم العملية وتكلفة صالحة", variant: "destructive" });
      return;
    }
    
    let costUSD = convertToUSD(cost, transactionCurrency);
    if (!isPositive) costUSD = -costUSD;
    const date = new Date().toLocaleDateString("en-GB");

    try {
      await addDoc(collection(db, "transactions"), { name, cost: costUSD, date, timestamp: serverTimestamp() });
      toast({ title: "نجاح", description: `تمت إضافة العملية: ${name}` });
      setTransactionName('');
      setTransactionCost('');
      loadTransactions(); // Reload from the start
    } catch (error) {
      console.error("Error adding transaction:", error);
      toast({ title: "خطأ", description: "فشل إضافة العملية", variant: "destructive" });
    }
  };

  const deleteTransaction = async (id: string) => {
    try {
      await deleteDoc(doc(db, "transactions", id));
      toast({ title: "نجاح", description: "تم حذف العملية", variant: "destructive" });
      setTransactions(prev => prev.filter(t => t.id !== id)); // Optimistic update
    } catch (error) {
      console.error("Error deleting transaction:", error);
      toast({ title: "خطأ", description: "فشل حذف العملية", variant: "destructive" });
    }
  };

  React.useEffect(() => {
    const fetchAllAndCalcTotal = async () => {
        try {
            const querySnapshot = await getDocs(query(collection(db, "transactions")));
            const allCosts = querySnapshot.docs.map(docSnapshot => (docSnapshot.data().cost || 0) as number);
            const total = allCosts.reduce((sum, cost) => sum + cost, 0);
            setTotalIncome(total);
        } catch (error) {
            console.error("Error calculating total:", error);
        }
    }
    fetchAllAndCalcTotal();
  }, [transactions]); // Recalculate total when transactions list changes
  
  React.useEffect(() => {
    const fetchRate = async () => {
      try {
        const response = await fetch("https://api.exchangerate-api.com/v4/latest/USD");
        const data = await response.json();
        setExchangeRate(data.rates.EGP || 30.9);
      } catch (error) {
        console.error("Error fetching exchange rate:", error);
      }
    };
    fetchRate();
    loadTransactions();
  }, [loadTransactions]);

  const handleShare = async () => {
    if (!pageRef.current) return;

    try {
        const canvas = await html2canvas(pageRef.current, {
            backgroundColor: '#121212', // Match body background
            useCORS: true,
        });
        canvas.toBlob(async (blob) => {
            if (!blob) {
                toast({ title: "خطأ", description: "فشل في إنشاء الصورة للمشاركة", variant: "destructive" });
                return;
            }
            const file = new File([blob], "screenshot.png", { type: "image/png" });
            if (navigator.share) {
                await navigator.share({
                    files: [file],
                    text: "RehlatHadaf.xyz/Trans",
                });
            } else {
                toast({ title: "غير مدعوم", description: "المشاركة غير مدعومة في هذا المتصفح.", variant: "destructive" });
            }
        });
    } catch (error) {
        console.error("Error sharing:", error);
        toast({ title: "خطأ", description: "حدث خطأ أثناء محاولة المشاركة.", variant: "destructive" });
    }
  };


  return (
    <div ref={pageRef} className="min-h-screen bg-background text-foreground flex justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-4xl">
        <Card className="w-full">
            <CardHeader className="text-center relative">
                <CardTitle className="text-2xl font-bold">RHM SA CASH HUB</CardTitle>
                <Button onClick={handleShare} variant="ghost" size="icon" className="absolute left-4 top-4">
                    <Share className="h-5 w-5" />
                </Button>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="text-center">
                  <div className="text-4xl font-bold text-green-500">${totalIncome.toFixed(2)}</div>
                  <div className="text-muted-foreground mt-2">
                    <p>الرصيد بالريال: <span className="font-semibold text-foreground">{(totalIncome * 3.75).toFixed(2)} ريال</span></p>
                    <p>الرصيد بالجنيه: <span className="font-semibold text-foreground">{(totalIncome * exchangeRate).toFixed(2)} جنيه</span></p>
                  </div>
                </div>

                <div className="space-y-4 rounded-lg bg-card p-4 border">
                    <div className="flex flex-col md:flex-row justify-center items-center gap-4">
                        <Input type="text" placeholder="العملية" value={transactionName} onChange={e => setTransactionName(e.target.value)} className="max-w-xs" />
                        <Input type="number" placeholder="المبلغ" value={transactionCost} onChange={e => setTransactionCost(e.target.value)} className="max-w-xs" />
                    </div>
                    <RadioGroup value={transactionCurrency} onValueChange={setTransactionCurrency} className="flex justify-center gap-4 my-2">
                        <div className="flex items-center space-x-2 space-x-reverse"><RadioGroupItem value="SAR" id="r1" /><Label htmlFor="r1">ريال</Label></div>
                        <div className="flex items-center space-x-2 space-x-reverse"><RadioGroupItem value="USD" id="r2" /><Label htmlFor="r2">دولار</Label></div>
                        <div className="flex items-center space-x-2 space-x-reverse"><RadioGroupItem value="EGP" id="r3" /><Label htmlFor="r3">جنيه</Label></div>
                    </RadioGroup>
                    <div className="flex justify-center gap-4">
                        <Button className="bg-green-600 hover:bg-green-700" onClick={() => addTransaction(true)}>إضافة عملية موجبة</Button>
                        <Button variant="destructive" onClick={() => addTransaction(false)}>إضافة عملية سالبة</Button>
                    </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2 text-center">العمليات</h3>
                   <div className="border rounded-md max-w-xl mx-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                            <TableHead className="text-right">العملية</TableHead>
                            <TableHead className="text-right">التاريخ</TableHead>
                            <TableHead className="text-right">المبلغ</TableHead>
                            <TableHead className="text-left">حذف</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {transactions.map(t => (
                            <TableRow key={t.id} className={t.cost > 0 ? 'bg-green-500/10' : 'bg-red-500/10'}>
                                <TableCell>{t.name}</TableCell>
                                <TableCell>{t.date}</TableCell>
                                <TableCell className={`font-mono ${t.cost > 0 ? 'text-green-400' : 'text-red-400'}`}>${t.cost.toFixed(2)}</TableCell>
                                <TableCell className="text-left">
                                <Button variant="ghost" size="icon" onClick={() => deleteTransaction(t.id)}>
                                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                                </Button>
                                </TableCell>
                            </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                   </div>
                   {hasMore && <Button variant="link" className="mx-auto flex mt-4" onClick={() => loadTransactions(true)}>إظهار المزيد</Button>}
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}

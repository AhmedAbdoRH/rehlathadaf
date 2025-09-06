
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { Trash2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";


// Firebase config from your HTML
const firebaseConfig = {
  apiKey: "AIzaSyDKHlDDZ4GFGI8u6oOhfOulD_XFzL3qZBQ",
  authDomain: "hadaf-pa.firebaseapp.com",
  projectId: "hadaf-pa",
  storageBucket: "hadaf-pa.appspot.com",
  messagingSenderId: "755281209375",
  appId: "1:755281209375:web:3a9040a2f0031ea2b14d2a",
  measurementId: "G-XNBQ73GMJ2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig, "financeApp"); // Use a unique name to avoid conflicts
const db = getFirestore(app);

const ITEMS_PER_PAGE = 10;

interface Transaction {
  id: string;
  name: string;
  cost: number;
  timestamp: { seconds: number };
}

interface Sale {
  id: string;
  name: string;
  saleAmount: number;
  expenseCost: number;
  expenseDescription: string;
  netProfit: number;
  timestamp: { seconds: number };
}


export default function FinancePage() {
  const { toast } = useToast();
  const [exchangeRate, setExchangeRate] = React.useState(47.5);

  // Financial State
  const [transactions, setTransactions] = React.useState<Transaction[]>([]);
  const [lastTransaction, setLastTransaction] = React.useState<any>(null);
  const [hasMoreTransactions, setHasMoreTransactions] = React.useState(true);
  const [transactionName, setTransactionName] = React.useState('');
  const [transactionCost, setTransactionCost] = React.useState('');
  const [transactionCurrency, setTransactionCurrency] = React.useState('EGP');
  const [totalIncome, setTotalIncome] = React.useState(0);

  // Sales State
  const [sales, setSales] = React.useState<Sale[]>([]);
  const [lastSale, setLastSale] = React.useState<any>(null);
  const [hasMoreSales, setHasMoreSales] = React.useState(true);
  const [saleName, setSaleName] = React.useState('');
  const [saleAmount, setSaleAmount] = React.useState('');
  const [expenseCost, setExpenseCost] = React.useState('');
  const [expenseDescription, setExpenseDescription] = React.useState('');
  const [saleCurrency, setSaleCurrency] = React.useState('EGP');
  const [totalProfit, setTotalProfit] = React.useState(0);

  const convertToUSD = (amount: number, currency: string) => {
    if (!amount || !currency) return 0;
    switch (currency) {
      case "SAR": return amount / 3.75;
      case "EGP": return amount / exchangeRate;
      default: return amount;
    }
  };
  
  // --- Financial Functions ---
  const loadFinancialTransactions = React.useCallback(async (loadMore = false) => {
    try {
      let q;
      const transactionsRef = collection(db, "transactions");
      
      if (loadMore && lastTransaction) {
        q = query(transactionsRef, orderBy("timestamp", "desc"), startAfter(lastTransaction), limit(ITEMS_PER_PAGE));
      } else {
        q = query(transactionsRef, orderBy("timestamp", "desc"), limit(ITEMS_PER_PAGE));
      }

      const querySnapshot = await getDocs(q);
      const newTransactions = querySnapshot.docs.map(docSnapshot => ({ id: docSnapshot.id, ...docSnapshot.data() } as Transaction));
      
      setLastTransaction(querySnapshot.docs[querySnapshot.docs.length - 1]);
      setHasMoreTransactions(newTransactions.length === ITEMS_PER_PAGE);

      setTransactions(prev => loadMore ? [...prev, ...newTransactions] : newTransactions);
    } catch (error) {
      console.error("Error loading transactions:", error);
      toast({ title: "خطأ", description: "فشل تحميل سجل العمليات", variant: "destructive" });
    }
  }, [lastTransaction, toast]);
  
  const addFinancialTransaction = async (isPositive: boolean) => {
    const name = transactionName.trim();
    let cost = parseFloat(transactionCost);
    if (!name || isNaN(cost) || cost <= 0) {
      toast({ title: "خطأ", description: "يرجى إدخال اسم العملية وتكلفة صالحة", variant: "destructive" });
      return;
    }
    
    let costUSD = convertToUSD(cost, transactionCurrency);
    if (!isPositive) costUSD = -costUSD;

    try {
      await addDoc(collection(db, "transactions"), { name, cost: costUSD, timestamp: serverTimestamp() });
      toast({ title: "نجاح", description: `تمت إضافة العملية: ${name}` });
      setTransactionName('');
      setTransactionCost('');
      loadFinancialTransactions(); // Reload from the start
    } catch (error) {
      console.error("Error adding transaction:", error);
      toast({ title: "خطأ", description: "فشل إضافة العملية", variant: "destructive" });
    }
  };

  const deleteFinancialTransaction = async (id: string) => {
    try {
      await deleteDoc(doc(db, "transactions", id));
      toast({ title: "نجاح", description: "تم حذف العملية", variant: "destructive" });
      setTransactions(prev => prev.filter(t => t.id !== id)); // Optimistic update
    } catch (error) {
      console.error("Error deleting transaction:", error);
      toast({ title: "خطأ", description: "فشل حذف العملية", variant: "destructive" });
    }
  };
  
  // --- Sales Functions ---
  const loadSales = React.useCallback(async (loadMore = false) => {
    try {
      let q;
      const salesRef = collection(db, "sales");
      if (loadMore && lastSale) {
        q = query(salesRef, orderBy("timestamp", "desc"), startAfter(lastSale), limit(ITEMS_PER_PAGE));
      } else {
        q = query(salesRef, orderBy("timestamp", "desc"), limit(ITEMS_PER_PAGE));
      }
      
      const querySnapshot = await getDocs(q);
      const newSales = querySnapshot.docs.map(docSnapshot => ({ id: docSnapshot.id, ...docSnapshot.data() } as Sale));
      
      setLastSale(querySnapshot.docs[querySnapshot.docs.length - 1]);
      setHasMoreSales(newSales.length === ITEMS_PER_PAGE);

      setSales(prev => loadMore ? [...prev, ...newSales] : newSales);
    } catch (error) {
      console.error("Error loading sales:", error);
       toast({ title: "خطأ", description: "فشل تحميل سجل المبيعات", variant: "destructive" });
    }
  }, [lastSale, toast]);

  const addSale = async () => {
    const name = saleName.trim();
    const sAmount = parseFloat(saleAmount);
    const eCost = parseFloat(expenseCost) || 0;
    const eDesc = expenseDescription.trim() || 'لا يوجد وصف';

    if (!name || isNaN(sAmount) || sAmount <= 0) {
      toast({ title: "خطأ", description: "يرجى إكمال اسم العملية ومبلغ البيع.", variant: "destructive" });
      return;
    }

    const saleAmountUSD = convertToUSD(sAmount, saleCurrency);
    const expenseCostUSD = convertToUSD(eCost, saleCurrency);
    const netProfit = saleAmountUSD - expenseCostUSD;

    try {
      await addDoc(collection(db, "sales"), {
        name,
        saleAmount: saleAmountUSD,
        expenseCost: expenseCostUSD,
        expenseDescription: eDesc,
        netProfit: netProfit,
        timestamp: serverTimestamp()
      });
      toast({ title: "نجاح", description: `تمت إضافة عملية البيع: ${name}` });
      setSaleName('');
      setSaleAmount('');
      setExpenseCost('');
      setExpenseDescription('');
      loadSales(); // Reload from the start
    } catch (error) {
      console.error("Error adding sale:", error);
      toast({ title: "خطأ", description: "فشل إضافة عملية البيع", variant: "destructive" });
    }
  };

  const deleteSale = async (id: string) => {
    try {
      await deleteDoc(doc(db, "sales", id));
      toast({ title: "نجاح", description: "تم حذف عملية البيع", variant: "destructive" });
      setSales(prev => prev.filter(s => s.id !== id)); // Optimistic update
    } catch (error) {
       console.error("Error deleting sale:", error);
       toast({ title: "خطأ", description: "فشل حذف عملية البيع", variant: "destructive" });
    }
  };


  React.useEffect(() => {
    const total = transactions.reduce((sum, t) => sum + t.cost, 0);
    setTotalIncome(total);
  }, [transactions]);
  
  React.useEffect(() => {
    const total = sales.reduce((sum, s) => sum + s.netProfit, 0);
    setTotalProfit(total);
  }, [sales]);


  React.useEffect(() => {
    const fetchRate = async () => {
      try {
        const response = await fetch("https://api.exchangerate-api.com/v4/latest/USD");
        const data = await response.json();
        setExchangeRate(data.rates.EGP || 47.5);
      } catch (error) {
        console.error("Error fetching exchange rate:", error);
      }
    };
    fetchRate();
    loadFinancialTransactions();
    loadSales();
  }, [loadFinancialTransactions, loadSales]);

  return (
    <div className="min-h-screen bg-background text-foreground flex justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-4xl">
        <Tabs defaultValue="financial">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="financial">التمويل والنفقات</TabsTrigger>
            <TabsTrigger value="sales">البيع والأرباح</TabsTrigger>
          </TabsList>
          
          <TabsContent value="financial">
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl font-bold">مشروع أونلاين كاتلوج</CardTitle>
                <p className="text-muted-foreground">التمويل والنفقات</p>
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input type="text" placeholder="العملية" value={transactionName} onChange={e => setTransactionName(e.target.value)} />
                        <Input type="number" placeholder="المبلغ" value={transactionCost} onChange={e => setTransactionCost(e.target.value)} />
                    </div>
                    <RadioGroup value={transactionCurrency} onValueChange={setTransactionCurrency} className="flex justify-center gap-4">
                        <div className="flex items-center space-x-2 space-x-reverse"><RadioGroupItem value="SAR" id="r1" /><Label htmlFor="r1">ريال</Label></div>
                        <div className="flex items-center space-x-2 space-x-reverse"><RadioGroupItem value="USD" id="r2" /><Label htmlFor="r2">دولار</Label></div>
                        <div className="flex items-center space-x-2 space-x-reverse"><RadioGroupItem value="EGP" id="r3" /><Label htmlFor="r3">جنيه</Label></div>
                    </RadioGroup>
                    <div className="flex justify-center gap-4">
                        <Button className="bg-green-600 hover:bg-green-700" onClick={() => addFinancialTransaction(true)}>إضافة تمويل</Button>
                        <Button variant="destructive" onClick={() => addFinancialTransaction(false)}>إضافة نفقات</Button>
                    </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">سجل العمليات</h3>
                   <div className="border rounded-md">
                    <Table>
                        <TableHeader>
                            <TableRow>
                            <TableHead>العملية</TableHead>
                            <TableHead>التاريخ</TableHead>
                            <TableHead>المبلغ</TableHead>
                            <TableHead className="text-left">حذف</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {transactions.map(t => (
                            <TableRow key={t.id} className={t.cost > 0 ? 'bg-green-500/10' : 'bg-red-500/10'}>
                                <TableCell>{t.name}</TableCell>
                                <TableCell>{t.timestamp ? new Date(t.timestamp.seconds * 1000).toLocaleDateString("ar-EG") : '...'}</TableCell>
                                <TableCell className={`font-mono ${t.cost > 0 ? 'text-green-400' : 'text-red-400'}`}>${t.cost.toFixed(2)}</TableCell>
                                <TableCell className="text-left">
                                <Button variant="ghost" size="icon" onClick={() => deleteFinancialTransaction(t.id)}>
                                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                                </Button>
                                </TableCell>
                            </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                   </div>
                   {hasMoreTransactions && <Button variant="link" className="mx-auto flex mt-4" onClick={() => loadFinancialTransactions(true)}>إظهار المزيد</Button>}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sales">
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl font-bold">مشروع أونلاين كاتلوج</CardTitle>
                <p className="text-muted-foreground">صافي الأرباح</p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center">
                  <div className="text-4xl font-bold text-blue-500">${totalProfit.toFixed(2)}</div>
                   <div className="text-muted-foreground mt-2 text-sm">
                    <p>إجمالي الأرباح بالريال: <span className="font-semibold text-foreground">{(totalProfit * 3.75).toFixed(2)} ريال</span></p>
                    <p>إجمالي الأرباح بالجنيه: <span className="font-semibold text-foreground">{(totalProfit * exchangeRate).toFixed(2)} جنيه</span></p>
                  </div>
                </div>

                 <div className="space-y-4 rounded-lg bg-card p-4 border">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input type="text" placeholder="اسم عملية البيع" value={saleName} onChange={e => setSaleName(e.target.value)} />
                        <Input type="number" placeholder="إجمالي مبلغ البيع" value={saleAmount} onChange={e => setSaleAmount(e.target.value)} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <Input type="number" placeholder="تكلفة النفقات" value={expenseCost} onChange={e => setExpenseCost(e.target.value)} />
                       <Input type="text" placeholder="وصف النفقات" value={expenseDescription} onChange={e => setExpenseDescription(e.target.value)} />
                    </div>
                     <RadioGroup value={saleCurrency} onValueChange={setSaleCurrency} className="flex justify-center gap-4">
                        <div className="flex items-center space-x-2 space-x-reverse"><RadioGroupItem value="SAR" id="s1" /><Label htmlFor="s1">ريال</Label></div>
                        <div className="flex items-center space-x-2 space-x-reverse"><RadioGroupItem value="USD" id="s2" /><Label htmlFor="s2">دولار</Label></div>
                        <div className="flex items-center space-x-2 space-x-reverse"><RadioGroupItem value="EGP" id="s3" /><Label htmlFor="s3">جنيه</Label></div>
                    </RadioGroup>
                    <div className="flex justify-center">
                        <Button className="bg-blue-600 hover:bg-blue-700" onClick={addSale}>إضافة عملية بيع</Button>
                    </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">سجل المبيعات</h3>
                   <div className="border rounded-md">
                    <Table>
                        <TableHeader>
                            <TableRow>
                            <TableHead>العملية</TableHead>
                            <TableHead>مبلغ البيع</TableHead>
                            <TableHead>النفقات</TableHead>
                            <TableHead>صافي الربح</TableHead>
                            <TableHead>التاريخ</TableHead>
                            <TableHead className="text-left">حذف</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sales.map(s => (
                            <TableRow key={s.id} className="bg-blue-500/10">
                                <TableCell>{s.name}</TableCell>
                                <TableCell className="font-mono">${(s.saleAmount || 0).toFixed(2)}</TableCell>
                                <TableCell>
                                  <div className="font-mono">${(s.expenseCost || 0).toFixed(2)}</div>
                                  <div className="text-xs text-muted-foreground">{s.expenseDescription}</div>
                                </TableCell>
                                <TableCell className="font-mono font-bold">${(s.netProfit || 0).toFixed(2)}</TableCell>
                                <TableCell>{s.timestamp ? new Date(s.timestamp.seconds * 1000).toLocaleDateString("ar-EG") : '...'}</TableCell>
                                <TableCell className="text-left">
                                <Button variant="ghost" size="icon" onClick={() => deleteSale(s.id)}>
                                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                                </Button>
                                </TableCell>
                            </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                   </div>
                   {hasMoreSales && <Button variant="link" className="mx-auto flex mt-4" onClick={() => loadSales(true)}>إظهار المزيد</Button>}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

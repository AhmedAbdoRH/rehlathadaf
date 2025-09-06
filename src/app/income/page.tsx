
"use client";

import * as React from 'react';
import { initializeApp, getApp, getApps } from "firebase/app";
import { getDatabase, ref, push, onValue, remove } from "firebase/database";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import { useToast } from "@/hooks/use-toast";

// Firebase configuration for this specific page
const firebaseConfig = {
  apiKey: "AIzaSyB1CAxFydEJojwNj6shU48ezSC-6aZqQu8",
  authDomain: "rhm-fsystem.firebaseapp.com",
  databaseURL: "https://rhm-fsystem-default-rtdb.firebaseio.com",
  projectId: "rhm-fsystem",
  storageBucket: "rhm-fsystem.firebasestorage.app",
  messagingSenderId: "605865103602",
  appId: "1:605865103602:web:bdea570bff282adc04406b",
  measurementId: "G-QHFN5RRHDB"
};

// Initialize Firebase app for this page specifically
const appName = "incomeApp";
const app = getApps().find(app => app.name === appName) || initializeApp(firebaseConfig, appName);
const database = getDatabase(app);

interface Project {
  id: string;
  name: string;
  cost: number;
  projectType: 'egypt' | 'saudi' | 'mah';
  date: string;
}

interface Totals {
  saudi: number;
  mah: number;
  egypt: number;
  totalIncome: number;
  marketingShare: number;
  mainOfficeShare: number;
  clearanceResult: number;
}

export default function IncomePage() {
  const { toast } = useToast();
  const [projectName, setProjectName] = React.useState('');
  const [projectCost, setProjectCost] = React.useState('');
  const [projectType, setProjectType] = React.useState<'egypt' | 'saudi' | 'mah'>('egypt');
  
  const [egyptProjects, setEgyptProjects] = React.useState<Project[]>([]);
  const [saudiProjects, setSaudiProjects] = React.useState<Project[]>([]);
  const [mahProjects, setMahProjects] = React.useState<Project[]>([]);
  const [totals, setTotals] = React.useState<Totals>({
    saudi: 0, mah: 0, egypt: 0, totalIncome: 0, marketingShare: 0, mainOfficeShare: 0, clearanceResult: 0
  });

  const updateAllTotals = React.useCallback((allProjects: Project[]) => {
    const totalSaudi = allProjects.filter(p => p.projectType === 'saudi').reduce((sum, p) => sum + p.cost, 0);
    const totalMah = allProjects.filter(p => p.projectType === 'mah').reduce((sum, p) => sum + p.cost, 0);
    const totalEgypt = allProjects.filter(p => p.projectType === 'egypt').reduce((sum, p) => sum + p.cost, 0);

    const totalIncome = totalSaudi + totalMah + totalEgypt;
    const marketingShare = totalMah + (totalSaudi * (2 / 3)) + (totalEgypt * (2 / 3));
    const mainOfficeShare = (totalSaudi * (1 / 3)) + (totalEgypt * (1 / 3));
    const clearanceResult = (totalSaudi * (2 / 3)) + totalMah - (totalEgypt * (1 / 3));

    setTotals({
      saudi: totalSaudi,
      mah: totalMah,
      egypt: totalEgypt,
      totalIncome,
      marketingShare,
      mainOfficeShare,
      clearanceResult
    });
  }, []);

  React.useEffect(() => {
    const projectsRef = ref(database, 'projects');
    const unsubscribe = onValue(projectsRef, (snapshot) => {
      const projectsData = snapshot.val();
      if (projectsData) {
        const allProjects: Project[] = Object.keys(projectsData).map(key => ({
          id: key,
          ...projectsData[key]
        }));
        setEgyptProjects(allProjects.filter(p => p.projectType === 'egypt'));
        setSaudiProjects(allProjects.filter(p => p.projectType === 'saudi'));
        setMahProjects(allProjects.filter(p => p.projectType === 'mah'));
        updateAllTotals(allProjects);
      } else {
        setEgyptProjects([]);
        setSaudiProjects([]);
        setMahProjects([]);
        updateAllTotals([]);
      }
    });

    return () => unsubscribe();
  }, [updateAllTotals]);

  const handleAddProject = async () => {
    const name = projectName.trim();
    const cost = parseFloat(projectCost);

    if (!name || isNaN(cost) || cost <= 0) {
      toast({ title: "خطأ", description: "يرجى إدخال اسم المشروع وتكلفة صحيحة.", variant: "destructive" });
      return;
    }

    const date = new Date().toLocaleDateString('ar-EG', { day: '2-digit', month: '2-digit' });
    const projectData = { name, cost, projectType, date };

    try {
      await push(ref(database, 'projects'), projectData);
      toast({ title: "نجاح", description: "تمت إضافة المشروع بنجاح!" });
      setProjectName('');
      setProjectCost('');
      setProjectType('egypt');
    } catch (error) {
      console.error("Error adding project: ", error);
      toast({ title: "خطأ", description: "حدث خطأ أثناء إضافة المشروع.", variant: "destructive" });
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      await remove(ref(database, `projects/${projectId}`));
      toast({ title: "نجاح", description: "تم حذف المشروع.", variant: "destructive" });
    } catch (error) {
      console.error("Error deleting project: ", error);
      toast({ title: "خطأ", description: "حدث خطأ أثناء حذف المشروع.", variant: "destructive" });
    }
  };

  const handleClearanceAction = () => {
    window.open('https://rehlathadaf.web.app/Bank.html', '_blank');
  };

  const ProjectTable = ({ title, projects, total }: { title: string, projects: Project[], total: number }) => (
    <Card className="flex-1 min-w-[300px]">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>المشروع</TableHead>
              <TableHead>التاريخ</TableHead>
              <TableHead>التكلفة</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects.map(p => (
              <TableRow key={p.id}>
                <TableCell>{p.name}</TableCell>
                <TableCell>{p.date}</TableCell>
                <TableCell className="font-mono">${p.cost.toFixed(2)}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm" onClick={() => handleDeleteProject(p.id)}>حذف</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <p className="text-right font-bold mt-4">الإجمالي: ${total.toFixed(2)}</p>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background text-foreground p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="text-center">
          <h1 className="text-3xl font-bold">إجمالي دخل مكتب رحلة هدف لخدمات التسويق</h1>
          <p className="text-muted-foreground text-lg">لشهر 4 لعام 2025</p>
        </header>

        <section className="text-center">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="text-5xl font-bold text-primary">${totals.totalIncome.toFixed(2)}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-lg">نصيب مكتب التسويق: <span className="font-semibold">${totals.marketingShare.toFixed(2)}</span></p>
              <p className="text-lg">نصيب المكتب الرئيسي: <span className="font-semibold">${totals.mainOfficeShare.toFixed(2)}</span></p>
            </CardContent>
          </Card>
        </section>

        <section className="flex justify-center">
           <Card className="text-center bg-card-dark p-6 rounded-lg shadow-lg border border-primary/50">
              <h4 className="text-xl font-semibold mb-2">نتيجة المقاصة</h4>
              <p id="clearanceResult" className="text-3xl font-bold text-primary mb-4">${totals.clearanceResult.toFixed(2)}</p>
              <Button onClick={handleClearanceAction}>التحويل الآن</Button>
            </Card>
        </section>

        <section>
          <Card>
            <CardHeader>
              <CardTitle>إدارة المشاريع</CardTitle>
              <CardDescription>إضافة مشروع جديد وتحديد نوعه وتكلفته.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 md:space-y-0 md:flex md:items-center md:justify-center md:gap-4 bg-muted/30 p-6 rounded-lg">
                <Input type="text" placeholder="اسم المشروع" value={projectName} onChange={e => setProjectName(e.target.value)} className="max-w-xs"/>
                <Input type="number" placeholder="التكلفة" value={projectCost} onChange={e => setProjectCost(e.target.value)} className="max-w-xs"/>
                <RadioGroup value={projectType} onValueChange={(value) => setProjectType(value as any)} className="flex gap-4">
                    <div className="flex items-center space-x-2 space-x-reverse"><RadioGroupItem value="egypt" id="egypt" /><Label htmlFor="egypt">مصر</Label></div>
                    <div className="flex items-center space-x-2 space-x-reverse"><RadioGroupItem value="saudi" id="saudi" /><Label htmlFor="saudi">المملكة</Label></div>
                    <div className="flex items-center space-x-2 space-x-reverse"><RadioGroupItem value="mah" id="mah" /><Label htmlFor="mah">MAH/MOH</Label></div>
                </RadioGroup>
                <Button onClick={handleAddProject}>إضافة المشروع</Button>
            </CardContent>
          </Card>
        </section>

        <section className="flex flex-wrap justify-center gap-6">
            <ProjectTable title="مشاريع مصر" projects={egyptProjects} total={totals.egypt} />
            <ProjectTable title="مشاريع المملكة" projects={saudiProjects} total={totals.saudi} />
            <ProjectTable title="MAH/MOH" projects={mahProjects} total={totals.mah} />
        </section>

      </div>
    </div>
  );
}


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
      const allProjects: Project[] = projectsData ? Object.keys(projectsData).map(key => ({ id: key, ...projectsData[key] })) : [];
      
      setEgyptProjects(allProjects.filter(p => p.projectType === 'egypt'));
      setSaudiProjects(allProjects.filter(p => p.projectType === 'saudi'));
      setMahProjects(allProjects.filter(p => p.projectType === 'mah'));
      updateAllTotals(allProjects);
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
    <div className="flex-1 max-w-full md:max-w-[30%] bg-[#2c2c2c] p-3 rounded-lg">
      <h3 className="text-center text-lg font-bold mb-3">{title}</h3>
      <Table>
        <TableHeader>
          <TableRow className="border-b border-gray-700">
            <TableHead className="text-right text-white bg-[#444]">المشروع</TableHead>
            <TableHead className="text-right text-white bg-[#444]">التاريخ</TableHead>
            <TableHead className="text-right text-white bg-[#444]">التكلفة</TableHead>
            <TableHead className="text-right text-white bg-[#444]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.map((p, index) => (
            <TableRow key={p.id} className={index % 2 === 0 ? 'bg-[#333]' : 'bg-[#222]'}>
              <TableCell>{p.name}</TableCell>
              <TableCell className="text-gray-400">{p.date}</TableCell>
              <TableCell className="font-mono">${p.cost.toFixed(2)}</TableCell>
              <TableCell>
                <Button className="bg-[#666] hover:bg-[#555] text-white py-1 px-2 text-xs rounded" onClick={() => handleDeleteProject(p.id)}>حذف</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <p className="text-right font-bold mt-4">الإجمالي: ${total.toFixed(2)}</p>
    </div>
  );

  return (
    <div className="bg-[#1e1e1e] text-white min-h-screen flex flex-col items-center">
      <div className="container mx-auto max-w-6xl">
        <header className="text-center my-5 flex flex-col items-center">
          <h1 className="text-2xl font-bold">إجمالي دخل مكتب رحلة هدف لخدمات التسويق</h1>
          <p className="text-sm text-gray-400">لشهر 4 لعام 2025</p>
        </header>

        <section className="flex flex-col items-center mb-5">
            <div className="text-center mb-2">
                <div id="totalIncome" className="text-5xl font-bold text-green-400">${totals.totalIncome.toFixed(2)}</div>
                <div className="mt-2 text-lg">
                  <p>نصيب مكتب التسويق: <span id="marketingShare">${totals.marketingShare.toFixed(2)}</span></p>
                  <p>نصيب المكتب الرئيسي: <span id="mainOfficeShare">${totals.mainOfficeShare.toFixed(2)}</span></p>
                </div>
            </div>
            <div className="w-52 p-4 bg-[#333] rounded-md text-center shadow-lg mb-5">
                <h4 className="text-base text-gray-400 mb-1">نتيجة المقاصة</h4>
                <p id="clearanceResult" className="text-xl font-bold text-yellow-300 my-1">${totals.clearanceResult.toFixed(2)}</p>
                <Button onClick={handleClearanceAction} className="mt-2 py-3 px-5 w-full bg-[#222] text-white border border-white rounded-md text-base hover:bg-[#444]">
                  التحويل الآن
                </Button>
            </div>
        </section>

        <section className="w-full max-w-5xl mx-auto bg-[#141414] p-5 md:p-10">
            <h2 className="text-2xl font-bold text-center mb-2">إدارة المشاريع</h2>
            <div className="flex flex-col items-center gap-2 my-5 p-2">
                <div className="flex flex-col md:flex-row gap-2">
                    <Input type="text" placeholder="اسم المشروع" value={projectName} onChange={e => setProjectName(e.target.value)} className="bg-[#2c2c2c] border-[#444] text-white"/>
                    <Input type="number" placeholder="التكلفة" value={projectCost} onChange={e => setProjectCost(e.target.value)} className="bg-[#2c2c2c] border-[#444] text-white"/>
                </div>
                <RadioGroup value={projectType} onValueChange={(value) => setProjectType(value as any)} className="flex gap-4 my-2">
                    <div className="flex items-center space-x-2 space-x-reverse"><RadioGroupItem value="egypt" id="egypt" /><Label htmlFor="egypt">مصر</Label></div>
                    <div className="flex items-center space-x-2 space-x-reverse"><RadioGroupItem value="saudi" id="saudi" /><Label htmlFor="saudi">المملكة</Label></div>
                    <div className="flex items-center space-x-2 space-x-reverse"><RadioGroupItem value="mah" id="mah" /><Label htmlFor="mah">MAH/MOH</Label></div>
                </RadioGroup>
                <Button onClick={handleAddProject} className="bg-[#2c2c2c] border-[#444] text-white py-2 px-4">إضافة المشروع</Button>
            </div>

            <div className="flex flex-col md:flex-row gap-5 justify-between mt-2 p-6">
                <ProjectTable title="مشاريع مصر" projects={egyptProjects} total={totals.egypt} />
                <ProjectTable title="مشاريع المملكة" projects={saudiProjects} total={totals.saudi} />
                <ProjectTable title="MAH/MOH" projects={mahProjects} total={totals.mah} />
            </div>
        </section>
      </div>
    </div>
  );
}

    
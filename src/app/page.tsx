
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { ArrowLeft } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
      <div className="container mx-auto flex flex-col items-center justify-center text-center p-4">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary mb-6">
          <Icons.logo className="h-12 w-12 text-primary-foreground animate-spin" style={{animationDuration: '10s'}} />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-3">
          رحلة هدف - الأنظمة الداخلية
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl">
          مرحباً بك في بوابة الأنظمة الداخلية. من هنا يمكنك الوصول إلى الأدوات والتطبيقات المختلفة.
        </p>
        <Link href="/web" passHref>
          <Button size="lg" className="h-12 px-8 text-lg bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 hover:scale-105 transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/25">
            <span>الدخول إلى لوحة تحكم النطاقات</span>
            <ArrowLeft className="mr-2 h-5 w-5" />
          </Button>
        </Link>
      </div>
    </div>
  );
}


"use client";

import Link from 'next/link';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { Banknote, HandCoins, LayoutGrid } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Card, CardContent } from '@/components/ui/card';

const NavCard = ({ href, icon: Icon, title, newTab = false }: { href: string, icon: React.ElementType, title: string, newTab?: boolean }) => (
  <Link href={href} passHref legacyBehavior>
    <a target={newTab ? "_blank" : "_self"} rel={newTab ? "noopener noreferrer" : ""}>
      <Card className="bg-card hover:bg-muted/50 transition-all duration-200 ease-in-out transform hover:-translate-y-1 hover:shadow-xl w-48 h-48 flex flex-col items-center justify-center text-center cursor-pointer group">
        <CardContent className="flex flex-col items-center justify-center p-6">
          <Icon className="h-16 w-16 text-red-500/90 mb-4 transition-transform duration-300 group-hover:scale-110" />
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        </CardContent>
      </Card>
    </a>
  </Link>
);


const DropdownNavCard = ({ icon: Icon, title, items }: { icon: React.ElementType, title: string, items: {href: string, label: string}[] }) => (
    <DropdownMenu>
        <DropdownMenuTrigger asChild>
            <Card className="bg-card hover:bg-muted/50 transition-all duration-200 ease-in-out transform hover:-translate-y-1 hover:shadow-xl w-48 h-48 flex flex-col items-center justify-center text-center cursor-pointer group">
                <CardContent className="flex flex-col items-center justify-center p-6">
                    <Icon className="h-16 w-16 text-red-500/90 mb-4 transition-transform duration-300 group-hover:scale-110" />
                    <h3 className="text-lg font-semibold text-foreground">{title}</h3>
                </CardContent>
            </Card>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56 bg-card border-border">
            {items.map((item) => (
                 <Link href={item.href} passHref key={item.href}>
                    <DropdownMenuItem className="cursor-pointer focus:bg-muted/50 focus:text-foreground">
                        {item.label}
                    </DropdownMenuItem>
                </Link>
            ))}
        </DropdownMenuContent>
    </DropdownMenu>
);

export default function Home() {
  const [clickCount, setClickCount] = React.useState(0);
  const [cardsVisible, setCardsVisible] = React.useState(false);

  const handleIconClick = () => {
    const newClickCount = clickCount + 1;
    setClickCount(newClickCount);
    if (newClickCount >= 2) {
      setCardsVisible(true);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
      <div className="container mx-auto flex flex-col items-center justify-center text-center">
        
        <div 
          className="flex h-24 w-24 items-center justify-center rounded-full bg-card border border-border mb-6 shadow-lg cursor-pointer"
          onClick={handleIconClick}
        >
          <Icons.bullseye className="h-12 w-12 text-red-500/90" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-3">
          رحلة هدف - الأنظمة الداخلية
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground mb-12 max-w-2xl">
        </p>
        
        {cardsVisible && (
          <div className="flex flex-wrap justify-center gap-6">
              <NavCard href="/oc" icon={LayoutGrid} title="الإدارة المالية لأونلاين كاتلوج" />
              <NavCard href="/marketing" icon={HandCoins} title="الإدارة المالية لمكتب التسويق" />
               <DropdownNavCard 
                  icon={Banknote}
                  title="بيانات التحويل"
                  items={[
                      { href: "/transfer", label: "تحويل (مؤسسة رحلة هدف)" },
                      { href: "/transfer-mohamed", label: "تحويل (محمد رزق)" }
                  ]}
              />
          </div>
        )}
      </div>
    </div>
  );
}

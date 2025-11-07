"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Home, FileText, DollarSign, Globe } from 'lucide-react';

export function MainNavigation() {
  const [clickCount, setClickCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [showCounter, setShowCounter] = useState(false);

  // Always start with navigation hidden, even if previously shown
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('navVisible', 'false');
    }
    setIsVisible(false);
  }, []);

  // Handle click counter and visibility
  useEffect(() => {
    if (clickCount >= 3) {
      setIsVisible(true);
      if (typeof window !== 'undefined') {
        localStorage.setItem('navVisible', 'true');
      }
      // Reset click count after 5 seconds
      const timer = setTimeout(() => {
        setClickCount(0);
        setShowCounter(false);
      }, 5000);
      return () => clearTimeout(timer);
    } else if (clickCount > 0) {
      setShowCounter(true);
      const timer = setTimeout(() => {
        setClickCount(0);
        setShowCounter(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [clickCount]);

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setClickCount(prev => {
      const newCount = prev + 1;
      return newCount;
    });
  };

  if (!isVisible) {
    return (
      <nav className="bg-background border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4 rtl:space-x-reverse">
              <Link 
                href="#" 
                className="flex items-center cursor-pointer"
                onClick={handleLogoClick}
              >
                <Home className="h-5 w-5 mr-2" />
                <span className="font-medium">الرئيسية</span>
              </Link>
            </div>
            <div className="text-sm text-muted-foreground transition-opacity duration-300">
              {showCounter && `(${clickCount}/3)`}
            </div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-transparent text-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4 rtl:space-x-reverse">
            <Link 
              href="/" 
              className="flex items-center opacity-0 w-0 h-0 overflow-hidden"
              onClick={(e) => {
                e.preventDefault();
                handleLogoClick(e);
              }}
            >
              <Home className="h-5 w-5 mr-2" />
              <span className="font-medium">الرئيسية</span>
            </Link>
          </div>
          
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <Button asChild variant="ghost" className="flex items-center text-gray-800 hover:bg-white/50 hover:backdrop-blur-sm">
              <Link href="/main-office-invoices">
                <FileText className="h-4 w-4 ml-1" />
                <span>تحصيل فواتير المكتب الرئيسي</span>
              </Link>
            </Button>
            
            <Button asChild variant="ghost" className="flex items-center text-gray-800 hover:bg-white/50 hover:backdrop-blur-sm">
              <Link href="/online-finance">
                <DollarSign className="h-4 w-4 ml-1" />
                <span>ماليات الأونلاين كاتلوج</span>
              </Link>
            </Button>
            
            <Button asChild variant="ghost" className="flex items-center text-gray-800 hover:bg-white/50 hover:backdrop-blur-sm">
              <Link href="/international-transactions">
                <Globe className="h-4 w-4 ml-1" />
                <span>المعاملات الدولية</span>
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}

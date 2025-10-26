
"use client";

import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { Domain, ApiKeyStatus } from '@/lib/types';
import { differenceInDays, addDays, getMonth, getYear, subMonths } from 'date-fns';

interface StatusPanelProps {
  domains: Domain[];
  domainStatuses: Record<string, 'checking' | 'online' | 'offline'>;
  domainTodos: Record<string, boolean>;
  apiKeyStatuses: ApiKeyStatus[];
}

export function StatusPanel({ domains, domainStatuses, domainTodos, apiKeyStatuses }: StatusPanelProps) {
  const [clickedApiKey, setClickedApiKey] = React.useState<string | null>(null);
  const [showCountdownName, setShowCountdownName] = React.useState<boolean>(false);
  const [daysRemaining, setDaysRemaining] = React.useState<number>(30);
  const [countdownPercentage, setCountdownPercentage] = React.useState(100);

  // Countdown logic for Smart Team Messenger
  React.useEffect(() => {
    const calculateCountdown = () => {
      const now = new Date();
      // The countdown period is 30 days, starting from the 11th of the previous month.
      const lastMonth = subMonths(now, 1);
      const startDate = new Date(getYear(lastMonth), getMonth(lastMonth), 11);
      const endDate = addDays(startDate, 30);
      
      const remaining = differenceInDays(endDate, now);
      const validRemainingDays = Math.max(0, remaining);
      const percentage = (validRemainingDays / 30) * 100;
      
      setDaysRemaining(validRemainingDays);
      setCountdownPercentage(percentage);
    };

    calculateCountdown();
    // Update the countdown every hour to be more precise
    const intervalId = setInterval(calculateCountdown, 1000 * 60 * 60);

    return () => clearInterval(intervalId);
  }, []);

  // Close popup when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (clickedApiKey) {
        const target = event.target as Element;
        if (!target.closest('.api-key-item')) {
          setClickedApiKey(null);
        }
      }
      if (showCountdownName) {
        const target = event.target as Element;
        if (!target.closest('.countdown-bar')) {
          setShowCountdownName(false);
        }
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [clickedApiKey, showCountdownName]);
  
  const getStatusLight = (status: 'checking' | 'online' | 'offline', index: number, hasTodos?: boolean, isApiKey: boolean = false) => {
    const baseClasses = isApiKey ? "w-4 h-1.5 rounded-sm" : "w-2.5 h-2.5 rounded-full";
    
    if (isApiKey) {
      return (
          <div 
            className={cn(
              baseClasses,
              "bg-yellow-500 shadow-yellow-500/60 animate-pulse"
            )}
            style={{ 
              animationDuration: '1.5s',
              animationDelay: `${index * 100}ms`
            }}
          />
      );
    }

    if (hasTodos) {
      return (
         <div 
            className={cn(
              baseClasses,
              "bg-blue-500 shadow-[0_0_8px_2px] shadow-blue-500/60 animate-pulse"
            )}
            style={{ 
              animationDuration: '2.5s',
              animationDelay: `${index * 100}ms`
            }}
          />
      );
    }

    switch (status) {
      case 'online':
        return (
          <div 
            className={cn(
              baseClasses,
              "bg-green-500 shadow-green-500/60 animate-pulse"
            )}
            style={{ 
              animationDuration: '2s',
              animationDelay: `${index * 100}ms`
            }}
          />
        );
      case 'offline':
        return (
          <div 
            className={cn(
              baseClasses,
              "bg-red-500 shadow-red-500/60"
            )}
            style={{
              animationDelay: `${index * 100}ms`
            }}
          />
        );
      case 'checking':
        return (
          <div 
            className={cn(
              baseClasses,
              "bg-yellow-500 shadow-yellow-500/60 animate-pulse"
            )}
            style={{ 
              animationDuration: '1.5s',
              animationDelay: `${index * 100}ms`
            }}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Card className="w-full bg-card backdrop-blur-md border-border/60 shadow-lg rounded-b-none">
      <CardContent className="p-2 space-y-1.5">
        <div className="flex flex-row flex-wrap gap-1.5 justify-center">
          {domains.map((domain, index) => {
            if (!domain.id) return null;
            const status = domainStatuses[domain.id] || 'offline';
            const hasTodos = domainTodos[domain.id] || false;
            return (
              <div 
                key={domain.id} 
                className="w-4 h-4 border border-border/40 rounded-sm flex items-center justify-center bg-muted/50"
              >
                {getStatusLight(status, index, hasTodos)}
              </div>
            );
          })}
        </div>
        <div className="flex flex-row flex-wrap gap-1.5 justify-center">
            {apiKeyStatuses.map((apiKeyStatus, index) => (
              <div key={apiKeyStatus.key} className="relative api-key-item">
                <div 
                  className="w-5 h-2.5 border border-border/40 rounded-sm flex items-center justify-center bg-muted/50 cursor-pointer hover:bg-muted/80 transition-colors"
                  onClick={() => setClickedApiKey(clickedApiKey === apiKeyStatus.key ? null : apiKeyStatus.key)}
                  title={`اضغط لعرض الاسم: ${apiKeyStatus.name}`}
                >
                  {getStatusLight(apiKeyStatus.status, index, false, true)}
                </div>
                {clickedApiKey === apiKeyStatus.key && (
                  <div className="absolute top-6 left-1/2 transform -translate-x-1/2 bg-popover text-popover-foreground text-xs px-2 py-1 rounded shadow-lg border border-border/40 whitespace-nowrap z-50">
                    {apiKeyStatus.name}
                  </div>
                )}
              </div>
            ))}
        </div>
        
        {/* Countdown Progress Bar */}
        <div className="flex justify-center mt-1">
          <div className="w-24 relative countdown-bar">
            <div 
              className="h-1 bg-gray-700/50 rounded-full overflow-hidden relative cursor-pointer hover:bg-gray-600/50 transition-colors"
              onClick={() => setShowCountdownName(!showCountdownName)}
              title={`اضغط لعرض الاسم. متبقي ${daysRemaining} يوم.`}
            >
              <div 
                className="absolute top-0 right-0 h-full bg-green-500/50 transition-all duration-1000 ease-linear"
                style={{ 
                  width: `${countdownPercentage}%`,
                }}
              />
            </div>
            {showCountdownName && (
              <div className="absolute top-6 left-1/2 transform -translate-x-1/2 bg-popover text-popover-foreground text-xs px-2 py-1 rounded shadow-lg border border-border/40 whitespace-nowrap z-50">
                سمارت تيم ماسنجر
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

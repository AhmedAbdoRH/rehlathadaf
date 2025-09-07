
"use client";

import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { Domain } from '@/lib/types';

interface StatusPanelProps {
  domains: Domain[];
  domainStatuses: Record<string, 'checking' | 'online' | 'offline'>;
  domainTodos: Record<string, boolean>;
}

export function StatusPanel({ domains, domainStatuses, domainTodos }: StatusPanelProps) {
  const getStatusLight = (domain: Domain, index: number) => {
    const status = domain.id ? domainStatuses[domain.id] : 'offline';
    const hasTodos = domain.id ? domainTodos[domain.id] : false;
    const baseClasses = "w-2.5 h-2.5 rounded-full";
    
    if (hasTodos) {
      return (
         <div 
            className={cn(
              baseClasses,
              "bg-blue-500 shadow-blue-500/60"
            )}
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
    <Card className="w-full bg-card backdrop-blur-md border-border/60 shadow-lg">
      <CardContent className="p-2">
        <div className="flex flex-row flex-wrap gap-1.5 justify-center">
          {domains.map((domain, index) => {
            if (!domain.id) return null;
            return (
              <div 
                key={domain.id} 
                className="w-4 h-4 border border-border/40 rounded-sm flex items-center justify-center bg-muted/50"
                style={{
                  animationDelay: `${index * 200}ms`,
                  animation: domainStatuses[domain.id] === 'checking' ? 'pulse 2s infinite' : 'none'
                }}
              >
                {getStatusLight(domain, index)}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

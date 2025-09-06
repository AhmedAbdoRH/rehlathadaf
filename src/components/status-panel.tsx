"use client";

import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { Domain } from '@/lib/types';

interface StatusPanelProps {
  domains: Domain[];
  domainStatuses: Record<string, 'checking' | 'online' | 'offline'>;
}

export function StatusPanel({ domains, domainStatuses }: StatusPanelProps) {
  const getStatusLight = (status: 'checking' | 'online' | 'offline', index: number) => {
    const baseClasses = "w-2.5 h-2.5 rounded-full";
    
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
    <Card className="w-32 bg-muted/95 backdrop-blur-md border-border/60 shadow-2xl">
      <CardContent className="p-2">
        <div className="flex flex-wrap gap-1.5 justify-center">
          {domains.map((domain, index) => {
            if (!domain.id) return null;
            const status = domainStatuses[domain.id] || 'offline';
            return (
              <div 
                key={domain.id} 
                className="w-4 h-4 border border-border/40 rounded-sm flex items-center justify-center bg-muted/50"
                style={{
                  animationDelay: `${index * 200}ms`,
                  animation: status === 'checking' ? 'pulse 2s infinite' : 'none'
                }}
              >
                {getStatusLight(status, index)}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

"use client";

import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { Domain, ApiKeyStatus } from '@/lib/types';

interface StatusPanelProps {
  domains: Domain[];
  domainStatuses: Record<string, 'checking' | 'online' | 'offline'>;
  domainTodos: Record<string, boolean>;
  apiKeyStatuses: ApiKeyStatus[];
}

export function StatusPanel({ domains, domainStatuses, domainTodos, apiKeyStatuses }: StatusPanelProps) {
  const getStatusLight = (status: 'checking' | 'online' | 'offline', index: number, hasTodos?: boolean, isApiKey: boolean = false) => {
    const baseClasses = isApiKey ? "w-4 h-1.5 rounded-sm" : "w-2.5 h-2.5 rounded-full";
    
    if (hasTodos && !isApiKey) {
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
               <div 
                key={apiKeyStatus.key} 
                className="w-5 h-2.5 border border-border/40 rounded-sm flex items-center justify-center bg-muted/50"
              >
                {getStatusLight(apiKeyStatus.status, index, false, true)}
              </div>
            ))}
        </div>
      </CardContent>
    </Card>
  );
}

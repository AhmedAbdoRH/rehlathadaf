'use client';

import React from 'react';
import { app } from '@/firebase';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';

// This provider is simplified as we are initializing Firebase directly.
// It's kept for structural consistency and to host the Error Listener.
export function FirebaseProvider({ children }: { children: React.ReactNode }) {
  // The 'app' is already initialized in @/firebase/index.ts
  // We can pass it here if needed by context, but for now, we'll keep it simple.
  
  return (
    <>
      <FirebaseErrorListener />
      {children}
    </>
  );
}

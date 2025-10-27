'use client';

import React, { useEffect, useState } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import type { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';
import { Button } from './ui/button';

// This component is DEV-ONLY. It will not appear in production.
// It is designed to intercept Firestore permission errors and display them in the Next.js error overlay.

export function FirebaseErrorListener() {
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const [error, setError] = useState<FirestorePermissionError | null>(null);

  useEffect(() => {
    const handleError = (e: FirestorePermissionError) => {
      console.error(
        '[@firebase/permission-error] Intercepted a Firestore permission error. See the Next.js error overlay for more details.'
      );
      setError(e);
    };

    errorEmitter.on('permission-error', handleError);

    return () => {
      errorEmitter.off('permission-error', handleError);
    };
  }, []);

  if (error) {
    // This will be caught by the Next.js error overlay in development
    throw error;
  }

  return null;
}

// You can optionally create a more user-facing error component
// that uses the same emitter to display friendly messages.
export function UserFacingErrorToaster() {
  const { toast } = useToast();

  useEffect(() => {
    const handleUserFacingError = (error: {
      title: string;
      message: string;
    }) => {
      toast({
        variant: 'destructive',
        title: error.title,
        description: error.message,
      });
    };

    errorEmitter.on('user-facing-error', handleUserFacingError);

    return () => {
      errorEmitter.off('user-facing-error', handleUserFacingError);
    };
  }, [toast]);

  return null;
}

// A component to render the error in a readable format for the overlay
export function FirebaseErrorDisplay({ error, reset }: { error: FirestorePermissionError, reset: () => void }) {
  const context = error.context;
  const requestBody = JSON.stringify(context.requestResourceData, null, 2);

  return (
    <div className="p-8 bg-background text-foreground h-screen">
      <Alert variant="destructive" className="max-w-4xl mx-auto">
        <Terminal className="h-4 w-4" />
        <AlertTitle>Firestore Security Rules: Permission Denied</AlertTitle>
        <AlertDescription>
          Your request to Firestore was denied. Review the details below and your security rules.
        </AlertDescription>
        <div className="mt-4 p-4 bg-muted rounded-lg text-sm space-y-4">
          <div className="space-y-2">
            <h3 className="font-semibold">Denied Operation</h3>
            <p className="font-mono bg-background p-2 rounded">{context.operation.toUpperCase()} on path <code>{context.path}</code></p>
          </div>
          
          {context.requestResourceData && (
             <div className="space-y-2">
              <h3 className="font-semibold">Request Body (Data Sent)</h3>
              <pre className="p-2 bg-background rounded-lg font-mono text-xs max-h-60 overflow-auto"><code>{requestBody}</code></pre>
            </div>
          )}
          
          <div className="space-y-2">
            <h3 className="font-semibold">More Info</h3>
            <p>To fix this, check the Firestore Security Rules for your project. The rules for the path <code>{context.path}</code> did not allow this request to proceed.</p>
          </div>
        </div>
        <div className="mt-6 flex justify-end">
            <Button onClick={reset}>Try Again</Button>
        </div>
      </Alert>
    </div>
  );
}

'use client' // Error components must be Client Components
 
import { useEffect } from 'react'
import { FirebaseErrorDisplay } from '@/components/FirebaseErrorListener'
 
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error)
  }, [error])
 
  // Custom display for our specific Firestore permission errors
  if (error.name === 'FirestorePermissionError') {
    return <FirebaseErrorDisplay error={error as any} reset={reset} />
  }

  return (
    <div className="p-8">
      <h2>Something went wrong!</h2>
      <p>{error.message}</p>
      <button
        onClick={
          // Attempt to recover by trying to re-render the segment
          () => reset()
        }
      >
        Try again
      </button>
    </div>
  )
}

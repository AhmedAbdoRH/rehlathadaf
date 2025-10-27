'use client';
import { db } from '@/lib/firebase';
import type { Fault } from '@/lib/types';
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  orderBy,
  serverTimestamp,
  Timestamp,
  getDoc,
  query,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

const faultsCollectionRef = collection(db, 'faults');

// Helper to convert Firestore timestamp to ISO string
const faultFromDoc = (doc: any): Fault => {
  const data = doc.data();
  return {
    ...(data as Omit<Fault, 'createdAt'>),
    id: doc.id,
    createdAt:
      (data.createdAt as Timestamp)?.toDate().toISOString() ||
      new Date().toISOString(),
  };
};

export const getFaults = async (): Promise<Fault[]> => {
  const q = query(faultsCollectionRef, orderBy('createdAt', 'desc'));
  try {
    const data = await getDocs(q);
    return data.docs.map(faultFromDoc);
  } catch (serverError: any) {
     const permissionError = new FirestorePermissionError({
      path: faultsCollectionRef.path,
      operation: 'list',
    });
    errorEmitter.emit('permission-error', permissionError);
    return [];
  }
};

export const addFault = (
  fault: Omit<Fault, 'id' | 'createdAt'>
): Promise<Fault> => {
  return new Promise(async (resolve, reject) => {
    const newFaultData = {
      ...fault,
      createdAt: serverTimestamp(),
    };
    addDoc(faultsCollectionRef, newFaultData)
      .then(async (docRef) => {
        const newDoc = await getDoc(docRef);
        resolve(faultFromDoc(newDoc));
      })
      .catch((serverError) => {
        const permissionError = new FirestorePermissionError({
          path: faultsCollectionRef.path,
          operation: 'create',
          requestResourceData: newFaultData,
        });
        errorEmitter.emit('permission-error', permissionError);
        reject(permissionError);
      });
  });
};

export const deleteFault = (id: string): Promise<void> => {
    return new Promise(async (resolve, reject) => {
        const faultDoc = doc(db, 'faults', id);
        deleteDoc(faultDoc).then(() => {
            resolve();
        }).catch(serverError => {
            const permissionError = new FirestorePermissionError({
                path: faultDoc.path,
                operation: 'delete',
            });
            errorEmitter.emit('permission-error', permissionError);
            reject(permissionError);
        });
    });
};

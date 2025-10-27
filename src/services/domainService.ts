'use client';
import { db } from '@/lib/firebase';
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
} from 'firebase/firestore';
import type { Domain } from '@/lib/types';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

const domainsCollectionRef = collection(db, 'domains');

export const getDomains = async (): Promise<Domain[]> => {
  const data = await getDocs(domainsCollectionRef).catch((serverError) => {
    const permissionError = new FirestorePermissionError({
      path: domainsCollectionRef.path,
      operation: 'list',
    });
    errorEmitter.emit('permission-error', permissionError);
    // Return empty array or handle as per app's requirement on permission error
    throw permissionError;
  });
  return data.docs.map((doc) => ({ ...(doc.data() as Domain), id: doc.id }));
};

export const addDomain = (
  domain: Omit<Domain, 'id'>
): Promise<Domain> => {
  return new Promise(async (resolve, reject) => {
    addDoc(domainsCollectionRef, domain)
      .then((docRef) => {
        resolve({ ...domain, id: docRef.id });
      })
      .catch((serverError) => {
        const permissionError = new FirestorePermissionError({
          path: domainsCollectionRef.path,
          operation: 'create',
          requestResourceData: domain,
        });
        errorEmitter.emit('permission-error', permissionError);
        reject(permissionError);
      });
  });
};

export const deleteDomain = (id: string): Promise<void> => {
  return new Promise(async (resolve, reject) => {
    const domainDoc = doc(db, 'domains', id);
    deleteDoc(domainDoc)
      .then(() => {
        resolve();
      })
      .catch((serverError) => {
        const permissionError = new FirestorePermissionError({
          path: domainDoc.path,
          operation: 'delete',
        });
        errorEmitter.emit('permission-error', permissionError);
        reject(permissionError);
      });
  });
};

export const updateDomain = (
  id: string,
  updatedDomain: Partial<Omit<Domain, 'id' | 'installmentCount'>> & {
    installmentCount?: number | '';
  }
): Promise<void> => {
  return new Promise(async (resolve, reject) => {
    const domainDoc = doc(db, 'domains', id);
    updateDoc(domainDoc, updatedDomain)
      .then(() => {
        resolve();
      })
      .catch((serverError) => {
        const permissionError = new FirestorePermissionError({
          path: domainDoc.path,
          operation: 'update',
          requestResourceData: updatedDomain,
        });
        errorEmitter.emit('permission-error', permissionError);
        reject(permissionError);
      });
  });
};

"use client";
import { db } from '@/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

const paperDocRef = doc(db, 'general', 'paper');

export const getGeneralPaper = async (): Promise<string> => {
  try {
    const docSnap = await getDoc(paperDocRef);
    if (docSnap.exists()) {
      return docSnap.data().content || '';
    }
    return '';
  } catch (serverError) {
    const permissionError = new FirestorePermissionError({
      path: paperDocRef.path,
      operation: 'get',
    });
    errorEmitter.emit('permission-error', permissionError);
    throw permissionError;
  }
};

export const saveGeneralPaper = (content: string): Promise<void> => {
  return new Promise(async (resolve, reject) => {
    const data = {
      content,
      updatedAt: serverTimestamp(),
    };
    setDoc(paperDocRef, data, { merge: true })
      .then(() => {
        resolve();
      })
      .catch((serverError) => {
        const permissionError = new FirestorePermissionError({
          path: paperDocRef.path,
          operation: 'update',
          requestResourceData: data,
        });
        errorEmitter.emit('permission-error', permissionError);
        reject(permissionError);
      });
  });
};

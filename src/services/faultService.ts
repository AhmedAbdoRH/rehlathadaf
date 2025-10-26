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
  query
} from 'firebase/firestore';

const faultsCollectionRef = collection(db, 'faults');

// Helper to convert Firestore timestamp to ISO string
const faultFromDoc = (doc: any): Fault => {
  const data = doc.data();
  return {
    ...data,
    id: doc.id,
    createdAt: (data.createdAt as Timestamp)?.toDate().toISOString() || new Date().toISOString(),
  } as Fault;
};

export const getFaults = async (): Promise<Fault[]> => {
  const q = query(faultsCollectionRef, orderBy('createdAt', 'desc'));
  const data = await getDocs(q);
  return data.docs.map(faultFromDoc);
};

export const addFault = async (fault: Omit<Fault, 'id' | 'createdAt'>): Promise<Fault> => {
  const newFaultData = {
    ...fault,
    createdAt: serverTimestamp(),
  };
  const docRef = await addDoc(faultsCollectionRef, newFaultData);
  const newDoc = await getDoc(docRef);
  return faultFromDoc(newDoc);
};

export const deleteFault = async (id: string): Promise<void> => {
  const faultDoc = doc(db, 'faults', id);
  await deleteDoc(faultDoc);
};

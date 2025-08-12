import { db } from '@/lib/firebase';
import type { Domain } from '@/lib/types';
import { collection, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';

const domainsCollectionRef = collection(db, 'domains');

export const getDomains = async (): Promise<Domain[]> => {
  const data = await getDocs(domainsCollectionRef);
  return data.docs.map(doc => ({ ...doc.data(), id: doc.id })) as Domain[];
};

export const addDomain = async (domain: Omit<Domain, 'id'>): Promise<Domain> => {
  const docRef = await addDoc(domainsCollectionRef, domain);
  return { ...domain, id: docRef.id };
};

export const deleteDomain = async (id: string): Promise<void> => {
  const domainDoc = doc(db, 'domains', id);
  await deleteDoc(domainDoc);
};

import { initializeApp, getApp, getApps } from 'firebase/app';
import { getFirestore, collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import type { Domain } from '@/lib/types';

// This is the correct configuration for the domain service
const firebaseConfig = {
  "projectId": "domainview",
  "appId": "1:226934922867:web:db492564c92b9b95f79406",
  "storageBucket": "domainview.firebasestorage.app",
  "apiKey": "AIzaSyA-AuKkPZiuQdA-NIPjObheWabwnrqwG7g",
  "authDomain": "domainview.firebaseapp.com",
  "messagingSenderId": "226934922867"
};


// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

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

export const updateDomain = async (id: string, updatedDomain: Partial<Omit<Domain, 'id'>>): Promise<void> => {
  const domainDoc = doc(db, 'domains', id);
  await updateDoc(domainDoc, updatedDomain);
};

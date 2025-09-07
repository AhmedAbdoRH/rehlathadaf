
import { db } from '@/lib/firebase';
import type { Todo } from '@/lib/types';
import { 
  collection, 
  getDocs, 
  addDoc, 
  deleteDoc, 
  doc, 
  updateDoc, 
  query, 
  where,
  orderBy,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';

const todosCollectionRef = collection(db, 'todos');

// Helper to convert Firestore timestamp to ISO string
const todoFromDoc = (doc: any): Todo => {
  const data = doc.data();
  return {
    ...data,
    id: doc.id,
    createdAt: (data.createdAt as Timestamp)?.toDate().toISOString() || new Date().toISOString(),
  } as Todo;
};


export const getTodos = async (domainId: string): Promise<Todo[]> => {
  const q = query(todosCollectionRef, where('domainId', '==', domainId), orderBy('createdAt', 'desc'));
  const data = await getDocs(q);
  return data.docs.map(todoFromDoc);
};

export const addTodo = async (todo: Omit<Todo, 'id' | 'createdAt'>): Promise<Todo> => {
  const newTodoData = {
    ...todo,
    createdAt: serverTimestamp(),
  };
  const docRef = await addDoc(todosCollectionRef, newTodoData);
  
  // To return the full object, we need to make a "best guess" for the timestamp or re-fetch.
  // For simplicity, we'll return it with the client-side date.
  return { ...todo, id: docRef.id, createdAt: new Date().toISOString() };
};

export const updateTodo = async (id: string, updates: Partial<Omit<Todo, 'id'>>): Promise<void> => {
  const todoDoc = doc(db, 'todos', id);
  await updateDoc(todoDoc, updates);
};

export const deleteTodo = async (id: string): Promise<void> => {
  const todoDoc = doc(db, 'todos', id);
  await deleteDoc(todoDoc);
};

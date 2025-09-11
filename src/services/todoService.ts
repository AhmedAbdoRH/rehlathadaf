
import { db } from '@/lib/firebase';
import type { Todo, Domain } from '@/lib/types';
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
  Timestamp,
  getDoc
} from 'firebase/firestore';

const todosCollectionRef = collection(db, 'todos');
const domainsCollectionRef = collection(db, 'domains');


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

export const getTodosForDomains = async (domainIds: string[]): Promise<Record<string, Todo[]>> => {
  if (domainIds.length === 0) {
    return {};
  }
  const q = query(todosCollectionRef, where('domainId', 'in', domainIds));
  const data = await getDocs(q);
  const todos = data.docs.map(todoFromDoc);

  const todosByDomain: Record<string, Todo[]> = {};
  todos.forEach(todo => {
    if (!todosByDomain[todo.domainId]) {
      todosByDomain[todo.domainId] = [];
    }
    todosByDomain[todo.domainId].push(todo);
  });
  
  // Sort todos within each domain
  Object.keys(todosByDomain).forEach(key => {
    todosByDomain[key].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  });

  return todosByDomain;
};


export const addTodo = async (todo: Omit<Todo, 'id' | 'createdAt'>): Promise<Todo> => {
  const newTodoData = {
    ...todo,
    createdAt: serverTimestamp(),
  };
  const docRef = await addDoc(todosCollectionRef, newTodoData);
  const newDoc = await getDoc(docRef);
  return todoFromDoc(newDoc);
};

export const updateTodo = async (id: string, updates: Partial<Omit<Todo, 'id'>>): Promise<void> => {
  const todoDoc = doc(db, 'todos', id);
  await updateDoc(todoDoc, updates);
};

export const deleteTodo = async (id: string): Promise<void> => {
  const todoDoc = doc(db, 'todos', id);
  await deleteDoc(todoDoc);
};

// New function to get all todos and group them by domain name
export const getAllTodosGroupedByDomain = async (): Promise<Record<string, Todo[]>> => {
    // 1. Fetch all domains to create a map of ID -> Name
    const domainsSnapshot = await getDocs(domainsCollectionRef);
    const domainMap = new Map<string, string>();
    if (domainsSnapshot.empty) {
        return {}; // No domains, so no todos to group.
    }
    domainsSnapshot.forEach(doc => {
        const domainData = doc.data() as Domain;
        domainMap.set(doc.id, domainData.domainName);
    });

    // 2. Fetch all todos
    const todosQuery = query(todosCollectionRef, orderBy('createdAt', 'desc'));
    const todosSnapshot = await getDocs(todosQuery);
    const todos = todosSnapshot.docs.map(todoFromDoc).filter(todo => !todo.completed);


    // 3. Group todos by domain name
    const groupedTodos: Record<string, Todo[]> = {};
    todos.forEach(todo => {
        const domainName = domainMap.get(todo.domainId);
        if (domainName) {
            if (!groupedTodos[domainName]) {
                groupedTodos[domainName] = [];
            }
            groupedTodos[domainName].push(todo);
        }
    });

    return groupedTodos;
};

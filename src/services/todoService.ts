'use client';
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
  getDoc,
} from 'firebase/firestore';
import { errorEmitter } from '@/lib/error-emitter';
import { FirestorePermissionError } from '@/lib/errors';

const todosCollectionRef = collection(db, 'todos');
const domainsCollectionRef = collection(db, 'domains');

// Helper to convert Firestore timestamp to ISO string
const todoFromDoc = (doc: any): Todo => {
  const data = doc.data();
  return {
    ...(data as Omit<Todo, 'createdAt'>),
    id: doc.id,
    createdAt:
      (data.createdAt as Timestamp)?.toDate().toISOString() ||
      new Date().toISOString(),
  };
};

export const getTodos = async (domainId: string): Promise<Todo[]> => {
  const q = query(
    todosCollectionRef,
    where('domainId', '==', domainId),
    orderBy('createdAt', 'desc')
  );
  try {
    const data = await getDocs(q);
    return data.docs.map(todoFromDoc);
  } catch (serverError: any) {
    const permissionError = new FirestorePermissionError({
      path: todosCollectionRef.path,
      operation: 'list',
    });
    errorEmitter.emit('permission-error', permissionError);
    return [];
  }
};

export const getTodosForDomains = async (
  domainIds: string[]
): Promise<Record<string, Todo[]>> => {
  if (domainIds.length === 0) {
    return {};
  }
  const q = query(todosCollectionRef, where('domainId', 'in', domainIds));
  try {
    const data = await getDocs(q);
    const todos = data.docs.map(todoFromDoc);

    const todosByDomain: Record<string, Todo[]> = {};
    todos.forEach((todo) => {
      if (!todosByDomain[todo.domainId]) {
        todosByDomain[todo.domainId] = [];
      }
      todosByDomain[todo.domainId].push(todo);
    });

    // Sort todos within each domain
    Object.keys(todosByDomain).forEach((key) => {
      todosByDomain[key].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    });

    return todosByDomain;
  } catch (serverError: any) {
    const permissionError = new FirestorePermissionError({
      path: todosCollectionRef.path,
      operation: 'list',
    });
    errorEmitter.emit('permission-error', permissionError);
    return {};
  }
};

export const addTodo = (
  todo: Omit<Todo, 'id' | 'createdAt'>
): Promise<Todo> => {
  return new Promise(async (resolve, reject) => {
    const newTodoData = {
      ...todo,
      createdAt: serverTimestamp(),
    };
    addDoc(todosCollectionRef, newTodoData)
      .then(async (docRef) => {
        const newDoc = await getDoc(docRef);
        resolve(todoFromDoc(newDoc));
      })
      .catch((serverError) => {
        const permissionError = new FirestorePermissionError({
          path: todosCollectionRef.path,
          operation: 'create',
          requestResourceData: newTodoData,
        });
        errorEmitter.emit('permission-error', permissionError);
        reject(permissionError);
      });
  });
};

export const updateTodo = (
  id: string,
  updates: Partial<Omit<Todo, 'id'>>
): Promise<void> => {
  return new Promise(async (resolve, reject) => {
    const todoDoc = doc(db, 'todos', id);
    updateDoc(todoDoc, updates)
      .then(() => {
        resolve();
      })
      .catch((serverError) => {
        const permissionError = new FirestorePermissionError({
          path: todoDoc.path,
          operation: 'update',
          requestResourceData: updates,
        });
        errorEmitter.emit('permission-error', permissionError);
        reject(permissionError);
      });
  });
};

export const deleteTodo = (id: string): Promise<void> => {
    return new Promise(async (resolve, reject) => {
        const todoDoc = doc(db, 'todos', id);
        deleteDoc(todoDoc).then(() => {
            resolve();
        }).catch(serverError => {
            const permissionError = new FirestorePermissionError({
                path: todoDoc.path,
                operation: 'delete',
            });
            errorEmitter.emit('permission-error', permissionError);
            reject(permissionError);
        });
    });
};

// New function to get all todos and group them by domain name
export const getAllTodosGroupedByDomain = async (): Promise<
  Record<string, Todo[]>
> => {
  // 1. Fetch all domains to create a map of ID -> Name
  const domainsSnapshot = await getDocs(domainsCollectionRef).catch(serverError => {
     const permissionError = new FirestorePermissionError({
      path: domainsCollectionRef.path,
      operation: 'list',
    });
    errorEmitter.emit('permission-error', permissionError);
    throw permissionError;
  });
  const domainMap = new Map<string, string>();
  if (domainsSnapshot.empty) {
    return {}; // No domains, so no todos to group.
  }
  domainsSnapshot.forEach((doc) => {
    const domainData = doc.data() as Domain;
    domainMap.set(doc.id, domainData.domainName);
  });

  // 2. Fetch all todos
  const todosQuery = query(todosCollectionRef, orderBy('createdAt', 'desc'));
  const todosSnapshot = await getDocs(todosQuery).catch(serverError => {
     const permissionError = new FirestorePermissionError({
      path: todosCollectionRef.path,
      operation: 'list',
    });
    errorEmitter.emit('permission-error', permissionError);
    throw permissionError;
  });
  const todos = todosSnapshot.docs
    .map(todoFromDoc)
    .filter((todo) => !todo.completed);

  // 3. Group todos by domain name
  const groupedTodos: Record<string, Todo[]> = {};
  todos.forEach((todo) => {
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

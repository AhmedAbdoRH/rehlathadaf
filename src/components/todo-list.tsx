
"use client";

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { addTodo, updateTodo, deleteTodo } from '@/services/todoService';
import type { Todo } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

interface TodoListProps {
  domainId: string;
  initialTodos: Todo[];
  onUpdate: () => void;
}

export function TodoList({ domainId, initialTodos, onUpdate }: TodoListProps) {
  const [todos, setTodos] = React.useState<Todo[]>(initialTodos);
  const [newTodo, setNewTodo] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const { toast } = useToast();
  
  // Sync state if initialTodos prop changes
  React.useEffect(() => {
    setTodos(initialTodos);
  }, [initialTodos]);


  const handleAddTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = newTodo.trim();
    if (!text) return;

    const tempId = `temp-${Date.now()}`;
    const optimisticTodo: Todo = {
      id: tempId,
      domainId,
      text,
      completed: false,
      createdAt: new Date().toISOString(),
    };

    // Optimistic update
    setTodos(prevTodos => [optimisticTodo, ...prevTodos]);
    setNewTodo('');

    try {
      const addedTodo = await addTodo({
        domainId,
        text,
        completed: false,
      });

      // Replace temporary todo with the real one from the server
      setTodos(prevTodos => 
        prevTodos.map(t => (t.id === tempId ? addedTodo : t))
      );
      
      toast({
        title: "نجاح",
        description: "تمت إضافة المهمة.",
      });

      onUpdate(); // Notify parent to update global state (e.g., status panel)
    } catch (error) {
       // Revert optimistic update on error
      setTodos(prevTodos => prevTodos.filter(t => t.id !== tempId));
      console.error("Error adding todo:", error);
      toast({
        title: "خطأ",
        description: "فشل في إضافة المهمة.",
        variant: "destructive",
      });
    }
  };

  const handleToggleTodo = async (todo: Todo) => {
    if (!todo.id) return;
    try {
      const updates = { completed: !todo.completed };
      await updateTodo(todo.id, updates);
      onUpdate(); // Notify parent component to re-fetch data
    } catch (error) {
       console.error("Error updating todo:", error);
      toast({
        title: "خطأ",
        description: "فشل في تحديث المهمة.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTodo = async (todoId: string) => {
    try {
      await deleteTodo(todoId);
      toast({
        title: "نجاح",
        description: "تم حذف المهمة.",
        variant: "destructive"
      });
      onUpdate(); // Notify parent component to re-fetch data
    } catch (error) {
      console.error("Error deleting todo:", error);
       toast({
        title: "خطأ",
        description: "فشل في حذف المهمة.",
        variant: "destructive",
      });
    }
  };

  const uncompletedTodos = todos.filter(todo => !todo.completed);

  return (
    <div className="space-y-4">
      <form onSubmit={handleAddTodo} className="flex gap-2">
        <Input
          type="text"
          placeholder="مهمة جديدة..."
          value={newTodo}
          onChange={e => setNewTodo(e.target.value)}
          className="bg-background"
        />
        <Button type="submit" size="icon">
          <Plus className="h-4 w-4" />
        </Button>
      </form>

      {loading ? (
        <div className="flex justify-center items-center h-24">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : (
        <div className="space-y-2">
          {uncompletedTodos.map(todo => (
            <div key={todo.id} className="flex items-center gap-3 p-2 rounded-md bg-background/50 hover:bg-background transition-colors">
              <Checkbox
                id={`todo-${todo.id}`}
                checked={todo.completed}
                onCheckedChange={() => handleToggleTodo(todo)}
                aria-label={todo.text}
              />
              <label 
                htmlFor={`todo-${todo.id}`}
                className={`flex-1 text-sm cursor-pointer ${todo.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}
              >
                {todo.text}
              </label>
              <span className="text-xs text-muted-foreground">
                {todo.createdAt ? formatDistanceToNow(new Date(todo.createdAt), { addSuffix: true, locale: ar }) : ''}
              </span>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => todo.id && handleDeleteTodo(todo.id)}>
                <Trash2 className="h-4 w-4 text-destructive/80" />
              </Button>
            </div>
          ))}
           {uncompletedTodos.length === 0 && (
             <p className="text-center text-muted-foreground py-4">لا توجد مهام حتى الآن.</p>
           )}
        </div>
      )}
    </div>
  );
}

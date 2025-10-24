
"use client";

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2, ListPlus } from 'lucide-react';
import { addTodo, updateTodo, deleteTodo } from '@/services/todoService';
import type { Todo } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

interface TodoListProps {
  domainId: string;
  initialTodos: Todo[];
  onUpdate: () => void;
}

const defaultTodos = [
    "شراء الدومين والميل",
    "تسجيل سوبابيز وانشاء مشروع",
    "نسخ بيانات المشروع",
    " احذف بيانات سوبابيز المشروع الحالي واربط المشروع بقاعدة البيانات هذه : ",
    "عمل حسابين للوحة التحكم",
    "اضف الجداول والمتطلبات و  Storage Buckets.. الخاصة بلوحة التحكم والموقع عموما الى قاعدة البيانات الجيدية .. اعطني كل أوامر Sql editor المطلوبة لذلك\nاعطيها لي لأدخلها انا وايضا اوامر اضافة ال Storage Buckets",
    "الشغل على تصميم الهوية والبانرات",
    "حول المعلومات الموجودة في ملفات الاكواد الخاصة بمجال المتجر لتناسب نشاط : \nوليس النشاط الحالي",
    "اختبار المستخدم",
].reverse();


export function TodoList({ domainId, initialTodos, onUpdate }: TodoListProps) {
  const [todos, setTodos] = React.useState<Todo[]>(initialTodos);
  const [newTodo, setNewTodo] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [bulkLoading, setBulkLoading] = React.useState(false);
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
    setTodos(prevTodos => [optimisticTodo, ...prevTodos].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
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
      onUpdate();
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

  const handleAddDefaultTodos = async () => {
    setBulkLoading(true);
    try {
      for (const todoText of defaultTodos) {
        await addTodo({
          domainId,
          text: todoText,
          completed: false,
        });
      }
      onUpdate();
      toast({
        title: "نجاح",
        description: "تمت إضافة المهام الافتراضية بنجاح.",
      });
    } catch (error) {
      console.error("Error adding default todos:", error);
      toast({
        title: "خطأ",
        description: "فشل في إضافة المهام الافتراضية.",
        variant: "destructive",
      });
    } finally {
      setBulkLoading(false);
    }
  };

  const handleToggleTodo = async (todoToToggle: Todo) => {
    if (!todoToToggle.id || todoToToggle.id.startsWith('temp-')) return;
  
    // Optimistic update
    const originalTodos = todos;
    setTodos(prev => 
      prev.filter(t => t.id !== todoToToggle.id)
    );
    onUpdate();
  
    try {
      await updateTodo(todoToToggle.id, { completed: !todoToToggle.completed });
      // No need to call onUpdate() again unless there is a success state to show
    } catch (error) {
      // Revert on error
      setTodos(originalTodos);
      onUpdate();
      console.error("Error updating todo:", error);
      toast({
        title: "خطأ",
        description: "فشل في تحديث المهمة.",
        variant: "destructive",
      });
    }
  };
  
  const handleDeleteTodo = async (todoId: string) => {
    if (!todoId || todoId.startsWith('temp-')) return;
  
    // Optimistic update
    const originalTodos = todos;
    setTodos(prev => prev.filter(t => t.id !== todoId));
    onUpdate();
  
    try {
      await deleteTodo(todoId);
      toast({
        title: "نجاح",
        description: "تم حذف المهمة.",
        variant: "destructive"
      });
      // No need to call onUpdate() again on success, it's already updated
    } catch (error) {
      // Revert on error
      setTodos(originalTodos);
      onUpdate();
      console.error("Error deleting todo:", error);
      toast({
        title: "خطأ",
        description: "فشل في حذف المهمة.",
        variant: "destructive",
      });
    }
  };

  const handleLabelClick = (e: React.MouseEvent<HTMLLabelElement>) => {
    const range = document.createRange();
    range.selectNodeContents(e.currentTarget);
    const selection = window.getSelection();
    if (selection) {
      selection.removeAllRanges();
      selection.addRange(range);
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
        <Button type="button" size="icon" variant="outline" onClick={handleAddDefaultTodos} disabled={bulkLoading}>
          {bulkLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ListPlus className="h-4 w-4" />}
        </Button>
      </form>

      {loading ? (
        <div className="flex justify-center items-center h-24">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : (
        <div className="space-y-2">
          {uncompletedTodos.map(todo => (
            <div key={todo.id} className="flex items-start gap-3 p-2 rounded-md bg-background/50 hover:bg-background transition-colors group">
              <Checkbox
                id={`todo-${todo.id}`}
                checked={todo.completed}
                onCheckedChange={() => handleToggleTodo(todo)}
                aria-label={todo.text}
                className="mt-1"
              />
              <label 
                htmlFor={`todo-${todo.id}`}
                onClick={handleLabelClick}
                className={`flex-1 text-sm select-all whitespace-pre-wrap ${todo.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}
              >
                {todo.text}
              </label>
              <span className="text-xs text-muted-foreground mt-1">
                {todo.createdAt ? formatDistanceToNow(new Date(todo.createdAt), { addSuffix: true, locale: ar }) : ''}
              </span>
              <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => todo.id && handleDeleteTodo(todo.id)}>
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

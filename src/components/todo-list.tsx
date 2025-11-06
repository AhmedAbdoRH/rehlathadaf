
"use client";

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2, ListPlus, Copy } from 'lucide-react';
import { addTodo, updateTodo, deleteTodo } from '@/services/todoService';
import type { Todo } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';

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
    "رفع جيت هب وربط نيتلفاي",
    "الشغل على تصميم الهوية والبانرات",
    "عدل المعلومات الموجودة في ملفات الاكواد الخاصة بمجال المتجر لتناسب نشاط : \nوليس النشاط الحالي",
    "اختبار المستخدم",
].reverse();


export function TodoList({ domainId, initialTodos, onUpdate }: TodoListProps) {
  const [todos, setTodos] = React.useState<Todo[]>([]);
  const [newTodo, setNewTodo] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [bulkLoading, setBulkLoading] = React.useState(false);
  const [toggledTodos, setToggledTodos] = React.useState<string[]>([]);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();
  
  React.useEffect(() => {
    // Pre-load the audio
    if (typeof window !== 'undefined') {
        audioRef.current = new Audio("data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4LjQ1LjEwMAAAAAAAAAAAAAAA//tAnRABiFADgAANqiv//zFAREFVAAAAgAAA+jTEFImAAK4AABNEMkCSJ1YgJgAABRgAAAAnY1NTAVEAAAABAAAADkxBVkMAAAA5OC4xMDguMTAwAAAA//sQjxADeALgAABpAiv//wAAN9gAADCem8pXlRzYQCAAAAAAAAAAAAAFlVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVoA=");
        audioRef.current.volume = 0.5;
    }
    const uncompleted = initialTodos.filter(t => !t.completed);
    setTodos(uncompleted);
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

    setTodos(prevTodos => [optimisticTodo, ...prevTodos]);
    setNewTodo('');

    try {
      const addedTodo = await addTodo({
        domainId,
        text,
        completed: false,
      });
      setTodos(prevTodos => 
        prevTodos.map(t => (t.id === tempId ? addedTodo : t))
      );
      onUpdate();
    } catch (error) {
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

  const handleToggleTodo = async (todoId: string) => {
    if (!todoId || todoId.startsWith('temp-') || toggledTodos.includes(todoId)) return;
  
    // --- Immediate Visual Update ---
    setToggledTodos(prev => [...prev, todoId]);
    audioRef.current?.play().catch(e => console.log("Audio play failed", e));
    setTodos(prev => prev.map(t => t.id === todoId ? { ...t, completed: true } : t));
    // --- End Immediate Visual Update ---
    
    // Wait for animations to finish before removing the item from the list
    setTimeout(async () => {
        const originalTodos = todos;
        setTodos(prev => prev.filter(t => t.id !== todoId));
        setToggledTodos(prev => prev.filter(id => id !== todoId));
        onUpdate();
    
        try {
            await updateTodo(todoId, { completed: true });
        } catch (error) {
            setTodos(originalTodos); 
            onUpdate();
            console.error("Error updating todo:", error);
            toast({
                title: "خطأ",
                description: "فشل في تحديث المهمة.",
                variant: "destructive",
            });
        }
    }, 500); // Duration should match your CSS animations
  };
  
  const handleDeleteTodo = async (todoId: string) => {
    if (!todoId || todoId.startsWith('temp-')) return;
  
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
    } catch (error) {
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
          {todos.map(todo => {
            if (!todo.id) return null;
            const isCompleting = toggledTodos.includes(todo.id);
            return (
              <div key={todo.id} className={cn("flex items-start gap-3 p-2 rounded-md bg-background/50 hover:bg-background transition-colors group", isCompleting && "slide-out-and-fade")}>
                <Checkbox
                  id={`todo-${todo.id}`}
                  checked={todo.completed}
                  onCheckedChange={() => handleToggleTodo(todo.id!)}
                  aria-label={todo.text}
                  className={cn("mt-1", isCompleting && "completed-animation-checkbox")}
                />
                <label 
                  htmlFor={`todo-${todo.id}`}
                  onClick={handleLabelClick}
                  className={cn("flex-1 text-sm select-all whitespace-pre-wrap relative", isCompleting && "strikethrough-label", todo.completed ? 'text-muted-foreground' : 'text-foreground' )}
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
            )
          })}
           {todos.length === 0 && (
             <p className="text-center text-muted-foreground py-4">لا توجد مهام حتى الآن.</p>
           )}
        </div>
      )}
    </div>
  );
}

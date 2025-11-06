
"use client";

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Trash2, Plus } from 'lucide-react';
import { getAllTodosGroupedByDomain, deleteTodo, GENERAL_TASKS_KEY, addTodo } from '@/services/todoService';
import type { Todo } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";
import { Badge } from './ui/badge';
import { Checkbox } from './ui/checkbox';
import { updateTodo } from '@/services/todoService';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { cn } from '@/lib/utils';


interface GroupedTodos {
    [domainName: string]: Todo[];
}

interface AllTodosPanelProps {
    onUpdate: () => void;
}

export function AllTodosPanel({ onUpdate }: AllTodosPanelProps) {
    const [groupedTodos, setGroupedTodos] = React.useState<GroupedTodos>({});
    const [loading, setLoading] = React.useState(true);
    const [newGeneralTodo, setNewGeneralTodo] = React.useState('');
    const [addingTodo, setAddingTodo] = React.useState(false);
    const [toggledTodos, setToggledTodos] = React.useState<string[]>([]);
    const audioRef = React.useRef<HTMLAudioElement | null>(null);
    const { toast } = useToast();

    const fetchTodos = React.useCallback(async () => {
        try {
            setLoading(true);
            const todos = await getAllTodosGroupedByDomain();
            setGroupedTodos(todos);
        } catch (error) {
            console.error("Error fetching all todos:", error);
            toast({
                title: "خطأ",
                description: "فشل في تحميل قائمة المهام المجمعة.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    }, [toast]);
    
    React.useEffect(() => {
        // Pre-load the audio
        if (typeof window !== 'undefined') {
            audioRef.current = new Audio("data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4LjQ1LjEwMAAAAAAAAAAAAAAA//tAnRABiFADgAANqiv//zFAREFVAAAAgAAA+jTEFImAAK4AABNEMkCSJ1YgJgAABRgAAAAnY1NTAVEAAAABAAAADkxBVkMAAAA5OC4xMDguMTAwAAAA//sQjxADeALgAABpAiv//wAAN9gAADCem8pXlRzYQCAAAAAAAAAAAAAFlVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVpVoA=");
            audioRef.current.volume = 0.5;
        }
        fetchTodos();
    }, [fetchTodos]);


    const handleToggleTodo = async (todoId: string) => {
        if (!todoId || toggledTodos.includes(todoId)) return;

        // --- Immediate Visual Update ---
        setToggledTodos(prev => [...prev, todoId]);
        audioRef.current?.play().catch(e => console.log("Audio play failed", e));
        
        // Find which group the todo is in and update its 'completed' state for immediate UI feedback
        const newGroupedTodos = { ...groupedTodos };
        let originalTodo: Todo | null = null;
        let groupKey: string | null = null;

        for (const key in newGroupedTodos) {
            const todoIndex = newGroupedTodos[key].findIndex(t => t.id === todoId);
            if (todoIndex !== -1) {
                groupKey = key;
                originalTodo = { ...newGroupedTodos[key][todoIndex] };
                newGroupedTodos[key][todoIndex] = { ...newGroupedTodos[key][todoIndex], completed: true };
                break;
            }
        }
        setGroupedTodos(newGroupedTodos);
        // --- End Immediate Visual Update ---

        // Wait for animations to finish before removing the item
        setTimeout(async () => {
            const finalGroupedTodos = { ...groupedTodos };
            if (groupKey && finalGroupedTodos[groupKey]) {
                finalGroupedTodos[groupKey] = finalGroupedTodos[groupKey].filter(t => t.id !== todoId);
                 if (finalGroupedTodos[groupKey].length === 0) {
                    delete finalGroupedTodos[groupKey];
                }
            }
            
            setGroupedTodos(finalGroupedTodos);
            setToggledTodos(prev => prev.filter(id => id !== todoId));
            onUpdate(); // Notify parent of the change

            // Now, update the database
            try {
                await updateTodo(todoId, { completed: true });
            } catch (error) {
                // Revert on failure
                toast({
                    title: "خطأ",
                    description: "فشل في تحديث المهمة.",
                    variant: "destructive",
                });
                fetchTodos(); // Refetch to get the correct state
            }
        }, 500); // Duration should match your CSS animations
    };

    const handleDeleteTodo = async (todo: Todo) => {
        if (!todo.id) return;

        const originalGroupedTodos = {...groupedTodos};
        const newGroups = {...originalGroupedTodos};
        let groupKey: string | null = null;
        
        if (todo.domainId) {
            for (const domainName in newGroups) {
                const todoIndex = newGroups[domainName].findIndex(t => t.id === todo.id);
                if (todoIndex > -1) {
                    groupKey = domainName;
                    break;
                }
            }
        } else {
            groupKey = GENERAL_TASKS_KEY;
        }

        if (groupKey && newGroups[groupKey]) {
            const initialLength = newGroups[groupKey].length;
            newGroups[groupKey] = newGroups[groupKey].filter(t => t.id !== todo.id);
             if (newGroups[groupKey].length !== initialLength) {
                if (newGroups[groupKey].length === 0) {
                    delete newGroups[groupKey];
                }
            }
        }

        setGroupedTodos(newGroups);
        onUpdate();
        
        try {
            await deleteTodo(todo.id);
            toast({
                title: "نجاح",
                description: "تم حذف المهمة.",
                variant: "destructive"
            });
        } catch (error) {
            setGroupedTodos(originalGroupedTodos);
            onUpdate();
            toast({
                title: "خطأ",
                description: "فشل في حذف المهمة.",
                variant: "destructive",
            });
        }
    };

    const handleAddGeneralTodo = async (e: React.FormEvent) => {
        e.preventDefault();
        const text = newGeneralTodo.trim();
        if (!text) return;
        
        setAddingTodo(true);
        try {
            await addTodo({ text, completed: false });
            setNewGeneralTodo('');
            fetchTodos(); // Re-fetch to get the new list with the general todo
            onUpdate();
        } catch (error) {
             toast({
                title: "خطأ",
                description: "فشل في إضافة المهمة العامة.",
                variant: "destructive",
            });
        } finally {
            setAddingTodo(false);
        }
    };

    if (loading) {
        return (
            <Card>
                <CardContent className="pt-6 flex justify-center items-center h-48">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </CardContent>
            </Card>
        );
    }
    
    const generalTodos = groupedTodos[GENERAL_TASKS_KEY] || [];
    const domainTodoGroups = Object.keys(groupedTodos).filter(
        key => key !== GENERAL_TASKS_KEY && groupedTodos[key].length > 0
    );

    const renderTodoItem = (todo: Todo) => {
      if (!todo.id) return null;
      const isCompleting = toggledTodos.includes(todo.id);
      return (
        <li key={todo.id} className={cn("flex items-center gap-3 p-2 rounded-md bg-background/50 hover:bg-background transition-colors", isCompleting && "slide-out-and-fade")}>
            <Checkbox
                id={`all-todo-${todo.id}`}
                checked={todo.completed}
                onCheckedChange={() => handleToggleTodo(todo.id!)}
                className={cn(isCompleting && "completed-animation-checkbox")}
            />
            <label htmlFor={`all-todo-${todo.id}`} className={cn("flex-1 text-sm relative", isCompleting && "strikethrough-label")}>
                {todo.text}
            </label>
            <button onClick={() => handleDeleteTodo(todo)}>
                <Trash2 className="h-4 w-4 text-destructive/80" />
            </button>
        </li>
      );
    }

    return (
        <Card className="bg-card/80 backdrop-blur-sm">
            <CardContent className="pt-6">
                
                <form onSubmit={handleAddGeneralTodo} className="flex gap-2 mb-6">
                  <Input
                    type="text"
                    placeholder="مهمة عامة جديدة..."
                    value={newGeneralTodo}
                    onChange={e => setNewGeneralTodo(e.target.value)}
                    className="bg-background"
                  />
                  <Button type="submit" size="icon" disabled={addingTodo}>
                    {addingTodo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  </Button>
                </form>

                {generalTodos.length === 0 && domainTodoGroups.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">لا توجد أي مهام في جميع المشاريع.</p>
                ) : (
                    <div className="space-y-4">
                        {generalTodos.length > 0 && (
                            <div>
                                <h3 className="font-semibold mb-2 flex items-center gap-2">
                                    {GENERAL_TASKS_KEY}
                                </h3>
                                <ul className="space-y-2">
                                    {generalTodos.map(renderTodoItem)}
                                </ul>
                            </div>
                        )}
                        
                        {generalTodos.length > 0 && domainTodoGroups.length > 0 && <div className="border-b border-border/50 my-4"></div>}

                        {domainTodoGroups.map(domainName => (
                            <div key={domainName}>
                                <h3 className="font-semibold mb-2 flex items-center gap-2">
                                    {domainName}
                                </h3>
                                <ul className="space-y-2">
                                    {groupedTodos[domainName].map(renderTodoItem)}
                                </ul>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

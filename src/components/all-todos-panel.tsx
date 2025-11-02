
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
        fetchTodos();
    }, [fetchTodos, onUpdate]);


    const handleToggleTodo = async (todo: Todo) => {
        if (!todo.id) return;
        
        const originalGroupedTodos = { ...groupedTodos };
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
            newGroups[groupKey] = newGroups[groupKey].filter(t => t.id !== todo.id);
            if (newGroups[groupKey].length === 0) {
                delete newGroups[groupKey];
            }
        }
        
        setGroupedTodos(newGroups);
        onUpdate();

        try {
            await updateTodo(todo.id, { completed: !todo.completed });
        } catch (error) {
            setGroupedTodos(originalGroupedTodos);
            onUpdate();
            toast({
                title: "خطأ",
                description: "فشل في تحديث المهمة.",
                variant: "destructive",
            });
        }
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
                                    <Badge variant="secondary">
                                        {generalTodos.length}
                                    </Badge>
                                </h3>
                                <ul className="space-y-2">
                                    {generalTodos.map(todo => (
                                        <li key={todo.id} className="flex items-center gap-3 p-2 rounded-md bg-background/50 hover:bg-background transition-colors">
                                            <Checkbox
                                                id={`all-todo-${todo.id}`}
                                                checked={todo.completed}
                                                onCheckedChange={() => handleToggleTodo(todo)}
                                            />
                                            <label htmlFor={`all-todo-${todo.id}`} className="flex-1 text-sm">{todo.text}</label>
                                            <button onClick={() => handleDeleteTodo(todo)}>
                                                <Trash2 className="h-4 w-4 text-destructive/80" />
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        
                        {generalTodos.length > 0 && domainTodoGroups.length > 0 && <div className="border-b border-border/50 my-4"></div>}

                        {domainTodoGroups.map(domainName => (
                            <div key={domainName}>
                                <h3 className="font-semibold mb-2 flex items-center gap-2">
                                    {domainName}
                                    <Badge variant="destructive">
                                        {groupedTodos[domainName].filter(t => !t.completed).length}
                                    </Badge>
                                </h3>
                                <ul className="space-y-2">
                                    {groupedTodos[domainName].filter(t => !t.completed).map(todo => (
                                        <li key={todo.id} className="flex items-center gap-3 p-2 rounded-md bg-background/50 hover:bg-background transition-colors">
                                            <Checkbox
                                                id={`all-todo-${todo.id}`}
                                                checked={todo.completed}
                                                onCheckedChange={() => handleToggleTodo(todo)}
                                            />
                                            <label htmlFor={`all-todo-${todo.id}`} className="flex-1 text-sm">{todo.text}</label>
                                            <button onClick={() => handleDeleteTodo(todo)}>
                                                <Trash2 className="h-4 w-4 text-destructive/80" />
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

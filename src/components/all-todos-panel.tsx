
"use client";

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Trash2 } from 'lucide-react';
import { getAllTodosGroupedByDomain, deleteTodo } from '@/services/todoService';
import type { Todo } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";
import { Badge } from './ui/badge';
import { Checkbox } from './ui/checkbox';
import { updateTodo } from '@/services/todoService';

interface GroupedTodos {
    [domainName: string]: Todo[];
}

interface AllTodosPanelProps {
    onUpdate: () => void;
}

export function AllTodosPanel({ onUpdate }: AllTodosPanelProps) {
    const [groupedTodos, setGroupedTodos] = React.useState<GroupedTodos>({});
    const [loading, setLoading] = React.useState(true);
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
    }, [fetchTodos]);

    const handleToggleTodo = async (todo: Todo) => {
        if (!todo.id) return;
        try {
            const updates = { completed: !todo.completed };
            await updateTodo(todo.id, updates);
            // Optimistic update
            setGroupedTodos(prev => {
                const newGroups = {...prev};
                for (const domainName in newGroups) {
                    newGroups[domainName] = newGroups[domainName].map(t => 
                        t.id === todo.id ? {...t, ...updates} : t
                    );
                }
                return newGroups;
            });
            onUpdate(); 
        } catch (error) {
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
             // Optimistic update
            setGroupedTodos(prev => {
                const newGroups = {...prev};
                for (const domainName in newGroups) {
                    newGroups[domainName] = newGroups[domainName].filter(t => t.id !== todoId);
                    if (newGroups[domainName].length === 0) {
                        delete newGroups[domainName];
                    }
                }
                return newGroups;
            });
            onUpdate();
        } catch (error) {
            toast({
                title: "خطأ",
                description: "فشل في حذف المهمة.",
                variant: "destructive",
            });
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

    const uncompletedDomains = Object.keys(groupedTodos).filter(domainName => 
        groupedTodos[domainName].some(todo => !todo.completed)
    );

    const completedDomains = Object.keys(groupedTodos).filter(domainName => 
        !uncompletedDomains.includes(domainName)
    );


    return (
        <Card className="bg-card/80 backdrop-blur-sm">
            <CardContent className="pt-6">
                {Object.keys(groupedTodos).length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">لا توجد أي مهام في جميع المشاريع.</p>
                ) : (
                    <div className="space-y-4">
                        {uncompletedDomains.map(domainName => (
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
                                            <button onClick={() => todo.id && handleDeleteTodo(todo.id)}>
                                                <Trash2 className="h-4 w-4 text-destructive/80" />
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                         {uncompletedDomains.length > 0 && completedDomains.length > 0 && <hr className="my-6 border-border/50"/>}
                         {completedDomains.map(domainName => (
                            <div key={domainName}>
                                <h3 className="font-semibold mb-2 flex items-center gap-2 text-muted-foreground/80">
                                    {domainName}
                                    <Badge variant="secondary">
                                        مكتمل
                                    </Badge>
                                </h3>
                                <ul className="space-y-2">
                                    {groupedTodos[domainName].map(todo => (
                                        <li key={todo.id} className="flex items-center gap-3 p-2 rounded-md bg-background/30 hover:bg-background/50 transition-colors">
                                            <Checkbox
                                                id={`all-todo-${todo.id}`}
                                                checked={todo.completed}
                                                onCheckedChange={() => handleToggleTodo(todo)}
                                            />
                                            <label htmlFor={`all-todo-${todo.id}`} className="flex-1 text-sm line-through text-muted-foreground">{todo.text}</label>
                                            <button onClick={() => todo.id && handleDeleteTodo(todo.id)}>
                                                <Trash2 className="h-4 w-4 text-destructive/50" />
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

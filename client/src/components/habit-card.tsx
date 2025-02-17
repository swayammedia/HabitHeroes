import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import type { Habit, HabitCompletion } from "@shared/schema";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Trash2 } from "lucide-react";
import CalendarGrid from "./calendar-grid";
import { useToast } from "@/hooks/use-toast";

export default function HabitCard({ habit }: { habit: Habit }) {
  const { toast } = useToast();

  const { data: completions = [] } = useQuery<HabitCompletion[]>({
    queryKey: [`/api/habits/${habit.id}/completions`],
  });

  const completeMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/habits/${habit.id}/complete`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/habits/${habit.id}/completions`] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/habits/${habit.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/habits"] });
      toast({
        title: "Habit deleted",
        description: "Your habit has been successfully deleted.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete habit",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <Card className="bg-background border shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">{habit.title}</CardTitle>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete the habit "{habit.title}" and all its completion history.
                  This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => deleteMutation.mutate()}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
        <CalendarGrid
          completions={completions.map(c => new Date(c.completedAt!))}
          onComplete={() => completeMutation.mutate()}
        />
      </CardHeader>
    </Card>
  );
}
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertHabitSchema } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function HabitForm({ onSuccess }: { onSuccess: () => void }) {
  const form = useForm({
    resolver: zodResolver(insertHabitSchema),
  });

  const createHabitMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest("POST", "/api/habits", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/habits"] });
      onSuccess();
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((data) => createHabitMutation.mutate({ ...data, description: "" }))} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Habit Title</FormLabel>
              <FormControl>
                <Input {...field} placeholder="e.g., Exercise, Read, Meditate" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={createHabitMutation.isPending}>
          Create Habit
        </Button>
      </form>
    </Form>
  );
}
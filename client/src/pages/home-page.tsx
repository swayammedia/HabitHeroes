import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import HabitCard from "@/components/habit-card";
import FriendList from "@/components/friend-list";
import HabitForm from "@/components/habit-form";
import Leaderboard from "@/components/leaderboard";
import { useState } from "react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import type { Habit } from "@shared/schema";

export default function HomePage() {
  const { user, logoutMutation } = useAuth();
  const [isHabitFormOpen, setIsHabitFormOpen] = useState(false);

  const { data: habits = [] } = useQuery<Habit[]>({
    queryKey: ["/api/habits"],
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">HabitPal</h1>
          <div className="flex items-center gap-4">
            <span>Welcome, {user?.username}!</span>
            <Button variant="outline" onClick={() => logoutMutation.mutate()}>
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Your Habits</h2>
              <Dialog open={isHabitFormOpen} onOpenChange={setIsHabitFormOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Habit
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <HabitForm onSuccess={() => setIsHabitFormOpen(false)} />
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {habits.map((habit) => (
                <HabitCard key={habit.id} habit={habit} />
              ))}
            </div>
          </div>

          <div className="space-y-8">
            <FriendList />
            <Leaderboard />
          </div>
        </div>
      </main>
    </div>
  );
}
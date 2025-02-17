import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import type { Habit, User } from "@shared/schema";
import HabitCard from "@/components/habit-card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Link } from "wouter";
import { ChevronLeft, Loader2 } from "lucide-react";

interface UserPageProps {
  id: string;
}

export default function UserPage({ id }: UserPageProps) {
  const userId = parseInt(id);

  // Get user profile
  const { data: user, isLoading: isLoadingUser } = useQuery<User>({
    queryKey: [`/api/users/${userId}`],
    enabled: !isNaN(userId),
  });

  // Get user's habits
  const { data: habits = [], isLoading: isLoadingHabits } = useQuery<Habit[]>({
    queryKey: [`/api/users/${userId}/habits`],
    enabled: !isNaN(userId),
  });

  if (isNaN(userId)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Invalid user ID</p>
      </div>
    );
  }

  if (isLoadingUser || isLoadingHabits) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">User not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <a className="flex items-center text-muted-foreground hover:text-foreground">
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Back to Dashboard
                </a>
              </Link>
            </div>
          </div>
          <div className="flex items-center space-x-4 mt-4">
            <Avatar className="h-12 w-12">
              <AvatarFallback>
                {user.username.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <h1 className="text-2xl font-bold">{user.username}'s Habits</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {habits.map((habit) => (
            <HabitCard key={habit.id} habit={habit} />
          ))}
          {habits.length === 0 && (
            <p className="text-muted-foreground col-span-2 text-center py-8">
              No habits to display
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
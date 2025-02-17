import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import type { User, HabitCompletion } from "@shared/schema";
import { Trophy } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

interface LeaderboardUser extends User {
  completionCount: number;
}

export default function Leaderboard() {
  const { user: currentUser } = useAuth();
  const { data: friends = [] } = useQuery<User[]>({
    queryKey: ["/api/friends"],
  });

  // Get all habit completions for current user and friends
  const { data: leaderboardData = [] } = useQuery<LeaderboardUser[]>({
    queryKey: ["/api/leaderboard"],
    select: (data) => {
      // Combine current user with friends and sort by completion count
      const allUsers = [...(currentUser ? [currentUser] : []), ...friends]
        .map(user => ({
          ...user,
          completionCount: data.find(d => d.id === user.id)?.completionCount ?? 0
        }))
        .sort((a, b) => b.completionCount - a.completionCount);

      return allUsers;
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-500" />
          Leaderboard
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {leaderboardData.map((user, index) => (
            <div
              key={user.id}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <span className="text-muted-foreground">#{index + 1}</span>
                <span className={`font-medium ${user.id === currentUser?.id ? 'text-primary' : ''}`}>
                  {user.username}
                </span>
              </div>
              <span className="text-sm text-muted-foreground">
                {user.completionCount} completions
              </span>
            </div>
          ))}
          {leaderboardData.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No users to show on leaderboard
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
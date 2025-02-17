import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";
import { Link, useLocation } from "wouter";

export default function FriendList() {
  const [location, navigate] = useLocation();
  const { data: friends = [] } = useQuery<User[]>({
    queryKey: ["/api/friends"],
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>Friends</CardTitle>
        <Button variant="outline" size="sm" onClick={() => navigate("/friends")}>
          <Users className="w-4 h-4 mr-2" />
          Manage
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {friends.map((friend) => (
          <Link
            key={friend.id}
            href={`/users/${friend.id}`}
            className="block"
          >
            <div className="flex items-center space-x-4 p-2 rounded-md hover:bg-accent cursor-pointer">
              <Avatar>
                <AvatarFallback>
                  {friend.username.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">{friend.username}</p>
              </div>
            </div>
          </Link>
        ))}
        {friends.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No friends yet. Add some friends to see their habits!
          </p>
        )}
      </CardContent>
    </Card>
  );
}
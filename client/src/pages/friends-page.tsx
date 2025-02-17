import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { User } from "@shared/schema";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, Check, X, Search } from "lucide-react";
import { useState } from "react";

export default function FriendsPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");

  // Get friend requests
  const { data: friendRequests = [] } = useQuery<{ user: User; status: string }[]>({
    queryKey: ["/api/friends/requests"],
  });

  // Search users only when there is a search term
  const { data: searchResults = [] } = useQuery<User[]>({
    queryKey: ["/api/search/users", searchTerm],
    queryFn: async () => {
      if (!searchTerm) return [];
      const res = await fetch(`/api/search/users?q=${encodeURIComponent(searchTerm)}`);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to search users");
      }
      return res.json();
    },
    enabled: searchTerm.length > 0,
  });

  // Send friend request
  const sendRequestMutation = useMutation({
    mutationFn: async (friendId: number) => {
      await apiRequest("POST", `/api/friends/request/${friendId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/search/users", searchTerm] });
      toast({
        title: "Friend request sent",
        description: "They will be notified of your request.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send friend request",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Accept friend request
  const acceptRequestMutation = useMutation({
    mutationFn: async (friendId: number) => {
      await apiRequest("POST", `/api/friends/accept/${friendId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/friends/requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/friends"] });
      toast({
        title: "Friend request accepted",
        description: "You are now friends!",
      });
    },
  });

  // Reject friend request
  const rejectRequestMutation = useMutation({
    mutationFn: async (friendId: number) => {
      await apiRequest("POST", `/api/friends/reject/${friendId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/friends/requests"] });
      toast({
        title: "Friend request rejected",
      });
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">Friends</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Friend Requests */}
          <Card>
            <CardHeader>
              <CardTitle>Friend Requests</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {friendRequests.map(({ user: requestUser }) => (
                <div key={requestUser.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Avatar>
                      <AvatarFallback>
                        {requestUser.username.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{requestUser.username}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => acceptRequestMutation.mutate(requestUser.id)}
                      disabled={acceptRequestMutation.isPending}
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => rejectRequestMutation.mutate(requestUser.id)}
                      disabled={rejectRequestMutation.isPending}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {friendRequests.length === 0 && (
                <p className="text-sm text-muted-foreground">No pending friend requests</p>
              )}
            </CardContent>
          </Card>

          {/* Search Users */}
          <Card>
            <CardHeader>
              <CardTitle>Add Friends</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Search className="w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search users by username..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="space-y-4">
                {searchTerm && searchResults.map((searchUser) => (
                  <div key={searchUser.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <Avatar>
                        <AvatarFallback>
                          {searchUser.username.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{searchUser.username}</span>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => sendRequestMutation.mutate(searchUser.id)}
                      disabled={sendRequestMutation.isPending}
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      Add Friend
                    </Button>
                  </div>
                ))}
                {searchTerm && searchResults.length === 0 && (
                  <p className="text-sm text-muted-foreground">No users found matching "{searchTerm}"</p>
                )}
                {!searchTerm && (
                  <p className="text-sm text-muted-foreground">Type a username to search for friends</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
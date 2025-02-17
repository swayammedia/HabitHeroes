import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertHabitSchema } from "@shared/schema";
import { log } from "./vite";

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  // Habits
  app.post("/api/habits", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const parsed = insertHabitSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json(parsed.error);
    }

    const habit = await storage.createHabit(req.user!.id, {
      title: parsed.data.title,
      description: parsed.data.description ?? null,
    });
    res.json(habit);
  });

  app.get("/api/habits", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const habits = await storage.getHabits(req.user!.id);
    res.json(habits);
  });

  app.get("/api/habits/:id/completions", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const habitId = parseInt(req.params.id);
      if (isNaN(habitId)) {
        return res.status(400).json({ message: "Invalid habit ID" });
      }
      const completions = await storage.getHabitCompletions(habitId);
      res.json(completions);
    } catch (error) {
      log(`Error fetching habit completions: ${error}`);
      res.status(500).json({ message: "Failed to fetch habit completions" });
    }
  });

  app.post("/api/habits/:id/complete", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const habitId = parseInt(req.params.id);
      if (isNaN(habitId)) {
        return res.status(400).json({ message: "Invalid habit ID" });
      }
      await storage.completeHabit(habitId, req.user!.id);
      res.sendStatus(200);
    } catch (error) {
      log(`Error completing habit: ${error}`);
      res.status(500).json({ message: "Failed to complete habit" });
    }
  });

  // Add this endpoint near the other habit endpoints
  app.get("/api/leaderboard", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      // Get current user's friends
      const friends = await storage.getFriends(req.user!.id);
      const userIds = [req.user!.id, ...friends.map(f => f.id)];

      // Get completion counts for all users
      const leaderboardData = await storage.getHabitCompletionCounts(userIds);
      res.json(leaderboardData);
    } catch (error) {
      log(`Error fetching leaderboard data: ${error}`);
      res.status(500).json({ message: "Failed to fetch leaderboard data" });
    }
  });

  // Add the delete habit endpoint after the other habit endpoints
  app.delete("/api/habits/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const habitId = parseInt(req.params.id);
      if (isNaN(habitId)) {
        return res.status(400).json({ message: "Invalid habit ID" });
      }

      // Get the habit to verify ownership
      const habit = await storage.getHabit(habitId);
      if (!habit) {
        return res.status(404).json({ message: "Habit not found" });
      }

      // Verify the user owns this habit
      if (habit.userId !== req.user!.id) {
        return res.status(403).json({ message: "Not authorized to delete this habit" });
      }

      await storage.deleteHabit(habitId);
      res.sendStatus(200);
    } catch (error) {
      log(`Error deleting habit: ${error}`);
      res.status(500).json({ message: "Failed to delete habit" });
    }
  });

  // User profile and habits
  app.get("/api/users/:id/habits", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        log(`Invalid user ID for habits: ${req.params.id}`);
        return res.status(400).json({ message: "Invalid user ID" });
      }

      log(`Fetching habits for user ID: ${userId}`);
      // First check if user exists
      const user = await storage.getUser(userId);
      if (!user) {
        log(`User not found for habits with ID: ${userId}`);
        return res.status(404).json({ message: "User not found" });
      }

      const habits = await storage.getHabits(userId);
      log(`Found ${habits.length} habits for user ${user.username}`);
      res.json(habits);
    } catch (error) {
      log(`Error fetching user habits: ${error}`);
      res.status(500).json({ message: "Failed to fetch habits" });
    }
  });

  // Friends
  app.get("/api/friends", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const friends = await storage.getFriends(req.user!.id);
    res.json(friends);
  });

  app.get("/api/friends/requests", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const requests = await storage.getFriendRequests(req.user!.id);
    res.json(requests);
  });

  app.post("/api/friends/request/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const friendId = parseInt(req.params.id);

      // Check if trying to add self
      if (friendId === req.user!.id) {
        return res.status(400).json({ message: "Cannot send friend request to yourself" });
      }

      // Check if user exists
      const friend = await storage.getUser(friendId);
      if (!friend) {
        return res.status(404).json({ message: "User not found" });
      }

      await storage.sendFriendRequest(req.user!.id, friendId);
      log(`Friend request sent from ${req.user!.username} to ${friend.username}`);
      res.sendStatus(200);
    } catch (error: any) {
      log(`Error sending friend request: ${error}`);
      if (error.message === "Friend request already exists") {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Failed to send friend request" });
      }
    }
  });

  app.post("/api/friends/accept/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      await storage.acceptFriendRequest(req.user!.id, parseInt(req.params.id));
      res.sendStatus(200);
    } catch (error) {
      log(`Error accepting friend request: ${error}`);
      res.status(500).json({ message: "Failed to accept friend request" });
    }
  });

  app.post("/api/friends/reject/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      await storage.rejectFriendRequest(req.user!.id, parseInt(req.params.id));
      res.sendStatus(200);
    } catch (error) {
      log(`Error rejecting friend request: ${error}`);
      res.status(500).json({ message: "Failed to reject friend request" });
    }
  });

  // Update the users endpoint to handle search
  app.get("/api/users", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const searchTerm = req.query.search as string;
      if (!searchTerm) {
        return res.json([]);
      }

      log(`Searching users with term: ${searchTerm}`);
      const users = await storage.searchUsers(searchTerm);
      log(`Raw search results: ${users.length} users found`);

      const friends = await storage.getFriends(req.user!.id);
      const requests = await storage.getFriendRequests(req.user!.id);

      const friendIds = new Set(friends.map(f => f.id));
      const requestIds = new Set(requests.map(r => r.user.id));

      // Filter out current user and existing friends/requests
      const availableUsers = users.filter(user =>
        user.id !== req.user!.id &&
        !friendIds.has(user.id) &&
        !requestIds.has(user.id)
      );

      log(`Found ${availableUsers.length} available users for search term: ${searchTerm}`);
      log(`Available users: ${JSON.stringify(availableUsers.map(u => u.username))}`);
      res.json(availableUsers);
    } catch (error) {
      log(`Error searching users: ${error}`);
      res.status(500).json({ message: "Failed to search users" });
    }
  });

  // Add this new search endpoint
  app.get("/api/search/users", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const query = req.query.q as string;
      if (!query) {
        return res.json([]);
      }

      log(`Searching users with query: ${query}`);

      // Get all searchable users
      const users = await storage.searchUsers(query);
      log(`Found ${users.length} users matching query`);

      // Get current user's friends and pending requests
      const friends = await storage.getFriends(req.user!.id);
      const requests = await storage.getFriendRequests(req.user!.id);

      // Create sets for faster lookup
      const friendIds = new Set(friends.map(f => f.id));
      const requestIds = new Set(requests.map(r => r.user.id));

      // Filter out current user, friends, and pending requests
      const availableUsers = users.filter(user =>
        user.id !== req.user!.id &&
        !friendIds.has(user.id) &&
        !requestIds.has(user.id)
      );

      log(`Returning ${availableUsers.length} available users`);
      log(`Available usernames: ${availableUsers.map(u => u.username).join(', ')}`);

      res.json(availableUsers);
    } catch (error) {
      log(`Error searching users: ${error}`);
      res.status(500).json({ message: "Failed to search users" });
    }
  });

  app.get("/api/users/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        log(`Invalid user ID: ${req.params.id}`);
        return res.status(400).json({ message: "Invalid user ID" });
      }

      log(`Fetching user with ID: ${userId}`);
      const user = await storage.getUser(userId);

      if (!user) {
        log(`User not found with ID: ${userId}`);
        return res.status(404).json({ message: "User not found" });
      }

      log(`Successfully found user: ${user.username}`);
      res.json(user);
    } catch (error) {
      log(`Error fetching user: ${error}`);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
import { User, InsertUser, Habit, Friend, HabitCompletion } from "@shared/schema";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { db } from "./db";
import { eq, and, or, sql } from "drizzle-orm";
import { users, habits, habitCompletions, friends } from "@shared/schema";

const PostgresSessionStore = connectPg(session);
import { pool } from "./db";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;

  // Habit methods
  createHabit(userId: number, habit: Omit<Habit, "id" | "userId" | "createdAt">): Promise<Habit>;
  getHabits(userId: number): Promise<Habit[]>;
  completeHabit(habitId: number, userId: number): Promise<void>;
  getHabitCompletions(habitId: number): Promise<HabitCompletion[]>;
  getHabit(id: number): Promise<Habit | undefined>;
  deleteHabit(id: number): Promise<void>;

  // Friend methods
  getFriends(userId: number): Promise<User[]>;
  getFriendRequests(userId: number): Promise<{ user: User; status: string }[]>;
  sendFriendRequest(userId: number, friendId: number): Promise<void>;
  acceptFriendRequest(userId: number, friendId: number): Promise<void>;
  rejectFriendRequest(userId: number, friendId: number): Promise<void>;

  sessionStore: session.Store;
  searchUsers(searchTerm: string): Promise<User[]>;
  getHabitCompletionCounts(userIds: number[]): Promise<Array<{ id: number; username: string; completionCount: number }>>;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async createHabit(
    userId: number,
    habit: Omit<Habit, "id" | "userId" | "createdAt">,
  ): Promise<Habit> {
    const [newHabit] = await db
      .insert(habits)
      .values({ ...habit, userId })
      .returning();
    return newHabit;
  }

  async getHabits(userId: number): Promise<Habit[]> {
    return await db.select().from(habits).where(eq(habits.userId, userId));
  }

  async completeHabit(habitId: number, userId: number): Promise<void> {
    await db.insert(habitCompletions).values({ habitId, userId });
  }

  async getHabitCompletions(habitId: number): Promise<HabitCompletion[]> {
    return await db
      .select()
      .from(habitCompletions)
      .where(eq(habitCompletions.habitId, habitId));
  }

  async getFriends(userId: number): Promise<User[]> {
    const friendships = await db
      .select({
        id: friends.id,
        userId: friends.userId,
        friendId: friends.friendId,
        status: friends.status,
      })
      .from(friends)
      .where(
        and(
          or(eq(friends.userId, userId), eq(friends.friendId, userId)),
          eq(friends.status, "accepted"),
        ),
      );

    const friendIds = friendships.map((f) =>
      f.userId === userId ? f.friendId : f.userId,
    );

    if (friendIds.length === 0) return [];

    return await db
      .select()
      .from(users)
      .where(or(...friendIds.map((id) => eq(users.id, id))));
  }

  async getFriendRequests(userId: number): Promise<{ user: User; status: string }[]> {
    const requests = await db
      .select({
        id: friends.id,
        userId: friends.userId,
        friendId: friends.friendId,
        status: friends.status,
      })
      .from(friends)
      .where(
        and(
          eq(friends.friendId, userId),
          eq(friends.status, "pending"),
        ),
      );

    const senderIds = requests.map((r) => r.userId);
    if (senderIds.length === 0) return [];

    const senders = await db
      .select()
      .from(users)
      .where(or(...senderIds.map((id) => eq(users.id, id))));

    return senders.map((sender) => ({
      user: sender,
      status: "pending",
    }));
  }

  async sendFriendRequest(userId: number, friendId: number): Promise<void> {
    try {
      await db.insert(friends).values({
        userId,
        friendId,
        status: "pending",
      });
    } catch (error: any) {
      // Check if it's a unique constraint violation (duplicate request)
      if (error.code === '23505') {
        throw new Error("Friend request already exists");
      }
      throw error;
    }
  }

  async acceptFriendRequest(userId: number, friendId: number): Promise<void> {
    await db
      .update(friends)
      .set({ status: "accepted" })
      .where(
        and(
          eq(friends.userId, friendId),
          eq(friends.friendId, userId),
          eq(friends.status, "pending"),
        ),
      );
  }

  async rejectFriendRequest(userId: number, friendId: number): Promise<void> {
    await db
      .delete(friends)
      .where(
        and(
          eq(friends.userId, friendId),
          eq(friends.friendId, userId),
          eq(friends.status, "pending"),
        ),
      );
  }

  async searchUsers(searchTerm: string): Promise<User[]> {
    // Simple case-insensitive search using ILIKE
    return await db
      .select()
      .from(users)
      .where(sql`username ILIKE ${'%' + searchTerm + '%'}`);
  }

  async getHabit(id: number): Promise<Habit | undefined> {
    const [habit] = await db.select().from(habits).where(eq(habits.id, id));
    return habit;
  }

  async deleteHabit(id: number): Promise<void> {
    // First delete all completions
    await db.delete(habitCompletions).where(eq(habitCompletions.habitId, id));
    // Then delete the habit
    await db.delete(habits).where(eq(habits.id, id));
  }

  async getHabitCompletionCounts(userIds: number[]): Promise<Array<{ id: number; username: string; completionCount: number }>> {
    const result = await db
      .select({
        id: users.id,
        username: users.username,
        completionCount: sql<number>`count(${habitCompletions.id})::int`,
      })
      .from(users)
      .leftJoin(habits, eq(habits.userId, users.id))
      .leftJoin(habitCompletions, eq(habitCompletions.habitId, habits.id))
      .where(or(...userIds.map(id => eq(users.id, id))))
      .groupBy(users.id, users.username);

    return result;
  }
}

export const storage = new DatabaseStorage();
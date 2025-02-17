import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const habits = pgTable("habits", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const habitCompletions = pgTable("habit_completions", {
  id: serial("id").primaryKey(),
  habitId: integer("habit_id").notNull(),
  userId: integer("user_id").notNull(),
  completedAt: timestamp("completed_at").defaultNow(),
});

export const friends = pgTable("friends", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  friendId: integer("friend_id").notNull(),
  status: text("status").notNull().$type<"pending" | "accepted">(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Schema for user registration/insertion
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

// Schema for habit creation
export const insertHabitSchema = createInsertSchema(habits).pick({
  title: true,
  description: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Habit = typeof habits.$inferSelect;
export type HabitCompletion = typeof habitCompletions.$inferSelect;
export type Friend = typeof friends.$inferSelect;
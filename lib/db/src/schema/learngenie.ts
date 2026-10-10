import { pgTable, text, serial, integer, real, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const studyPlansTable = pgTable("study_plans", {
  id: serial("id").primaryKey(),
  subject: text("subject").notNull(),
  goal: text("goal").notNull(),
  targetExam: text("target_exam"),
  hoursPerDay: real("hours_per_day").notNull(),
  deadline: text("deadline"),
  skillLevel: text("skill_level").notNull(),
  planContent: text("plan_content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertStudyPlanSchema = createInsertSchema(studyPlansTable).omit({ id: true, createdAt: true });
export type InsertStudyPlan = z.infer<typeof insertStudyPlanSchema>;
export type StudyPlan = typeof studyPlansTable.$inferSelect;

export const quizzesTable = pgTable("quizzes", {
  id: serial("id").primaryKey(),
  topic: text("topic").notNull(),
  difficulty: text("difficulty").notNull(),
  questionType: text("question_type").notNull(),
  questions: jsonb("questions").notNull().$type<Array<{
    id: number;
    question: string;
    options: string[] | null;
    correctAnswer: string;
    explanation: string | null;
  }>>(),
  lastScore: real("last_score"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Quiz = typeof quizzesTable.$inferSelect;

export const flashcardSetsTable = pgTable("flashcard_sets", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  topic: text("topic").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const flashcardsTable = pgTable("flashcards", {
  id: serial("id").primaryKey(),
  setId: integer("set_id").notNull().references(() => flashcardSetsTable.id, { onDelete: "cascade" }),
  front: text("front").notNull(),
  back: text("back").notNull(),
  isLearned: boolean("is_learned").default(false).notNull(),
  isBookmarked: boolean("is_bookmarked").default(false).notNull(),
});

export type FlashcardSet = typeof flashcardSetsTable.$inferSelect;
export type Flashcard = typeof flashcardsTable.$inferSelect;

export const studySessionsTable = pgTable("study_sessions", {
  id: serial("id").primaryKey(),
  minutes: integer("minutes").notNull(),
  topic: text("topic").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type StudySession = typeof studySessionsTable.$inferSelect;

export const conversationsTable = pgTable("conversations", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const messagesTable = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull().references(() => conversationsTable.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Conversation = typeof conversationsTable.$inferSelect;
export type Message = typeof messagesTable.$inferSelect;

export const notesTable = pgTable("notes", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  topic: text("topic"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Note = typeof notesTable.$inferSelect;

export const activityLogTable = pgTable("activity_log", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(),
  description: text("description").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type ActivityLog = typeof activityLogTable.$inferSelect;

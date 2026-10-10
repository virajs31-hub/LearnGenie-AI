import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  studyPlansTable,
  studySessionsTable,
  quizzesTable,
  flashcardsTable,
  activityLogTable,
} from "@workspace/db";
import { sql } from "drizzle-orm";

const router: IRouter = Router();

router.get("/dashboard/summary", async (req, res): Promise<void> => {
  const [sessions, plans, quizRows, flashcardRows, activity] =
    await Promise.all([
      db.select().from(studySessionsTable),
      db.select().from(studyPlansTable),
      db.select().from(quizzesTable),
      db.select().from(flashcardsTable),
      db
        .select()
        .from(activityLogTable)
        .orderBy(sql`${activityLogTable.createdAt} desc`)
        .limit(10),
    ]);

  const totalStudyMinutes = sessions.reduce((sum, s) => sum + s.minutes, 0);

  // streak: count consecutive days from today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const sessionDates = new Set(
    sessions.map((s) => {
      const d = new Date(s.createdAt);
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    }),
  );
  let streak = 0;
  const check = new Date(today);
  while (sessionDates.has(check.getTime())) {
    streak++;
    check.setDate(check.getDate() - 1);
  }

  const quizzesCompleted = quizRows.filter((q) => q.lastScore != null).length;
  const flashcardsLearned = flashcardRows.filter((f) => f.isLearned).length;

  // weekly stats
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weeklyStudiedMinutes = sessions
    .filter((s) => new Date(s.createdAt) >= weekAgo)
    .reduce((sum, s) => sum + s.minutes, 0);

  const xpPoints =
    totalStudyMinutes * 2 + quizzesCompleted * 50 + flashcardsLearned * 5;
  const level = Math.floor(xpPoints / 500) + 1;

  res.json({
    totalStudyMinutes,
    currentStreak: streak,
    quizzesCompleted,
    flashcardsLearned,
    studyPlansActive: plans.length,
    weeklyGoalMinutes: 300,
    weeklyStudiedMinutes,
    xpPoints,
    level,
    recentActivity: activity.map((a) => ({
      id: a.id,
      type: a.type,
      description: a.description,
      createdAt: a.createdAt,
    })),
  });
});

export default router;

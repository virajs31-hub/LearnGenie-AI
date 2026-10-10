import { Router, type IRouter } from "express";
import { db, studySessionsTable, quizzesTable, activityLogTable } from "@workspace/db";
import { LogStudySessionBody } from "@workspace/api-zod";
import { sql } from "drizzle-orm";

const router: IRouter = Router();

router.get("/progress", async (_req, res): Promise<void> => {
  const [sessions, quizRows] = await Promise.all([
    db.select().from(studySessionsTable).orderBy(studySessionsTable.createdAt),
    db.select().from(quizzesTable),
  ]);

  // daily sessions - last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const dailyMap = new Map<string, number>();
  for (const s of sessions) {
    const d = new Date(s.createdAt);
    if (d >= thirtyDaysAgo) {
      const key = d.toISOString().split("T")[0];
      dailyMap.set(key, (dailyMap.get(key) ?? 0) + s.minutes);
    }
  }
  const dailySessions = Array.from(dailyMap.entries()).map(([date, minutes]) => ({ date, minutes }));

  // quiz scores
  const quizScores = quizRows
    .filter((q) => q.lastScore != null)
    .map((q) => ({
      date: new Date(q.createdAt).toISOString().split("T")[0],
      topic: q.topic,
      score: q.lastScore as number,
    }));

  const totalMinutes = sessions.reduce((sum, s) => sum + s.minutes, 0);

  // streak
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

  const xp = totalMinutes * 2 + quizRows.filter((q) => q.lastScore != null).length * 50;

  const allAchievements = [
    { id: 1, title: "First Step", description: "Complete your first study session", icon: "BookOpen", threshold: 1, type: "sessions" },
    { id: 2, title: "Study Streak", description: "Study for 3 days in a row", icon: "Flame", threshold: 3, type: "streak" },
    { id: 3, title: "Quiz Master", description: "Complete 5 quizzes", icon: "Trophy", threshold: 5, type: "quizzes" },
    { id: 4, title: "Dedicated Learner", description: "Log 60 minutes of study time", icon: "Clock", threshold: 60, type: "minutes" },
    { id: 5, title: "Knowledge Seeker", description: "Study for 7 days in a row", icon: "Star", threshold: 7, type: "streak" },
    { id: 6, title: "Century Club", description: "Log 100 minutes of study time", icon: "Award", threshold: 100, type: "minutes" },
  ];

  const quizCount = quizRows.filter((q) => q.lastScore != null).length;
  const achievements = allAchievements.map((a) => {
    let unlocked = false;
    if (a.type === "sessions") unlocked = sessions.length >= a.threshold;
    if (a.type === "streak") unlocked = streak >= a.threshold;
    if (a.type === "quizzes") unlocked = quizCount >= a.threshold;
    if (a.type === "minutes") unlocked = totalMinutes >= a.threshold;
    return {
      id: a.id,
      title: a.title,
      description: a.description,
      icon: a.icon,
      unlockedAt: unlocked ? new Date().toISOString() : null,
    };
  });

  res.json({
    dailySessions,
    quizScores,
    topicsCompleted: quizCount,
    totalMinutes,
    streak,
    achievements,
  });
});

router.post("/progress/log", async (req, res): Promise<void> => {
  const parsed = LogStudySessionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [session] = await db
    .insert(studySessionsTable)
    .values(parsed.data)
    .returning();

  await db.insert(activityLogTable).values({
    type: "study_session",
    description: `Studied ${parsed.data.topic} for ${parsed.data.minutes} minutes`,
  });

  res.status(201).json(session);
});

export default router;

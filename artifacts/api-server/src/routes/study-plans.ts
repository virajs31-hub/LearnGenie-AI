import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, studyPlansTable, activityLogTable } from "@workspace/db";
import { CreateStudyPlanBody, GetStudyPlanParams, DeleteStudyPlanParams } from "@workspace/api-zod";
import { ai } from "@workspace/integrations-gemini-ai";

const router: IRouter = Router();

router.get("/study-plans", async (_req, res): Promise<void> => {
  const plans = await db
    .select()
    .from(studyPlansTable)
    .orderBy(studyPlansTable.createdAt);
  res.json(plans);
});

router.post("/study-plans", async (req, res): Promise<void> => {
  const parsed = CreateStudyPlanBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { subject, goal, targetExam, hoursPerDay, deadline, skillLevel } = parsed.data;

  const prompt = `You are an expert academic study planner. Create a detailed, actionable study plan for a student with the following details:
Subject: ${subject}
Goal: ${goal}
Target Exam: ${targetExam ?? "Not specified"}
Study Hours Per Day: ${hoursPerDay}
Deadline: ${deadline ?? "Not specified"}
Current Skill Level: ${skillLevel}

Generate a comprehensive study plan in JSON format with these fields:
{
  "dailySchedule": [{"day": "Monday", "tasks": ["task1", "task2"], "hours": 2}],
  "weeklyPlan": [{"week": 1, "focus": "topic", "topics": ["topic1", "topic2"]}],
  "priorityTopics": ["topic1", "topic2"],
  "milestones": [{"week": 2, "milestone": "Complete basics"}],
  "revisionSchedule": "description of revision strategy",
  "tips": ["tip1", "tip2"]
}

Make it specific, realistic, and motivating. Return ONLY the JSON, no markdown.`;

  let planContent = "";
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: { maxOutputTokens: 8192 },
    });
    planContent = response.text ?? "";
    // strip markdown code blocks if present
    planContent = planContent.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
  } catch (err) {
    req.log.error({ err }, "Gemini error generating study plan");
    planContent = JSON.stringify({
      dailySchedule: [],
      weeklyPlan: [{ week: 1, focus: subject, topics: [goal] }],
      priorityTopics: [subject],
      milestones: [],
      revisionSchedule: "Review notes weekly",
      tips: ["Start with fundamentals", "Practice daily", "Take breaks"],
    });
  }

  const [plan] = await db
    .insert(studyPlansTable)
    .values({
      subject,
      goal,
      targetExam: targetExam ?? null,
      hoursPerDay,
      deadline: deadline ?? null,
      skillLevel,
      planContent,
    })
    .returning();

  await db.insert(activityLogTable).values({
    type: "study_plan",
    description: `Created study plan for ${subject}`,
  });

  res.status(201).json(plan);
});

router.get("/study-plans/:id", async (req, res): Promise<void> => {
  const params = GetStudyPlanParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [plan] = await db
    .select()
    .from(studyPlansTable)
    .where(eq(studyPlansTable.id, params.data.id));

  if (!plan) {
    res.status(404).json({ error: "Study plan not found" });
    return;
  }

  res.json(plan);
});

router.delete("/study-plans/:id", async (req, res): Promise<void> => {
  const params = DeleteStudyPlanParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [plan] = await db
    .delete(studyPlansTable)
    .where(eq(studyPlansTable.id, params.data.id))
    .returning();

  if (!plan) {
    res.status(404).json({ error: "Study plan not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;

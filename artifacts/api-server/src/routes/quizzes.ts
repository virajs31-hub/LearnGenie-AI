import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, quizzesTable, activityLogTable } from "@workspace/db";
import {
  CreateQuizBody,
  GetQuizParams,
  SubmitQuizResultParams,
  SubmitQuizResultBody,
} from "@workspace/api-zod";
import { ai } from "@workspace/integrations-gemini-ai";

const router: IRouter = Router();

router.get("/quizzes", async (_req, res): Promise<void> => {
  const quizzes = await db
    .select()
    .from(quizzesTable)
    .orderBy(quizzesTable.createdAt);
  res.json(quizzes);
});

router.post("/quizzes", async (req, res): Promise<void> => {
  const parsed = CreateQuizBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { topic, difficulty, questionCount, questionType } = parsed.data;

  const prompt = `Generate ${questionCount} ${questionType} questions about "${topic}" at ${difficulty} difficulty level for students.

Return a JSON array like this (no markdown):
[
  {
    "id": 1,
    "question": "What is...?",
    "options": ["A", "B", "C", "D"],
    "correctAnswer": "A",
    "explanation": "Because..."
  }
]

For true/false questions, options should be ["True", "False"].
For fill-in-the-blank, options can be null.
For short-answer, options can be null.
Make questions educational, clear, and progressively challenging.
Return ONLY the JSON array, no markdown.`;

  let questions: Array<{
    id: number;
    question: string;
    options: string[] | null;
    correctAnswer: string;
    explanation: string | null;
  }> = [];

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: { maxOutputTokens: 8192 },
    });
    let text = response.text ?? "[]";
    text = text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
    questions = JSON.parse(text);
  } catch (err) {
    req.log.error({ err }, "Gemini error generating quiz");
    questions = [
      {
        id: 1,
        question: `What is the main concept of ${topic}?`,
        options: ["Option A", "Option B", "Option C", "Option D"],
        correctAnswer: "Option A",
        explanation: "This is the fundamental concept.",
      },
    ];
  }

  const [quiz] = await db
    .insert(quizzesTable)
    .values({
      topic,
      difficulty,
      questionType,
      questions,
    })
    .returning();

  await db.insert(activityLogTable).values({
    type: "quiz",
    description: `Generated quiz on ${topic}`,
  });

  res.status(201).json(quiz);
});

router.get("/quizzes/:id", async (req, res): Promise<void> => {
  const params = GetQuizParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [quiz] = await db
    .select()
    .from(quizzesTable)
    .where(eq(quizzesTable.id, params.data.id));

  if (!quiz) {
    res.status(404).json({ error: "Quiz not found" });
    return;
  }

  res.json(quiz);
});

router.post("/quizzes/:id/submit", async (req, res): Promise<void> => {
  const params = SubmitQuizResultParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = SubmitQuizResultBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [quiz] = await db
    .select()
    .from(quizzesTable)
    .where(eq(quizzesTable.id, params.data.id));

  if (!quiz) {
    res.status(404).json({ error: "Quiz not found" });
    return;
  }

  const questions = quiz.questions as Array<{
    id: number;
    correctAnswer: string;
  }>;
  const answers = body.data.answers;

  let correct = 0;
  for (const answer of answers) {
    const question = questions.find((q) => q.id === answer.questionId);
    if (
      question &&
      question.correctAnswer.toLowerCase() === answer.answer.toLowerCase()
    ) {
      correct++;
    }
  }

  const score = Math.round((correct / questions.length) * 100);

  await db
    .update(quizzesTable)
    .set({ lastScore: score })
    .where(eq(quizzesTable.id, params.data.id));

  await db.insert(activityLogTable).values({
    type: "quiz_completed",
    description: `Scored ${score}% on ${quiz.topic} quiz`,
  });

  const feedback =
    score >= 80
      ? "Excellent work! You have a strong grasp of this topic."
      : score >= 60
        ? "Good effort! Review the questions you missed to strengthen your understanding."
        : "Keep practicing! Focus on the fundamentals and try again.";

  res.json({
    score,
    totalQuestions: questions.length,
    correctAnswers: correct,
    timeTakenSeconds: body.data.timeTakenSeconds ?? null,
    feedback,
  });
});

export default router;

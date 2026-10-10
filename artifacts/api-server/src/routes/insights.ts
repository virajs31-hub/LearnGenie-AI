import { Router, type IRouter } from "express";
import { desc } from "drizzle-orm";
import { db, quizzesTable, studySessionsTable, flashcardSetsTable, flashcardsTable, studyPlansTable } from "@workspace/db";
import { ai } from "@workspace/integrations-gemini-ai";

const router: IRouter = Router();

function sseStream(res: ReturnType<typeof import("express").response.json>, type: string, payload: unknown) {
  res.write(`data: ${JSON.stringify({ type, ...payload as object })}\n\n`);
}

router.post("/insights/analyze", async (req, res): Promise<void> => {
  const { mode } = req.body as { mode: string };

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  try {
    if (mode === "knowledge-gaps") {
      const quizzes = await db.select().from(quizzesTable).orderBy(desc(quizzesTable.createdAt));
      const attempted = quizzes.filter(q => q.lastScore != null);

      if (attempted.length === 0) {
        res.write(`data: ${JSON.stringify({ type: "result", content: "No quiz data yet. Take some quizzes first to identify knowledge gaps." })}\n\n`);
        res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
        res.end();
        return;
      }

      const summary = attempted.map(q => `Topic: ${q.topic}, Score: ${q.lastScore}%, Difficulty: ${q.difficulty}`).join("\n");

      const prompt = `You are an expert learning coach. Based on these quiz results, identify knowledge gaps and weak topics:

${summary}

Provide a concise analysis with:
1. **Top Weak Areas** (topics scoring below 70%)
2. **Strengths** (topics scoring above 80%)
3. **Priority Focus** (specific sub-topics to revise)
4. **Quick Action Plan** (3-4 concrete next steps)

Be specific, encouraging, and actionable. Use bullet points and clear headers.`;

      const stream = await ai.models.generateContentStream({
        model: "gemini-2.5-flash",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: { maxOutputTokens: 2048 },
      });

      for await (const chunk of stream) {
        if (chunk.text) res.write(`data: ${JSON.stringify({ type: "chunk", content: chunk.text })}\n\n`);
      }

    } else if (mode === "exam-readiness") {
      const [quizzes, sessions, plans] = await Promise.all([
        db.select().from(quizzesTable).orderBy(desc(quizzesTable.createdAt)),
        db.select().from(studySessionsTable),
        db.select().from(studyPlansTable),
      ]);
      const flashSets = await db.select().from(flashcardSetsTable);

      const attempted = quizzes.filter(q => q.lastScore != null);
      const avgScore = attempted.length > 0 ? attempted.reduce((s, q) => s + (q.lastScore ?? 0), 0) / attempted.length : 0;
      const totalMinutes = sessions.reduce((s, s2) => s + s2.minutes, 0);
      const totalCards = flashSets.reduce((s) => s, 0);

      const prompt = `You are an expert academic coach. Calculate an Exam Readiness Score and give improvement advice.

Student stats:
- Total study time: ${totalMinutes} minutes
- Quizzes taken: ${attempted.length} (avg score: ${Math.round(avgScore)}%)
- Flashcard sets created: ${flashSets.length}
- Study plans active: ${plans.length}
- Recent quiz scores: ${attempted.slice(-5).map(q => `${q.topic}:${q.lastScore}%`).join(", ") || "none"}

Provide:
1. **Readiness Score: XX%** (calculate based on the data above)
2. **Score Breakdown** (what factors contributed)
3. **What's Going Well** (strengths to leverage)
4. **Key Gaps to Close** (specific areas needing attention)
5. **Top 3 Recommendations** to boost readiness

Be specific and motivating. Format clearly with headers and bullet points.`;

      const stream = await ai.models.generateContentStream({
        model: "gemini-2.5-flash",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: { maxOutputTokens: 2048 },
      });

      for await (const chunk of stream) {
        if (chunk.text) res.write(`data: ${JSON.stringify({ type: "chunk", content: chunk.text })}\n\n`);
      }

    } else if (mode === "mistake-analysis") {
      const quizzes = await db.select().from(quizzesTable).orderBy(desc(quizzesTable.createdAt));
      const lowScores = quizzes.filter(q => q.lastScore != null && (q.lastScore as number) < 80);

      if (lowScores.length === 0) {
        res.write(`data: ${JSON.stringify({ type: "chunk", content: "Great work! You haven't scored below 80% on any quiz yet. Keep taking more quizzes to get detailed mistake analysis." })}\n\n`);
        res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
        res.end();
        return;
      }

      const details = lowScores.slice(0, 5).map(q => {
        const questions = q.questions as Array<{ question: string; correctAnswer: string }>;
        return `Topic: ${q.topic} (${q.lastScore}%)\nQuestions: ${questions.slice(0, 3).map(qu => qu.question).join("; ")}`;
      }).join("\n\n");

      const prompt = `You are a learning specialist. Analyze these quiz mistakes and give targeted revision advice:

${details}

Provide:
1. **Common Error Patterns** (what types of questions are causing mistakes)
2. **Root Cause Analysis** (why these mistakes are happening)
3. **Targeted Revision Topics** (specific sub-topics to revisit)
4. **Study Strategies** (how to study these topics more effectively)
5. **Practice Exercises** (2-3 specific practice suggestions)

Be constructive, specific, and encouraging.`;

      const stream = await ai.models.generateContentStream({
        model: "gemini-2.5-flash",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: { maxOutputTokens: 2048 },
      });

      for await (const chunk of stream) {
        if (chunk.text) res.write(`data: ${JSON.stringify({ type: "chunk", content: chunk.text })}\n\n`);
      }

    } else if (mode === "weekly-report") {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const [sessions, quizzes, plans] = await Promise.all([
        db.select().from(studySessionsTable).orderBy(desc(studySessionsTable.createdAt)),
        db.select().from(quizzesTable).orderBy(desc(quizzesTable.createdAt)),
        db.select().from(studyPlansTable),
      ]);

      const recentSessions = sessions.filter(s => new Date(s.createdAt) >= oneWeekAgo);
      const recentQuizzes = quizzes.filter(q => new Date(q.createdAt) >= oneWeekAgo && q.lastScore != null);
      const totalMinutesWeek = recentSessions.reduce((s, s2) => s + s2.minutes, 0);
      const avgScore = recentQuizzes.length > 0 ? recentQuizzes.reduce((s, q) => s + (q.lastScore ?? 0), 0) / recentQuizzes.length : null;
      const topics = [...new Set([...recentSessions.map(s => s.topic), ...recentQuizzes.map(q => q.topic)])];

      const prompt = `You are a personal learning coach. Generate a warm, motivating Weekly Learning Report for a student:

This week's data:
- Study sessions: ${recentSessions.length} sessions, ${totalMinutesWeek} total minutes
- Topics studied: ${topics.join(", ") || "none recorded"}
- Quizzes taken: ${recentQuizzes.length} (avg score: ${avgScore != null ? Math.round(avgScore) + "%" : "N/A"})
- Active study plans: ${plans.length}

Write a friendly weekly report with these sections:
## 📊 This Week's Summary
## 💪 Strengths
## 🎯 Areas to Improve
## 📈 Key Insights
## 🚀 Next Week's Recommendations (3-4 specific goals)

End with a motivating one-line message. Keep it personal, specific, and concise.`;

      const stream = await ai.models.generateContentStream({
        model: "gemini-2.5-flash",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: { maxOutputTokens: 2048 },
      });

      for await (const chunk of stream) {
        if (chunk.text) res.write(`data: ${JSON.stringify({ type: "chunk", content: chunk.text })}\n\n`);
      }

    } else if (mode === "mind-map") {
      const { topic } = req.body as { mode: string; topic: string };
      if (!topic) {
        res.status(400).json({ error: "topic is required for mind-map mode" });
        return;
      }

      const prompt = `Generate a mind map structure for the topic: "${topic}"

Return ONLY a JSON object in this exact format (no markdown):
{
  "center": "${topic}",
  "branches": [
    {
      "label": "Main Concept 1",
      "color": "#6366f1",
      "children": ["Sub-topic A", "Sub-topic B", "Sub-topic C"]
    },
    {
      "label": "Main Concept 2", 
      "color": "#f59e0b",
      "children": ["Sub-topic A", "Sub-topic B"]
    }
  ]
}

Create 5-7 main branches with 2-4 children each. Use educational, meaningful labels. Use varied hex colors for visual interest. Return ONLY the JSON.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: { maxOutputTokens: 2048 },
      });

      let text = response.text ?? "{}";
      text = text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
      res.write(`data: ${JSON.stringify({ type: "mind-map", data: JSON.parse(text) })}\n\n`);

    } else if (mode === "adaptive-plan") {
      const { planId } = req.body as { mode: string; planId: number };
      const [sessions, quizzes] = await Promise.all([
        db.select().from(studySessionsTable).orderBy(desc(studySessionsTable.createdAt)),
        db.select().from(quizzesTable).orderBy(desc(quizzesTable.createdAt)),
      ]);

      const recentTopics = sessions.slice(0, 10).map(s => s.topic);
      const lowScoreTopics = quizzes.filter(q => q.lastScore != null && (q.lastScore as number) < 70).map(q => q.topic);

      const prompt = `You are an adaptive learning coach. Update a student's study focus based on their progress:

Recent study topics: ${recentTopics.join(", ") || "none"}
Struggling topics (quiz score < 70%): ${lowScoreTopics.join(", ") || "none"}

Provide an **Adaptive Study Recommendation** with:
1. **Topics to Prioritize This Week** (based on weaknesses)
2. **Topics You Can Skip/Reduce** (already strong)
3. **Suggested Daily Schedule Adjustment** 
4. **Catch-Up Plan** (if any topics were missed)
5. **Motivational Note**

Be specific and practical. Use bullet points.`;

      const stream = await ai.models.generateContentStream({
        model: "gemini-2.5-flash",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: { maxOutputTokens: 2048 },
      });

      for await (const chunk of stream) {
        if (chunk.text) res.write(`data: ${JSON.stringify({ type: "chunk", content: chunk.text })}\n\n`);
      }
    }

  } catch (err) {
    req.log.error({ err }, "Insights analysis error");
    res.write(`data: ${JSON.stringify({ type: "error", content: "Analysis failed. Please try again." })}\n\n`);
  }

  res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
  res.end();
});

export default router;

import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, flashcardSetsTable, flashcardsTable, activityLogTable } from "@workspace/db";
import {
  CreateFlashcardSetBody,
  GetFlashcardSetParams,
  UpdateFlashcardStatusParams,
  UpdateFlashcardStatusBody,
} from "@workspace/api-zod";
import { ai } from "@workspace/integrations-gemini-ai";

const router: IRouter = Router();

router.get("/flashcards", async (_req, res): Promise<void> => {
  const sets = await db.select().from(flashcardSetsTable).orderBy(flashcardSetsTable.createdAt);
  const result = await Promise.all(
    sets.map(async (set) => {
      const cards = await db.select().from(flashcardsTable).where(eq(flashcardsTable.setId, set.id));
      return {
        ...set,
        cards,
        totalCards: cards.length,
        learnedCards: cards.filter((c) => c.isLearned).length,
      };
    }),
  );
  res.json(result);
});

router.post("/flashcards", async (req, res): Promise<void> => {
  const parsed = CreateFlashcardSetBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { title, topic, cardCount } = parsed.data;

  const prompt = `Generate ${cardCount} educational flashcards about "${topic}" for students.

Return a JSON array (no markdown):
[
  {
    "front": "What is...?",
    "back": "It is... [concise, clear explanation]"
  }
]

Make fronts clear questions or terms. Make backs concise, memorable answers.
Cover the most important concepts of the topic.
Return ONLY the JSON array.`;

  let cardData: Array<{ front: string; back: string }> = [];
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: { maxOutputTokens: 8192 },
    });
    let text = response.text ?? "[]";
    text = text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
    cardData = JSON.parse(text);
  } catch (err) {
    req.log.error({ err }, "Gemini error generating flashcards");
    cardData = [
      { front: `What is ${topic}?`, back: `${topic} is an important concept in this field.` },
    ];
  }

  const [set] = await db.insert(flashcardSetsTable).values({ title, topic }).returning();

  const cards = await db
    .insert(flashcardsTable)
    .values(cardData.map((c) => ({ setId: set.id, front: c.front, back: c.back })))
    .returning();

  await db.insert(activityLogTable).values({
    type: "flashcards",
    description: `Created flashcard set: ${title}`,
  });

  res.status(201).json({
    ...set,
    cards,
    totalCards: cards.length,
    learnedCards: 0,
  });
});

router.get("/flashcards/:id", async (req, res): Promise<void> => {
  const params = GetFlashcardSetParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [set] = await db
    .select()
    .from(flashcardSetsTable)
    .where(eq(flashcardSetsTable.id, params.data.id));

  if (!set) {
    res.status(404).json({ error: "Flashcard set not found" });
    return;
  }

  const cards = await db
    .select()
    .from(flashcardsTable)
    .where(eq(flashcardsTable.setId, set.id));

  res.json({
    ...set,
    cards,
    totalCards: cards.length,
    learnedCards: cards.filter((c) => c.isLearned).length,
  });
});

router.patch("/flashcards/:id/cards/:cardId/status", async (req, res): Promise<void> => {
  const params = UpdateFlashcardStatusParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = UpdateFlashcardStatusBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const updateData: { isLearned?: boolean; isBookmarked?: boolean } = {};
  if (body.data.isLearned !== undefined) updateData.isLearned = body.data.isLearned;
  if (body.data.isBookmarked !== undefined) updateData.isBookmarked = body.data.isBookmarked;

  const [card] = await db
    .update(flashcardsTable)
    .set(updateData)
    .where(
      and(
        eq(flashcardsTable.id, params.data.cardId),
        eq(flashcardsTable.setId, params.data.id),
      ),
    )
    .returning();

  if (!card) {
    res.status(404).json({ error: "Flashcard not found" });
    return;
  }

  res.json(card);
});

export default router;

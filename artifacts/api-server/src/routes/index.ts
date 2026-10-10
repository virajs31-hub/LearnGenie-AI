import { Router, type IRouter } from "express";
import healthRouter from "./health";
import dashboardRouter from "./dashboard";
import studyPlansRouter from "./study-plans";
import quizzesRouter from "./quizzes";
import flashcardsRouter from "./flashcards";
import progressRouter from "./progress";
import chatRouter from "./chat";
import notesRouter from "./notes";
import insightsRouter from "./insights";

const router: IRouter = Router();

router.use(healthRouter);
router.use(dashboardRouter);
router.use(studyPlansRouter);
router.use(quizzesRouter);
router.use(flashcardsRouter);
router.use(progressRouter);
router.use(chatRouter);
router.use(notesRouter);
router.use(insightsRouter);

export default router;

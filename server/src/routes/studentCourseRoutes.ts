import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import { requireStudent } from "../middleware/requireRole";
import { asyncHandler } from "../utils/asyncHandler";
import { completeStudentLesson, getStudentPracticeHistory, getStudentQuizHistory, getStudentXpHistory, listPublishedStudentCourses, saveStudentPractice, submitStudentQuiz } from "../controllers/courseController";

const router = Router();
router.use(authenticate, asyncHandler(requireStudent));
router.get("/", asyncHandler(listPublishedStudentCourses));
router.get("/xp-history", asyncHandler(getStudentXpHistory));
router.get("/practice-history", asyncHandler(getStudentPracticeHistory));
router.get("/quiz-history", asyncHandler(getStudentQuizHistory));
router.post("/:courseId/lessons/:lessonId/complete", asyncHandler(completeStudentLesson));
router.post("/:courseId/lessons/:lessonId/practice", asyncHandler(saveStudentPractice));
router.post("/:courseId/lessons/:lessonId/quiz", asyncHandler(submitStudentQuiz));
export default router;

import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import { requireStudent } from "../middleware/requireRole";
import { asyncHandler } from "../utils/asyncHandler";
import { completeStudentLesson, getStudentXpHistory, listPublishedStudentCourses, saveStudentPractice } from "../controllers/courseController";

const router = Router();
router.use(authenticate, asyncHandler(requireStudent));
router.get("/", asyncHandler(listPublishedStudentCourses));
router.get("/xp-history", asyncHandler(getStudentXpHistory));
router.post("/:courseId/lessons/:lessonId/complete", asyncHandler(completeStudentLesson));
router.post("/:courseId/lessons/:lessonId/practice", asyncHandler(saveStudentPractice));
export default router;

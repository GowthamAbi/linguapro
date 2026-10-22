import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import { requireStudent } from "../middleware/requireRole";
import { requirePremium } from "../middleware/requirePremium";
import { asyncHandler } from "../utils/asyncHandler";
import { completeStudentLesson, getStudentXpHistory, listPublishedStudentCourses } from "../controllers/courseController";

const router = Router();
router.use(authenticate, asyncHandler(requireStudent), asyncHandler(requirePremium));
router.get("/", asyncHandler(listPublishedStudentCourses));
router.get("/xp-history", asyncHandler(getStudentXpHistory));
router.post("/:courseId/lessons/:lessonId/complete", asyncHandler(completeStudentLesson));
export default router;

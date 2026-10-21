import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import { requireTeacher } from "../middleware/requireRole";
import { asyncHandler } from "../utils/asyncHandler";
import { createCourse, getTeacherCourseProgress, listTeacherCourses, updateCourse } from "../controllers/courseController";

const router = Router();
router.use(authenticate, asyncHandler(requireTeacher));
router.get("/", asyncHandler(listTeacherCourses));
router.get("/progress", asyncHandler(getTeacherCourseProgress));
router.post("/", asyncHandler(createCourse));
router.put("/:courseId", asyncHandler(updateCourse));
export default router;

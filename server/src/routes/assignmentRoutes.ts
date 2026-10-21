import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import { requireStudent, requireTeacher } from "../middleware/requireRole";
import { asyncHandler } from "../utils/asyncHandler";
import { createAssignment, gradeSubmission, listStudentAssignments, listTeacherAssignments, submitAssignment, teacherStudents } from "../controllers/assignmentController";

const router = Router();
router.use(authenticate);
router.get("/teacher/students", requireTeacher, asyncHandler(teacherStudents));
router.get("/teacher/assignments", requireTeacher, asyncHandler(listTeacherAssignments));
router.post("/teacher/assignments", requireTeacher, asyncHandler(createAssignment));
router.post("/teacher/assignments/:assignmentId/grade", requireTeacher, asyncHandler(gradeSubmission));
router.get("/student/assignments", requireStudent, asyncHandler(listStudentAssignments));
router.post("/student/assignments/:assignmentId/submit", requireStudent, asyncHandler(submitAssignment));
export default router;

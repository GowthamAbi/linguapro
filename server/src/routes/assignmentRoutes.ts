import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import { requireStudent, requireTeacher } from "../middleware/requireRole";
import { asyncHandler } from "../utils/asyncHandler";
import { createAssignment, gradeSubmission, listStudentAssignments, listTeacherAssignments, submitAssignment, teacherStudents } from "../controllers/assignmentController";

const router = Router();
router.use(authenticate);
router.get("/teacher/students", asyncHandler(requireTeacher), asyncHandler(teacherStudents));
router.get("/teacher/assignments", asyncHandler(requireTeacher), asyncHandler(listTeacherAssignments));
router.post("/teacher/assignments", asyncHandler(requireTeacher), asyncHandler(createAssignment));
router.post("/teacher/assignments/:assignmentId/grade", asyncHandler(requireTeacher), asyncHandler(gradeSubmission));
router.get("/student/assignments", asyncHandler(requireStudent), asyncHandler(listStudentAssignments));
router.post("/student/assignments/:assignmentId/submit", asyncHandler(requireStudent), asyncHandler(submitAssignment));
export default router;

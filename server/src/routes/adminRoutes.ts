import { Router } from "express";
import { listRecentActivity, listUsers, overview } from "../controllers/adminController";
import { requireOwner } from "../middleware/requireOwner";
import { authenticate } from "../middleware/authenticate";
import { asyncHandler } from "../utils/asyncHandler";
import { createTeacher, listTeachers } from "../controllers/teacherAdminController";

const router = Router();
router.use(authenticate, asyncHandler(requireOwner));
router.get("/overview", asyncHandler(overview));
router.get("/users", asyncHandler(listUsers));
router.get("/activity", asyncHandler(listRecentActivity));
router.get("/teachers", asyncHandler(listTeachers));
router.post("/teachers", asyncHandler(createTeacher));
export default router;

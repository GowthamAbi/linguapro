import { Router } from "express";
import { getLearningPathState, updateLearningPathState } from "../controllers/learningPathController";
import { authenticate } from "../middleware/authenticate";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();
router.use(authenticate);
router.get("/", asyncHandler(getLearningPathState));
router.patch("/", asyncHandler(updateLearningPathState));

export default router;

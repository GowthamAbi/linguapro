import { Router } from "express";
import { completeTask, getProgress, recordSpeakingActivity } from "../controllers/progressController";
import { authenticate } from "../middleware/authenticate";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();
router.use(authenticate);
router.get("/", asyncHandler(getProgress));
router.post("/complete", asyncHandler(completeTask));
router.post("/speaking-session", asyncHandler(recordSpeakingActivity));

export default router;
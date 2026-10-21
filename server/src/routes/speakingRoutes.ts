import { Router } from "express";
import { evaluateSpeaking } from "../controllers/speakingController";
import { authenticate } from "../middleware/authenticate";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();
router.use(authenticate);
router.post("/feedback", asyncHandler(evaluateSpeaking));

export default router;

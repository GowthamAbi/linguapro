import { Router } from "express";
import { completeTask, getProgress } from "../controllers/progressController";
import { authenticate } from "../middleware/authenticate";
import { requirePremium } from "../middleware/requirePremium";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();
router.use(authenticate, asyncHandler(requirePremium));
router.get("/", asyncHandler(getProgress));
router.post("/complete", asyncHandler(completeTask));

export default router;
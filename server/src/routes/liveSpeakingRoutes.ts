import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import { asyncHandler } from "../utils/asyncHandler";
import { createLiveSpeakingTurn, getLiveSpeakingReport } from "../controllers/liveSpeakingController";
const router = Router();
router.use(authenticate);
router.post("/turn", asyncHandler(createLiveSpeakingTurn));
router.get("/report", asyncHandler(getLiveSpeakingReport));
export default router;

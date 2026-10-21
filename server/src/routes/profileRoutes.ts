import { Router } from "express";
import { getProfile, updateProfile } from "../controllers/profileController";
import { authenticate } from "../middleware/authenticate";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();
router.use(authenticate);
router.get("/", asyncHandler(getProfile));
router.patch("/", asyncHandler(updateProfile));

export default router;
import { Router } from "express";
import { listRecentActivity, listUsers, overview } from "../controllers/adminController";
import { requireOwner } from "../middleware/requireOwner";
import { authenticate } from "../middleware/authenticate";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();
router.use(authenticate, asyncHandler(requireOwner));
router.get("/overview", asyncHandler(overview));
router.get("/users", asyncHandler(listUsers));
router.get("/activity", asyncHandler(listRecentActivity));
export default router;

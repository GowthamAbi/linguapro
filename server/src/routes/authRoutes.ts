import { Router } from "express";
import { currentUser, login, logout, register } from "../controllers/authController";
import { authenticate } from "../middleware/authenticate";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.post("/register", asyncHandler(register));
router.post("/login", asyncHandler(login));
router.post("/logout", logout);
router.get("/me", authenticate, asyncHandler(currentUser));

export default router;
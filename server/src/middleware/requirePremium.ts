import type { NextFunction, Response } from "express";
import type { AuthenticatedRequest } from "./authenticate";
import { User } from "../models/User";

export async function requirePremium(request: AuthenticatedRequest, response: Response, next: NextFunction): Promise<void> {
  const user = await User.findById(request.userId).select("plan");
  if (!user) {
    response.status(401).json({ message: "Please sign in to continue." });
    return;
  }
  if (user.plan !== "Premium") {
    response.status(403).json({
      code: "PREMIUM_REQUIRED",
      message: "This feature is available with LinguaPro Premium. Upgrade your account to continue.",
    });
    return;
  }
  next();
}

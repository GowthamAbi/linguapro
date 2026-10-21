import type { NextFunction, Response } from "express";
import type { AuthenticatedRequest } from "./authenticate";
import { User } from "../models/User";

export async function requireOwner(request: AuthenticatedRequest, response: Response, next: NextFunction): Promise<void> {
  const ownerEmail = process.env.OWNER_EMAIL?.trim().toLowerCase();
  if (!ownerEmail) {
    response.status(503).json({ message: "Owner access is not configured. Set OWNER_EMAIL in Render." });
    return;
  }
  const user = await User.findById(request.userId).select("email");
  if (!user || user.email.toLowerCase() !== ownerEmail) {
    response.status(403).json({ message: "Owner access only." });
    return;
  }
  next();
}

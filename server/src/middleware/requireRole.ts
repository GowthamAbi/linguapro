import type { NextFunction, Response } from "express";
import type { AuthenticatedRequest } from "./authenticate";
import { User } from "../models/User";

export async function requireTeacher(request: AuthenticatedRequest, response: Response, next: NextFunction): Promise<void> {
  const user = await User.findById(request.userId).select("role email");
  if (!user || user.role !== "teacher" || user.email === process.env.OWNER_EMAIL?.trim().toLowerCase()) {
    response.status(403).json({ message: "Teacher access only." });
    return;
  }
  next();
}

export async function requireStudent(request: AuthenticatedRequest, response: Response, next: NextFunction): Promise<void> {
  const user = await User.findById(request.userId).select("role email");
  if (!user || user.role === "teacher" || user.email === process.env.OWNER_EMAIL?.trim().toLowerCase()) {
    response.status(403).json({ message: "Student access only." });
    return;
  }
  next();
}

import type { Response } from "express";
import type { AuthenticatedRequest } from "../middleware/authenticate";
import { User } from "../models/User";
import { LearningProgress } from "../models/LearningProgress";

export async function overview(_request: AuthenticatedRequest, response: Response): Promise<void> {
  const [totalUsers, premiumUsers, activeLearners, totalXp] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ plan: "Premium" }),
    User.countDocuments({ totalXp: { $gt: 0 } }),
    User.aggregate([{ $group: { _id: null, total: { $sum: "$totalXp" } } }]),
  ]);
  response.json({ data: { totalUsers, premiumUsers, freeUsers: totalUsers - premiumUsers, activeLearners, totalXp: totalXp[0]?.total ?? 0 } });
}

export async function listUsers(request: AuthenticatedRequest, response: Response): Promise<void> {
  const studentsOnly = request.query.type === "students";
  const filter = studentsOnly ? { totalXp: { $gt: 0 } } : {};
  const users = await User.find(filter).sort({ createdAt: -1 }).select("name email plan targetLanguage level totalXp currentStreak createdAt lastActiveDate").limit(500).lean();
  response.json({ data: { users } });
}

export async function listRecentActivity(_request: AuthenticatedRequest, response: Response): Promise<void> {
  const activity = await LearningProgress.find().sort({ createdAt: -1 }).limit(20).populate("userId", "name email").lean();
  response.json({ data: { activity } });
}

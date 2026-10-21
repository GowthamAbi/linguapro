import type { Response } from "express";
import { z } from "zod";
import type { AuthenticatedRequest } from "../middleware/authenticate";
import { LearningProgress } from "../models/LearningProgress";
import { User } from "../models/User";

const taskRewards: Record<string, number> = { words: 10, speak: 15, listen: 10, review: 5 };
const taskSchema = z.object({ taskId: z.enum(["words", "speak", "listen", "review"]) });
const todayDate = (): string => new Date().toISOString().slice(0, 10);

export async function getProgress(
  request: AuthenticatedRequest,
  response: Response,
): Promise<void> {
  const today = todayDate();
  const history = await LearningProgress.find({ userId: request.userId }).sort({ createdAt: -1 }).limit(100);
  const user = await User.findById(request.userId).select("totalXp currentStreak lastActiveDate");

  response.json({
    data: {
      totalXp: user?.totalXp ?? 0,
      currentStreak: user?.currentStreak ?? 0,
      today,
      completedToday: history.filter((item) => item.completedOn === today),
      history,
    },
  });
}

export async function completeTask(
  request: AuthenticatedRequest,
  response: Response,
): Promise<void> {
  const parsed = taskSchema.safeParse(request.body);

  if (!parsed.success) {
    response.status(400).json({ message: "Choose a valid learning task." });
    return;
  }

  const today = todayDate();
  const xpEarned = taskRewards[parsed.data.taskId];

  try {
    const progress = await LearningProgress.create({
      userId: request.userId,
      taskId: parsed.data.taskId,
      completedOn: today,
      xpEarned,
    });

    const user = await User.findById(request.userId);

    if (!user) {
      response.status(404).json({ message: "Account not found." });
      return;
    }

    user.totalXp = Number(user.totalXp) + xpEarned;

    if (user.lastActiveDate !== today) {
      const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
      user.currentStreak = user.lastActiveDate === yesterday ? Number(user.currentStreak) + 1 : 1;
      user.lastActiveDate = today;
    }

    await user.save();

    response.status(201).json({
      message: "Task completed. Well done!",
      data: { progress, totalXp: user.totalXp, currentStreak: user.currentStreak },
    });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === 11000) {
      response.status(409).json({ message: "This task is already completed today." });
      return;
    }

    throw error;
  }
}
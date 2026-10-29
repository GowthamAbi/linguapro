import type { Response } from "express";
import { z } from "zod";
import type { AuthenticatedRequest } from "../middleware/authenticate";
import { LearningProgress } from "../models/LearningProgress";
import { User } from "../models/User";
import { XpEvent } from "../models/XpEvent";
import { SpeakingActivity } from "../models/SpeakingActivity";
import { LearningPathState } from "../models/LearningPathState";

const taskRewards: Record<string, number> = { words: 10, speak: 15, listen: 10, review: 5 };
const taskSchema = z.object({ taskId: z.enum(["words", "speak", "listen", "review"]) });
const todayDate = (): string => new Date().toISOString().slice(0, 10);

export async function getProgress(
  request: AuthenticatedRequest,
  response: Response,
): Promise<void> {
  const today = todayDate();
  const [history, user, speakingToday, speakingHistory, learningPath] = await Promise.all([
    LearningProgress.find({ userId: request.userId }).sort({ createdAt: -1 }).limit(100),
    User.findById(request.userId).select("totalXp currentStreak lastActiveDate"),
    SpeakingActivity.findOne({ userId: request.userId, activityDate: today }),
    SpeakingActivity.find({ userId: request.userId }).sort({ activityDate: -1 }).limit(60),
    LearningPathState.findOne({ userId: request.userId }).select("completedLessonIds").lean(),
  ]);

  response.json({
    data: {
      totalXp: user?.totalXp ?? 0,
      currentStreak: user?.currentStreak ?? 0,
      today,
      completedToday: history.filter((item) => item.completedOn === today),
      speakingSecondsToday: speakingToday?.speakingSeconds ?? 0,
      speakingHistory,
      completedLessonIds: learningPath?.completedLessonIds ?? [],
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
    await XpEvent.create({ userId: request.userId, source: parsed.data.taskId, sourceId: String(progress._id), label: parsed.data.taskId.charAt(0).toUpperCase() + parsed.data.taskId.slice(1) + " practice", xpEarned, earnedOn: today });

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


const lessonCompletionSchema = z.object({
  lessonId: z.string().regex(/^(basic|intermediate|advanced)-[1-5]$/),
  lessonTitle: z.string().trim().min(1).max(120),
});

export async function completeLesson(
  request: AuthenticatedRequest,
  response: Response,
): Promise<void> {
  const parsed = lessonCompletionSchema.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ message: "Provide a valid lesson to complete." });
    return;
  }

  const { lessonId, lessonTitle } = parsed.data;
  const today = todayDate();
  const xpEarned = 20;

  try {
    await XpEvent.create({
      userId: request.userId,
      source: "course-lesson",
      sourceId: lessonId,
      label: lessonTitle + " completed",
      xpEarned,
      earnedOn: today,
    });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === 11000) {
      const user = await User.findById(request.userId).select("totalXp");
      response.status(200).json({
        message: "This lesson was already recorded.",
        data: { lessonId, xpEarned: 0, totalXp: user?.totalXp ?? 0, alreadyCompleted: true },
      });
      return;
    }
    throw error;
  }

  const user = await User.findByIdAndUpdate(
    request.userId,
    { $inc: { totalXp: xpEarned } },
    { new: true, runValidators: true },
  ).select("totalXp");

  if (!user) {
    response.status(404).json({ message: "Account not found." });
    return;
  }

  await LearningPathState.findOneAndUpdate(
    { userId: request.userId },
    { $addToSet: { completedLessonIds: lessonId }, $setOnInsert: { userId: request.userId } },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
  );

  response.status(201).json({
    message: "Lesson completed and XP saved.",
    data: { lessonId, xpEarned, totalXp: user.totalXp, alreadyCompleted: false },
  });
}

const speakingSessionSchema = z.object({
  durationSeconds: z.number().int().min(1).max(3600),
  phrasesCompleted: z.number().int().min(1).max(50),
  attempts: z.number().int().min(1).max(200),
});

export async function recordSpeakingActivity(
  request: AuthenticatedRequest,
  response: Response,
): Promise<void> {
  const parsed = speakingSessionSchema.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ message: "Provide a valid completed speaking session." });
    return;
  }

  const today = todayDate();
  const activity = await SpeakingActivity.findOneAndUpdate(
    { userId: request.userId, activityDate: today },
    {
      $inc: {
        speakingSeconds: parsed.data.durationSeconds,
        sessionsCompleted: 1,
        phrasesCompleted: parsed.data.phrasesCompleted,
        attempts: parsed.data.attempts,
      },
      $setOnInsert: { userId: request.userId, activityDate: today },
    },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
  );

  response.status(201).json({
    message: "Speaking practice time saved.",
    data: {
      speakingSecondsToday: activity?.speakingSeconds ?? 0,
      sessionsCompleted: activity?.sessionsCompleted ?? 0,
      phrasesCompleted: activity?.phrasesCompleted ?? 0,
      attempts: activity?.attempts ?? 0,
    },
  });
}

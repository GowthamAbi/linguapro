import type { Response } from "express";
import { z } from "zod";
import type { AuthenticatedRequest } from "../middleware/authenticate";
import { LearningPathState } from "../models/LearningPathState";
import { User } from "../models/User";

const learningPathSchema = z.object({
  placementLevel: z.enum(["Basic", "Intermediate", "Advanced"]).optional(),
  placementScore: z.number().int().min(0).max(15).optional(),
  completedLessonIds: z.array(z.string().regex(/^(basic|intermediate|advanced)-[1-5]$/)).max(15).optional(),
}).refine((value) => Object.keys(value).length > 0, { message: "Provide at least one learning progress field." });

export async function getLearningPathState(request: AuthenticatedRequest, response: Response): Promise<void> {
  const state = await LearningPathState.findOne({ userId: request.userId }).lean();
  response.json({ data: state ? {
    placementLevel: state.placementLevel,
    placementScore: state.placementScore,
    completedLessonIds: state.completedLessonIds,
  } : null });
}

export async function updateLearningPathState(request: AuthenticatedRequest, response: Response): Promise<void> {
  const parsed = learningPathSchema.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ message: "Please provide valid placement and learning progress data." });
    return;
  }
  const update: Record<string, unknown> = {};
  if (parsed.data.placementLevel !== undefined) update.placementLevel = parsed.data.placementLevel;
  if (parsed.data.placementScore !== undefined) update.placementScore = parsed.data.placementScore;
  if (parsed.data.completedLessonIds !== undefined) update.completedLessonIds = [...new Set(parsed.data.completedLessonIds)];

  const state = await LearningPathState.findOneAndUpdate(
    { userId: request.userId },
    { $set: update, $setOnInsert: { userId: request.userId } },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
  );
  if (parsed.data.placementLevel) {
    await User.findByIdAndUpdate(request.userId, { $set: { level: parsed.data.placementLevel } }, { runValidators: true });
  }
  response.json({ message: "Learning progress saved.", data: {
    placementLevel: state.placementLevel,
    placementScore: state.placementScore,
    completedLessonIds: state.completedLessonIds,
  } });
}

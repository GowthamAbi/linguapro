import type { Response } from "express";
import { z } from "zod";
import type { AuthenticatedRequest } from "../middleware/authenticate";
import { User } from "../models/User";

const profileSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  nativeLanguage: z.enum(["Tamil", "English", "Malayalam", "Hindi", "Kannada", "Telugu"]).optional(),
  targetLanguage: z.enum(["Tamil", "English", "Malayalam", "Hindi", "Kannada", "Telugu"]).optional(),
  level: z.enum(["Basic", "Intermediate", "Advanced"]).optional(),
});

export async function getProfile(
  request: AuthenticatedRequest,
  response: Response,
): Promise<void> {
  const user = await User.findById(request.userId);

  if (!user) {
    response.status(404).json({ message: "Account not found." });
    return;
  }

  response.json({ data: { user: user.toJSON() } });
}

export async function updateProfile(
  request: AuthenticatedRequest,
  response: Response,
): Promise<void> {
  const parsed = profileSchema.safeParse(request.body);

  if (!parsed.success || Object.keys(parsed.data ?? {}).length === 0) {
    response.status(400).json({ message: "Provide valid profile fields to update." });
    return;
  }

  const user = await User.findByIdAndUpdate(
    request.userId,
    { $set: parsed.data },
    { new: true, runValidators: true },
  );

  if (!user) {
    response.status(404).json({ message: "Account not found." });
    return;
  }

  response.json({ message: "Profile updated.", data: { user: user.toJSON() } });
}
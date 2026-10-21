import bcrypt from "bcryptjs";
import type { Response } from "express";
import { z } from "zod";
import type { AuthenticatedRequest } from "../middleware/authenticate";
import { User } from "../models/User";

const createTeacherSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(254),
  password: z.string().min(8).max(72),
});

export async function createTeacher(request: AuthenticatedRequest, response: Response): Promise<void> {
  const parsed = createTeacherSchema.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ message: "Enter a valid name, email, and temporary password of at least 8 characters." });
    return;
  }

  const email = parsed.data.email.toLowerCase();
  if (email === process.env.OWNER_EMAIL?.trim().toLowerCase()) {
    response.status(400).json({ message: "The owner account cannot be created as a teacher." });
    return;
  }
  if (await User.findOne({ email })) {
    response.status(409).json({ message: "An account with this email already exists." });
    return;
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  const teacher = await User.create({
    name: parsed.data.name,
    email,
    passwordHash,
    role: "teacher",
    plan: "Premium",
  });
  response.status(201).json({ message: "Teacher account created successfully.", data: { teacher: teacher.toJSON() } });
}

export async function listTeachers(_request: AuthenticatedRequest, response: Response): Promise<void> {
  const teachers = await User.find({ role: "teacher" })
    .sort({ createdAt: -1 })
    .select("name email plan createdAt")
    .lean();
  response.json({ data: { teachers } });
}

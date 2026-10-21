import type { Response } from "express";
import { z } from "zod";
import mongoose from "mongoose";
import type { AuthenticatedRequest } from "../middleware/authenticate";
import { Course } from "../models/Course";

const lessonSchema = z.object({
  title: z.string().trim().min(2).max(160),
  content: z.string().max(5000).optional().default(""),
  tamilMeaning: z.string().max(3000).optional().default(""),
  practiceType: z.enum(["reading", "speaking", "listening", "quiz", "roleplay"]).default("speaking"),
});
const moduleSchema = z.object({
  title: z.string().trim().min(2).max(160),
  lessons: z.array(lessonSchema).max(50).default([]),
});
const courseSchema = z.object({
  title: z.string().trim().min(3).max(160),
  description: z.string().trim().min(3).max(3000),
  learnerCategory: z.enum(["kids", "adults", "working-professionals", "job-seekers"]),
  level: z.enum(["Basic", "Intermediate", "Advanced"]),
  industry: z.enum(["general", "garments-textile", "it-software", "healthcare", "sales-customer-service", "other"]).default("general"),
  goal: z.enum(["daily-conversation", "manager-communication", "job-interview", "meeting-presentation", "grammar", "other"]).default("daily-conversation"),
  status: z.enum(["draft", "published"]).default("draft"),
  modules: z.array(moduleSchema).max(30).default([]),
});

export async function listTeacherCourses(request: AuthenticatedRequest, response: Response): Promise<void> {
  const courses = await Course.find({ teacherId: request.userId }).sort({ createdAt: -1 }).lean();
  response.json({ data: { courses } });
}

export async function createCourse(request: AuthenticatedRequest, response: Response): Promise<void> {
  const parsed = courseSchema.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ message: "Check the course details, category, level, and module/lesson fields." });
    return;
  }
  const course = await Course.create({ ...parsed.data, teacherId: request.userId });
  response.status(201).json({ message: "Course saved as " + course.status + ".", data: { course } });
}

export async function updateCourse(request: AuthenticatedRequest, response: Response): Promise<void> {
  if (!mongoose.isValidObjectId(request.params.courseId)) {
    response.status(400).json({ message: "Invalid course ID." });
    return;
  }
  const parsed = courseSchema.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ message: "Check the course details, category, level, and module/lesson fields." });
    return;
  }
  const course = await Course.findOneAndUpdate(
    { _id: request.params.courseId, teacherId: request.userId },
    { $set: parsed.data },
    { new: true, runValidators: true },
  );
  if (!course) {
    response.status(404).json({ message: "Course not found in your workspace." });
    return;
  }
  response.json({ message: "Course updated.", data: { course } });
}


export async function listPublishedStudentCourses(request: AuthenticatedRequest, response: Response): Promise<void> {
  const courses = await Course.find({ status: "published" })
    .select("title description learnerCategory level industry goal modules teacherId createdAt")
    .populate("teacherId", "name")
    .sort({ createdAt: -1 })
    .lean();
  response.json({ data: { courses } });
}

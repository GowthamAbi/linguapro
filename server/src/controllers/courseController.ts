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
  const [courses, enrollments] = await Promise.all([
    Course.find({ status: "published" })
      .select("title description learnerCategory level industry goal modules teacherId createdAt")
      .populate("teacherId", "name")
      .sort({ createdAt: -1 })
      .lean(),
    (await import("../models/CourseEnrollment")).CourseEnrollment.find({ studentId: request.userId }).lean(),
  ]);
  const progressByCourse = new Map(enrollments.map((item) => [String(item.courseId), item.completedLessonIds]));
  response.json({ data: { courses, progress: Object.fromEntries(progressByCourse) } });
}

export async function completeStudentLesson(request: AuthenticatedRequest, response: Response): Promise<void> {
  const { courseId, lessonId } = request.params;
  if (!mongoose.isValidObjectId(courseId) || !mongoose.isValidObjectId(lessonId)) {
    response.status(400).json({ message: "Invalid course or lesson ID." });
    return;
  }
  const course = await Course.findOne({ _id: courseId, status: "published" }).select("modules");
  if (!course) {
    response.status(404).json({ message: "Published course not found." });
    return;
  }
  const lessonExists = course.modules.some((module) => module.lessons.some((lesson) => String(lesson._id) === lessonId));
  if (!lessonExists) {
    response.status(404).json({ message: "Lesson not found in this course." });
    return;
  }
  const { CourseEnrollment } = await import("../models/CourseEnrollment");
  const { User } = await import("../models/User");
  const existing = await CourseEnrollment.findOne({ studentId: request.userId, courseId });
  const alreadyCompleted = Boolean(existing?.completedLessonIds.includes(lessonId));
  const enrollment = await CourseEnrollment.findOneAndUpdate(
    { studentId: request.userId, courseId },
    { $addToSet: { completedLessonIds: lessonId } },
    { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true },
  );
  const lessonCount = course.modules.reduce((sum, module) => sum + module.lessons.length, 0);
  const justCompletedCourse = lessonCount > 0 && enrollment.completedLessonIds.length >= lessonCount && !enrollment.completedAt;
  if (justCompletedCourse) {
    enrollment.completedAt = new Date();
    await enrollment.save();
  }
  const xpEarned = alreadyCompleted ? 0 : 10;
  const user = xpEarned > 0 ? await User.findByIdAndUpdate(request.userId, { $inc: { totalXp: xpEarned } }, { new: true }).select("totalXp") : await User.findById(request.userId).select("totalXp");
  response.json({
    message: alreadyCompleted ? "This lesson was already completed." : "Lesson completed! You earned " + xpEarned + " XP.",
    data: { completedLessonIds: enrollment.completedLessonIds, completedLessons: enrollment.completedLessonIds.length, totalLessons: lessonCount, courseCompleted: Boolean(enrollment.completedAt), xpEarned, totalXp: user?.totalXp ?? 0 },
  });
}


export async function getTeacherCourseProgress(request: AuthenticatedRequest, response: Response): Promise<void> {
  const courses = await Course.find({ teacherId: request.userId })
    .select("title status modules")
    .lean();
  const courseIds = courses.map((course) => course._id);
  const { CourseEnrollment } = await import("../models/CourseEnrollment");
  const enrollments = await CourseEnrollment.find({ courseId: { $in: courseIds } })
    .populate("studentId", "name email level")
    .populate("courseId", "title modules status")
    .sort({ updatedAt: -1 })
    .lean();
  const courseMap = new Map(courses.map((course) => [String(course._id), course]));
  const rows = enrollments.map((enrollment) => {
    const courseId = String(enrollment.courseId && typeof enrollment.courseId === "object" && "_id" in enrollment.courseId ? enrollment.courseId._id : enrollment.courseId);
    const course = courseMap.get(courseId);
    const totalLessons = course ? course.modules.reduce((sum, module) => sum + module.lessons.length, 0) : 0;
    const student = enrollment.studentId && typeof enrollment.studentId === "object" && "name" in enrollment.studentId
      ? enrollment.studentId as { _id: unknown; name: string; email: string; level?: string }
      : null;
    return {
      courseId,
      courseTitle: course?.title ?? "Course",
      studentId: student ? String(student._id) : "",
      studentName: student?.name ?? "Student",
      studentEmail: student?.email ?? "",
      studentLevel: student?.level ?? "",
      completedLessons: enrollment.completedLessonIds.length,
      totalLessons,
      completionPercent: totalLessons ? Math.min(100, Math.round(enrollment.completedLessonIds.length / totalLessons * 100)) : 0,
      courseCompleted: Boolean(enrollment.completedAt),
      completedAt: enrollment.completedAt,
      lastActivity: enrollment.updatedAt,
    };
  });
  response.json({
    data: {
      summary: {
        courses: courses.length,
        learners: new Set(rows.map((row) => row.studentId).filter(Boolean)).size,
        enrollments: rows.length,
        completedCourses: rows.filter((row) => row.courseCompleted).length,
      },
      rows,
    },
  });
}

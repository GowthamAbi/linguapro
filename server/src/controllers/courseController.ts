import type { Response } from "express";
import { z } from "zod";
import mongoose from "mongoose";
import type { AuthenticatedRequest } from "../middleware/authenticate";
import { Course } from "../models/Course";
import { User } from "../models/User";
import { CourseEnrollment } from "../models/CourseEnrollment";
import { XpEvent } from "../models/XpEvent";

const lessonSchema = z.object({
  title: z.string().trim().min(2).max(160),
  content: z.string().max(5000).optional().default(""),
  tamilMeaning: z.string().max(3000).optional().default(""),
  practiceType: z.enum(["reading", "speaking", "listening", "quiz", "roleplay"]).default("speaking"),
  quizQuestions: z.array(z.object({ question: z.string().trim().min(3).max(500), options: z.array(z.string().trim().min(1).max(200)).length(4), correctAnswerIndex: z.number().int().min(0).max(3), explanationTamil: z.string().max(1000).optional().default("") })).max(20).default([]),
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
    CourseEnrollment.find({ studentId: request.userId }).lean(),
  ]);
  const progressByCourse = new Map(enrollments.map((item) => [String(item.courseId), { completedLessonIds: item.completedLessonIds, completedAt: item.completedAt }]));
  response.json({ data: { courses, progress: Object.fromEntries(progressByCourse) } });
}

export async function completeStudentLesson(request: AuthenticatedRequest, response: Response): Promise<void> {
  const courseId = String(request.params.courseId);
  const lessonId = String(request.params.lessonId);
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
  if (xpEarned > 0) {
    const lesson = course.modules.flatMap((module) => module.lessons).find((item) => String(item._id) === lessonId);
    await XpEvent.create({ userId: request.userId, source: "course-lesson", sourceId: courseId + ":" + lessonId, label: lesson?.title ?? "Course lesson", xpEarned, earnedOn: new Date().toISOString().slice(0, 10) });
  }
  response.json({
    message: alreadyCompleted ? "This lesson was already completed." : "Lesson completed! You earned " + xpEarned + " XP.",
    data: { completedLessonIds: enrollment.completedLessonIds, completedLessons: enrollment.completedLessonIds.length, totalLessons: lessonCount, courseCompleted: Boolean(enrollment.completedAt), xpEarned, totalXp: user?.totalXp ?? 0 },
  });
}




export async function submitStudentQuiz(request: AuthenticatedRequest, response: Response): Promise<void> {
  const courseId = String(request.params.courseId);
  const lessonId = String(request.params.lessonId);
  if (!mongoose.isValidObjectId(courseId) || !mongoose.isValidObjectId(lessonId)) {
    response.status(400).json({ message: "Invalid course or lesson ID." });
    return;
  }
  const parsed = z.object({ answers: z.array(z.number().int().min(0).max(3)).max(20) }).safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ message: "Please submit valid quiz answers." });
    return;
  }
  const course = await Course.findOne({ _id: courseId, status: "published" }).select("modules");
  if (!course) {
    response.status(404).json({ message: "Published course not found." });
    return;
  }
  const lesson = course.modules.flatMap((module) => module.lessons).find((item) => String(item._id) === lessonId);
  if (!lesson) {
    response.status(404).json({ message: "Lesson not found in this course." });
    return;
  }
  const questions = (lesson as unknown as { quizQuestions?: { question: string; options: string[]; correctAnswerIndex: number; explanationTamil?: string }[] }).quizQuestions ?? [];
  if (lesson.practiceType !== "quiz" || questions.length === 0) {
    response.status(400).json({ message: "This lesson does not have quiz questions yet." });
    return;
  }
  if (parsed.data.answers.length !== questions.length) {
    response.status(400).json({ message: "Please answer every question before submitting." });
    return;
  }
  const results = questions.map((question, index) => ({
    question: question.question,
    options: question.options,
    selectedAnswerIndex: parsed.data.answers[index],
    correctAnswerIndex: question.correctAnswerIndex,
    isCorrect: parsed.data.answers[index] === question.correctAnswerIndex,
    explanationTamil: question.explanationTamil ?? "",
  }));
  const score = results.filter((item) => item.isCorrect).length;
  const percentage = Math.round(score / questions.length * 100);
  const enrollment = await CourseEnrollment.findOneAndUpdate(
    { studentId: request.userId, courseId },
    { $push: { quizAttempts: { lessonId, score, total: questions.length, percentage, submittedAt: new Date() } } },
    { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true },
  );
  const latestAttempt = enrollment.quizAttempts[enrollment.quizAttempts.length - 1];
  response.json({ data: { score, total: questions.length, percentage, results, attemptId: String(latestAttempt?._id ?? ""), submittedAt: latestAttempt?.submittedAt } });
}


export async function getStudentQuizHistory(request: AuthenticatedRequest, response: Response): Promise<void> {
  const enrollments = await CourseEnrollment.find({ studentId: request.userId, "quizAttempts.0": { $exists: true } })
    .populate("courseId", "title modules")
    .sort({ updatedAt: -1 })
    .lean();
  const entries = enrollments.flatMap((enrollment) => {
    const course = enrollment.courseId && typeof enrollment.courseId === "object" && "title" in enrollment.courseId
      ? enrollment.courseId as unknown as { title: string; modules?: { lessons?: { _id: unknown; title: string }[] }[] }
      : null;
    return (enrollment.quizAttempts ?? []).map((attempt) => {
      const lesson = course?.modules?.flatMap((module) => module.lessons ?? []).find((candidate) => String(candidate._id) === attempt.lessonId);
      return { _id: String(attempt._id ?? attempt.lessonId + ":" + new Date(attempt.submittedAt).getTime()), courseTitle: course?.title ?? "Course", lessonTitle: lesson?.title ?? "Quiz", score: attempt.score, total: attempt.total, percentage: attempt.percentage, submittedAt: attempt.submittedAt };
    });
  }).sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()).slice(0, 30);
  response.json({ data: { entries } });
}


export async function saveStudentPractice(request: AuthenticatedRequest, response: Response): Promise<void> {
  const courseId = String(request.params.courseId);
  const lessonId = String(request.params.lessonId);
  if (!mongoose.isValidObjectId(courseId) || !mongoose.isValidObjectId(lessonId)) {
    response.status(400).json({ message: "Invalid course or lesson ID." });
    return;
  }
  const parsed = z.object({
    response: z.string().trim().min(8, "Write at least one complete sentence.").max(5000),
  }).safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ message: parsed.error.issues[0]?.message ?? "Check your practice answer." });
    return;
  }
  const course = await Course.findOne({ _id: courseId, status: "published" }).select("modules");
  if (!course) {
    response.status(404).json({ message: "Published course not found." });
    return;
  }
  const lesson = course.modules.flatMap((module) => module.lessons).find((item) => String(item._id) === lessonId);
  if (!lesson) {
    response.status(404).json({ message: "Lesson not found in this course." });
    return;
  }
  const enrollment = await CourseEnrollment.findOneAndUpdate(
    { studentId: request.userId, courseId },
    { $push: { practiceResponses: { lessonId, response: parsed.data.response, practiceType: lesson.practiceType, submittedAt: new Date() } } },
    { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true },
  );
  response.status(201).json({
    message: "Practice answer saved.",
    data: {
      lessonId,
      response: parsed.data.response,
      practiceType: lesson.practiceType,
      submittedAt: enrollment.practiceResponses[enrollment.practiceResponses.length - 1]?.submittedAt,
    },
  });
}



export async function getStudentPracticeHistory(request: AuthenticatedRequest, response: Response): Promise<void> {
  const enrollments = await CourseEnrollment.find({ studentId: request.userId, "practiceResponses.0": { $exists: true } })
    .populate("courseId", "title modules")
    .sort({ updatedAt: -1 })
    .lean();
  const entries = enrollments.flatMap((enrollment) => {
    const course = enrollment.courseId && typeof enrollment.courseId === "object" && "title" in enrollment.courseId
      ? enrollment.courseId as unknown as { title: string; modules?: { lessons?: { _id: unknown; title: string }[] }[] }
      : null;
    return (enrollment.practiceResponses ?? []).map((item) => {
      const lesson = course?.modules?.flatMap((module) => module.lessons ?? []).find((candidate) => String(candidate._id) === item.lessonId);
      return {
        _id: String(item._id ?? item.lessonId + ":" + new Date(item.submittedAt).getTime()),
        courseTitle: course?.title ?? "Course",
        lessonTitle: lesson?.title ?? "Lesson",
        response: item.response,
        practiceType: item.practiceType,
        submittedAt: item.submittedAt,
      };
    });
  }).sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()).slice(0, 30);
  response.json({ data: { entries } });
}


export async function getTeacherCourseProgress(request: AuthenticatedRequest, response: Response): Promise<void> {
  const courses = await Course.find({ teacherId: request.userId })
    .select("title status modules")
    .lean();
  const courseIds = courses.map((course) => course._id);
  const enrollments = await CourseEnrollment.find({ courseId: { $in: courseIds } })
    .populate("studentId", "name email level totalXp")
    .populate("courseId", "title modules status")
    .sort({ updatedAt: -1 })
    .lean();
  const courseMap = new Map(courses.map((course) => [String(course._id), course]));
  const rows = enrollments.map((enrollment) => {
    const courseId = String(enrollment.courseId && typeof enrollment.courseId === "object" && "_id" in enrollment.courseId ? enrollment.courseId._id : enrollment.courseId);
    const course = courseMap.get(courseId);
    const totalLessons = course ? course.modules.reduce((sum, module) => sum + module.lessons.length, 0) : 0;
    const student = enrollment.studentId && typeof enrollment.studentId === "object" && "name" in enrollment.studentId
      ? enrollment.studentId as unknown as { _id: unknown; name: string; email?: string; level?: string; totalXp?: number }
      : null;
    return {
      courseId,
      courseTitle: course?.title ?? "Course",
      studentId: student ? String(student._id) : "",
      studentName: student?.name ?? "Student",
      studentEmail: student?.email ?? "",
      studentLevel: student?.level ?? "",
      studentTotalXp: student?.totalXp ?? 0,
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


export async function getStudentXpHistory(request: AuthenticatedRequest, response: Response): Promise<void> {
  const [events, user] = await Promise.all([
    XpEvent.find({ userId: request.userId }).sort({ createdAt: -1 }).limit(100).lean(),
    User.findById(request.userId).select("totalXp dailyXpGoal"),
  ]);
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const weekly = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(now);
    date.setUTCDate(now.getUTCDate() - (6 - index));
    const key = date.toISOString().slice(0, 10);
    return { date: key, day: date.toLocaleDateString("en", { weekday: "short", timeZone: "UTC" }), xp: events.filter((event) => event.earnedOn === key).reduce((sum, event) => sum + event.xpEarned, 0) };
  });
  const activeDates = new Set(events.map((event) => event.earnedOn).filter(Boolean));
  let streakDays = 0;
  const cursor = new Date(now);
  if (!activeDates.has(today)) cursor.setUTCDate(cursor.getUTCDate() - 1);
  while (activeDates.has(cursor.toISOString().slice(0, 10))) {
    streakDays += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  const todayXp = weekly.find((day) => day.date === today)?.xp ?? 0;
  response.json({ data: { events, weekly, totalXp: user?.totalXp ?? 0, dailyXpGoal: user?.dailyXpGoal ?? 20, todayXp, streakDays, activeDaysThisWeek: weekly.filter((day) => day.xp > 0).length } });
}

export async function updateStudentLearningGoal(request: AuthenticatedRequest, response: Response): Promise<void> {
  const parsed = z.object({ dailyXpGoal: z.number().int().refine((value) => [10, 20, 30, 50].includes(value)) }).safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ message: "Choose a daily goal of 10, 20, 30, or 50 XP." });
    return;
  }
  const user = await User.findByIdAndUpdate(request.userId, { $set: { dailyXpGoal: parsed.data.dailyXpGoal } }, { new: true }).select("dailyXpGoal");
  if (!user) {
    response.status(404).json({ message: "Student account not found." });
    return;
  }
  response.json({ message: "Daily learning goal saved.", data: { dailyXpGoal: user.dailyXpGoal } });
}

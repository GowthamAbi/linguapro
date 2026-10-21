import type { Response } from "express";
import { z } from "zod";
import mongoose from "mongoose";
import type { AuthenticatedRequest } from "../middleware/authenticate";
import { Assignment } from "../models/Assignment";
import { User } from "../models/User";

const createSchema = z.object({
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().min(3).max(3000),
  studentEmails: z.array(z.string().trim().email().max(254)).min(1).max(100),
  dueDate: z.string().datetime().optional().or(z.literal("")),
});
const submissionSchema = z.object({ answer: z.string().trim().min(1).max(5000) });
const gradeSchema = z.object({ studentId: z.string().min(1), feedback: z.string().trim().max(2000), score: z.number().min(0).max(100) });

export async function teacherStudents(request: AuthenticatedRequest, response: Response): Promise<void> {
  const assignments = await Assignment.find({ teacherId: request.userId }).select("studentIds").lean();
  const ids = [...new Set(assignments.flatMap((item) => item.studentIds.map(String)))];
  const students = ids.length ? await User.find({ _id: { $in: ids } }).select("name email targetLanguage level totalXp currentStreak").lean() : [];
  response.json({ data: { students } });
}

export async function createAssignment(request: AuthenticatedRequest, response: Response): Promise<void> {
  const parsed = createSchema.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ message: "Enter a title, description, and at least one valid student email." });
    return;
  }
  const emails = [...new Set(parsed.data.studentEmails.map((email) => email.toLowerCase()))];
  const students = await User.find({ email: { $in: emails }, $or: [{ role: "student" }, { role: { $exists: false } }] }).select("_id email").lean();
  const found = new Set(students.map((student) => student.email.toLowerCase()));
  const missing = emails.filter((email) => !found.has(email));
  if (missing.length) {
    response.status(400).json({ message: "These student accounts were not found: " + missing.join(", ") });
    return;
  }
  const assignment = await Assignment.create({
    teacherId: request.userId,
    title: parsed.data.title,
    description: parsed.data.description,
    studentIds: students.map((student) => student._id),
    ...(parsed.data.dueDate ? { dueDate: new Date(parsed.data.dueDate) } : {}),
  });
  response.status(201).json({ message: "Assignment created and assigned to " + students.length + " student(s).", data: { assignment } });
}

export async function listTeacherAssignments(request: AuthenticatedRequest, response: Response): Promise<void> {
  const assignments = await Assignment.find({ teacherId: request.userId })
    .sort({ createdAt: -1 })
    .populate("studentIds", "name email")
    .lean();
  response.json({ data: { assignments } });
}

export async function listStudentAssignments(request: AuthenticatedRequest, response: Response): Promise<void> {
  const assignments = await Assignment.find({ studentIds: new mongoose.Types.ObjectId(request.userId) })
    .sort({ createdAt: -1 })
    .populate("teacherId", "name email")
    .lean();
  const data = assignments.map((assignment) => {
    const submission = assignment.submissions?.find((item: { studentId: unknown }) => String(item.studentId) === request.userId);
    return { ...assignment, submissions: undefined, mySubmission: submission ? { answer: submission.answer, submittedAt: submission.submittedAt, feedback: submission.feedback, score: submission.score } : null };
  });
  response.json({ data: { assignments: data } });
}

export async function submitAssignment(request: AuthenticatedRequest, response: Response): Promise<void> {
  const parsed = submissionSchema.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ message: "Write an answer of up to 5,000 characters." });
    return;
  }
  const assignment = await Assignment.findOne({ _id: request.params.assignmentId, studentIds: request.userId });
  if (!assignment) {
    response.status(404).json({ message: "Assignment not found for your account." });
    return;
  }
  const existing = assignment.submissions.find((item) => String(item.studentId) === request.userId);
  if (existing) {
    existing.answer = parsed.data.answer;
    existing.submittedAt = new Date();
    existing.feedback = "";
    existing.score = undefined;
  } else {
    assignment.submissions.push({ studentId: new mongoose.Types.ObjectId(request.userId), answer: parsed.data.answer, submittedAt: new Date(), feedback: "" });
  }
  await assignment.save();
  response.json({ message: "Your answer has been submitted.", data: { submittedAt: new Date() } });
}

export async function gradeSubmission(request: AuthenticatedRequest, response: Response): Promise<void> {
  const parsed = gradeSchema.safeParse(request.body);
  if (!parsed.success || !mongoose.isValidObjectId(request.params.assignmentId) || !mongoose.isValidObjectId(parsed.data?.studentId ?? "")) {
    response.status(400).json({ message: "Provide a valid student, score, and feedback." });
    return;
  }
  const assignment = await Assignment.findOne({ _id: request.params.assignmentId, teacherId: request.userId });
  if (!assignment) {
    response.status(404).json({ message: "Assignment not found." });
    return;
  }
  const submission = assignment.submissions.find((item) => String(item.studentId) === parsed.data.studentId);
  if (!submission) {
    response.status(404).json({ message: "That student has not submitted this assignment yet." });
    return;
  }
  submission.feedback = parsed.data.feedback;
  submission.score = parsed.data.score;
  await assignment.save();
  response.json({ message: "Feedback saved.", data: { assignmentId: assignment.id, studentId: parsed.data.studentId } });
}

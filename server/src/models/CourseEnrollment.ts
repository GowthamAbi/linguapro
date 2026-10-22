import { Schema, model } from "mongoose";

const enrollmentSchema = new Schema({
  studentId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true, index: true },
  completedLessonIds: { type: [String], default: [] },
  completedAt: { type: Date, default: null },
  practiceResponses: { type: [{ lessonId: { type: String, required: true }, response: { type: String, required: true, maxlength: 5000 }, practiceType: { type: String, enum: ["reading", "speaking", "listening", "quiz", "roleplay"], required: true }, submittedAt: { type: Date, default: Date.now } }], default: [] },
  quizAttempts: { type: [{ lessonId: { type: String, required: true }, score: { type: Number, required: true, min: 0 }, total: { type: Number, required: true, min: 1 }, percentage: { type: Number, required: true, min: 0, max: 100 }, submittedAt: { type: Date, default: Date.now } }], default: [] },
}, { timestamps: true });

enrollmentSchema.index({ studentId: 1, courseId: 1 }, { unique: true });
export const CourseEnrollment = model("CourseEnrollment", enrollmentSchema);

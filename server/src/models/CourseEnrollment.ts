import { Schema, model } from "mongoose";

const enrollmentSchema = new Schema({
  studentId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true, index: true },
  completedLessonIds: { type: [String], default: [] },
  completedAt: { type: Date, default: null },
}, { timestamps: true });

enrollmentSchema.index({ studentId: 1, courseId: 1 }, { unique: true });
export const CourseEnrollment = model("CourseEnrollment", enrollmentSchema);

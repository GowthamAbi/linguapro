import { Schema, model } from "mongoose";

const lessonSchema = new Schema({
  title: { type: String, required: true, trim: true, minlength: 2, maxlength: 160 },
  content: { type: String, default: "", maxlength: 5000 },
  tamilMeaning: { type: String, default: "", maxlength: 3000 },
  practiceType: { type: String, enum: ["reading", "speaking", "listening", "quiz", "roleplay"], default: "speaking" },
  quizQuestions: { type: [{ question: { type: String, required: true, maxlength: 500 }, options: { type: [String], required: true, validate: (v: string[]) => v.length === 4 }, correctAnswerIndex: { type: Number, required: true, min: 0, max: 3 }, explanationTamil: { type: String, default: "", maxlength: 1000 } }], default: [] },
}, { _id: true });

const moduleSchema = new Schema({
  title: { type: String, required: true, trim: true, minlength: 2, maxlength: 160 },
  lessons: { type: [lessonSchema], default: [] },
}, { _id: true });

const courseSchema = new Schema({
  teacherId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  title: { type: String, required: true, trim: true, minlength: 3, maxlength: 160 },
  description: { type: String, required: true, trim: true, minlength: 3, maxlength: 3000 },
  learnerCategory: { type: String, enum: ["kids", "adults", "working-professionals", "job-seekers"], required: true },
  level: { type: String, enum: ["Basic", "Intermediate", "Advanced"], required: true },
  industry: { type: String, enum: ["general", "garments-textile", "it-software", "healthcare", "sales-customer-service", "other"], default: "general" },
  goal: { type: String, enum: ["daily-conversation", "manager-communication", "job-interview", "meeting-presentation", "grammar", "other"], default: "daily-conversation" },
  status: { type: String, enum: ["draft", "published"], default: "draft" },
  modules: { type: [moduleSchema], default: [] },
}, { timestamps: true });

courseSchema.index({ teacherId: 1, createdAt: -1 });
export const Course = model("Course", courseSchema);

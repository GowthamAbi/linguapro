import { Schema, model } from "mongoose";

const submissionSchema = new Schema({
  studentId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  answer: { type: String, required: true, maxlength: 5000 },
  submittedAt: { type: Date, default: Date.now },
  feedback: { type: String, default: "", maxlength: 2000 },
  score: { type: Number, min: 0, max: 100 },
}, { _id: false });

const assignmentSchema = new Schema({
  teacherId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  title: { type: String, required: true, trim: true, minlength: 3, maxlength: 120 },
  description: { type: String, required: true, trim: true, minlength: 3, maxlength: 3000 },
  studentIds: [{ type: Schema.Types.ObjectId, ref: "User", required: true }],
  dueDate: { type: Date },
  submissions: { type: [submissionSchema], default: [] },
}, { timestamps: true });

assignmentSchema.index({ teacherId: 1, createdAt: -1 });
export const Assignment = model("Assignment", assignmentSchema);

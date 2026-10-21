import { Schema, model } from "mongoose";

const learningProgressSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    taskId: { type: String, required: true, enum: ["words", "speak", "listen", "review"] },
    completedOn: { type: String, required: true },
    xpEarned: { type: Number, required: true, min: 0 },
  },
  { timestamps: true },
);

learningProgressSchema.index({ userId: 1, taskId: 1, completedOn: 1 }, { unique: true });

export const LearningProgress = model("LearningProgress", learningProgressSchema);
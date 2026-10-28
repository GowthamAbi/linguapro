import { Schema, model } from "mongoose";

const learningPathStateSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
  placementLevel: { type: String, enum: ["Basic", "Intermediate", "Advanced"], default: "Basic" },
  placementScore: { type: Number, min: 0, max: 15, default: 0 },
  completedLessonIds: { type: [String], default: [] },
}, { timestamps: true });

export const LearningPathState = model("LearningPathState", learningPathStateSchema);

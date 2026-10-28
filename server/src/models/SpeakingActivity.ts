import { Schema, model } from "mongoose";

const speakingActivitySchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  activityDate: { type: String, required: true },
  speakingSeconds: { type: Number, required: true, min: 0, default: 0 },
  sessionsCompleted: { type: Number, required: true, min: 0, default: 0 },
  phrasesCompleted: { type: Number, required: true, min: 0, default: 0 },
  attempts: { type: Number, required: true, min: 0, default: 0 },
}, { timestamps: true });

speakingActivitySchema.index({ userId: 1, activityDate: 1 }, { unique: true });
speakingActivitySchema.index({ userId: 1, activityDate: -1 });

export const SpeakingActivity = model("SpeakingActivity", speakingActivitySchema);

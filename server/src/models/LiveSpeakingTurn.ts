import { Schema, model, Types } from "mongoose";
export interface LiveSpeakingTurnFields {
  userId: Types.ObjectId; sessionId: string; transcript: string; correctedSentence: string;
  explanation: string; coachReply: string; grammarIssues: string[]; vocabularySuggestions: string[];
  createdAt?: Date;
}
const schema = new Schema<LiveSpeakingTurnFields>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  sessionId: { type: String, required: true, trim: true, maxlength: 80, index: true },
  transcript: { type: String, required: true, trim: true, maxlength: 2000 },
  correctedSentence: { type: String, required: true, maxlength: 2000 },
  explanation: { type: String, required: true, maxlength: 1500 },
  coachReply: { type: String, required: true, maxlength: 2000 },
  grammarIssues: { type: [String], default: [] },
  vocabularySuggestions: { type: [String], default: [] },
}, { timestamps: true });
schema.index({ userId: 1, createdAt: -1 });
export const LiveSpeakingTurn = model<LiveSpeakingTurnFields>("LiveSpeakingTurn", schema);

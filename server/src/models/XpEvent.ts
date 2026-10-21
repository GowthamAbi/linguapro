import { Schema, model } from "mongoose";

const xpEventSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  source: { type: String, enum: ["course-lesson", "words", "speak", "listen", "review"], required: true },
  sourceId: { type: String, default: "" },
  label: { type: String, required: true, maxlength: 180 },
  xpEarned: { type: Number, required: true, min: 0 },
  earnedOn: { type: String, required: true, index: true },
}, { timestamps: true });

xpEventSchema.index({ userId: 1, source: 1, sourceId: 1 }, { unique: true, partialFilterExpression: { sourceId: { $type: "string", $gt: "" } } });
xpEventSchema.index({ userId: 1, createdAt: -1 });
export const XpEvent = model("XpEvent", xpEventSchema);

import { Schema, model } from "mongoose";

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true, select: false },
    nativeLanguage: { type: String, default: "Tamil", enum: ["Tamil", "English", "Malayalam", "Hindi", "Kannada", "Telugu"] },
    targetLanguage: { type: String, default: "English", enum: ["Tamil", "English", "Malayalam", "Hindi", "Kannada", "Telugu"] },
    level: { type: String, default: "Basic", enum: ["Basic", "Intermediate", "Advanced"] },
    plan: { type: String, default: "Free", enum: ["Free", "Premium"] },
    totalXp: { type: Number, default: 0, min: 0 },
    currentStreak: { type: Number, default: 0, min: 0 },
    lastActiveDate: { type: String, default: "" },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_document, returnedObject) {
        delete returnedObject.passwordHash;
        delete returnedObject.__v;
        return returnedObject;
      },
    },
  },
);

export const User = model("User", userSchema);
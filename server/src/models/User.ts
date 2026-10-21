import { Schema, model } from "mongoose";

export interface UserFields {
  name: string;
  email: string;
  passwordHash: string;
  nativeLanguage: string;
  targetLanguage: string;
  level: string;
  plan: string;
  role: "student" | "teacher";
  totalXp: number;
  currentStreak: number;
  lastActiveDate: string;
}

const userSchema = new Schema<UserFields>(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true, select: false },
    nativeLanguage: { type: String, default: "Tamil", enum: ["Tamil", "English", "Malayalam", "Hindi", "Kannada", "Telugu"] },
    targetLanguage: { type: String, default: "English", enum: ["Tamil", "English", "Malayalam", "Hindi", "Kannada", "Telugu"] },
    level: { type: String, default: "Basic", enum: ["Basic", "Intermediate", "Advanced"] },
    plan: { type: String, default: "Free", enum: ["Free", "Premium"] },
    role: { type: String, default: "student", enum: ["student", "teacher"], lowercase: true },
    totalXp: { type: Number, default: 0, min: 0 },
    currentStreak: { type: Number, default: 0, min: 0 },
    lastActiveDate: { type: String, default: "" },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_document, returnedObject) {
        const { passwordHash: _passwordHash, __v: _version, ...safeObject } = returnedObject;
        return safeObject;
      },
    },
  },
);

export const User = model<UserFields>("User", userSchema);

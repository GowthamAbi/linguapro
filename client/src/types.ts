export type Page = "dashboard" | "courses" | "speaking" | "vocabulary" | "progress" | "profile" | "plans" | "owner" | "teacher" | "assignments";
export type LearningLevel = "Basic" | "Intermediate" | "Advanced";

export interface UserProfile {
  name: string;
  email: string;
  nativeLanguage: string;
  targetLanguage: string;
  level: LearningLevel;
  plan: "Free" | "Premium";
  role: "student" | "teacher" | "owner";
}

export interface LearningTask {
  id: string;
  title: string;
  description: string;
  icon: string;
  xp: number;
  duration: string;
  completed: boolean;
}

export interface LearningPhrase {
  phrase: string;
  meaning: string;
  example: string;
}
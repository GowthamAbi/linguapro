export type Page = "dashboard" | "courses" | "speaking" | "vocabulary" | "progress" | "profile" | "plans" | "owner" | "teacher" | "assignments" | "placement";
export type LearningLevel = "Basic" | "Intermediate" | "Advanced";

export interface UserProfile {
  name: string;
  email: string;
  nativeLanguage: string;
  targetLanguage: string;
  level: LearningLevel;
  plan: "Free" | "Premium";
  role: "student" | "teacher" | "owner";
  audience?: "Kids" | "Adults" | "Job Professionals" | "Homemakers";
  learningGoal?: "Daily conversations" | "Career growth" | "Confidence" | "School and family";
  dailyGoalMinutes?: 10 | 15 | 20 | 30 | 60;
  onboardingCompleted?: boolean;
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
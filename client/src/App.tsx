import { useEffect, useState } from "react";
import "./styles-teacher-progress.css";
import {
  AudioLines, BookOpen, Check, ChevronRight, CircleUserRound, Crown,
  Flame, GraduationCap, Languages, LayoutDashboard, LockKeyhole, LogIn,
  Menu, Mic, Settings, Sparkles, Star, Target, TrendingUp, Volume2, X, Users, ShieldCheck, UserRound, ClipboardList, Send,
} from "lucide-react";
import type { FormEvent, ReactNode } from "react";
import type { LearningLevel, LearningPhrase, LearningTask, Page, UserProfile } from "./types";
import TeacherCourseBuilder from "./components/TeacherCourseBuilder";
import TeacherCourseProgress from "./components/TeacherCourseProgress";
import StudentCourseLibrary from "./components/StudentCourseLibrary";

const phrases: LearningPhrase[] = [
  { phrase: "Could you please help me?", meaning: "Ask someone for help politely.", example: "Could you please help me with this report?" },
  { phrase: "I would like to improve my English.", meaning: "Explain a learning goal.", example: "I would like to improve my English for work." },
  { phrase: "Could you say that again, please?", meaning: "Ask someone to repeat something.", example: "Sorry, could you say that again, please?" },
  { phrase: "I will finish this task on time.", meaning: "Talk about work and responsibility.", example: "I will finish this task on time and update my supervisor." },
  { phrase: "Thank you for your time and support.", meaning: "Show appreciation.", example: "Thank you for your time and support." },
];

const defaultTasks: LearningTask[] = [
  { id: "words", title: "Learn 5 useful words", description: "Grow your everyday vocabulary.", icon: "📚", xp: 10, duration: "5 min", completed: false },
  { id: "speak", title: "Speak out loud", description: "Practise a real-life phrase.", icon: "🎙️", xp: 15, duration: "5 min", completed: false },
  { id: "listen", title: "Listen and repeat", description: "Train your ears and pronunciation.", icon: "🎧", xp: 10, duration: "3 min", completed: false },
  { id: "review", title: "Quick review", description: "Remember what you learned.", icon: "🧠", xp: 5, duration: "2 min", completed: false },
];

const defaultProfile: UserProfile = {
  name: "Learner", email: "", nativeLanguage: "Tamil",
  targetLanguage: "English", level: "Basic", plan: "Free", role: "student",
};

const navItems: { id: Page; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "courses", label: "My learning", icon: GraduationCap },
  { id: "speaking", label: "Speaking", icon: AudioLines },
  { id: "vocabulary", label: "Vocabulary", icon: BookOpen },
  { id: "progress", label: "My progress", icon: TrendingUp },
  { id: "assignments", label: "Assignments", icon: ClipboardList },
  { id: "profile", label: "Profile & settings", icon: Settings },
];

function readStored<T>(key: string, fallback: T): T {
  try {
    const stored = localStorage.getItem(key);
    return stored ? { ...fallback as object, ...JSON.parse(stored) } as T : fallback;
  } catch {
    return fallback;
  }
}

function pageFromPath(pathname: string): Page {
  const path = pathname.replace(/\/+$/, "") || "/";
  if (path === "/owner") return "owner";
  if (path === "/teacher") return "teacher";
  if (path === "/student" || path === "/") return "dashboard";
  const allowed: Page[] = ["dashboard", "courses", "speaking", "vocabulary", "progress", "profile", "plans", "assignments"];
  const candidate = path.slice(1) as Page;
  return allowed.includes(candidate) ? candidate : "dashboard";
}

function App() {
  const [page, setPage] = useState<Page>(() => pageFromPath(window.location.pathname));
  const [menuOpen, setMenuOpen] = useState(false);
  const [profile, setProfile] = useState<UserProfile>(() => readStored("linguapro-profile", defaultProfile));
  const [tasks, setTasks] = useState<LearningTask[]>(() => {
    try {
      const stored = localStorage.getItem("linguapro-tasks");
      return stored ? JSON.parse(stored) as LearningTask[] : defaultTasks;
    } catch { return defaultTasks; }
  });
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [vocabAnswers, setVocabAnswers] = useState<Record<string, string>>(() => {
    try { return JSON.parse(localStorage.getItem("linguapro-vocab-answers") || "{}") as Record<string, string>; } catch { return {}; }
  });
  const [vocabChecked, setVocabChecked] = useState<Record<string, boolean>>(() => {
    try { return JSON.parse(localStorage.getItem("linguapro-vocab-checked") || "{}") as Record<string, boolean>; } catch { return {}; }
  });
  const [vocabCompleted, setVocabCompleted] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem("linguapro-vocab-completed") || "[]") as string[]; } catch { return []; }
  });
  const [vocabSpoken, setVocabSpoken] = useState<Record<string, boolean>>(() => {
    try { return JSON.parse(localStorage.getItem("linguapro-vocab-spoken") || "{}") as Record<string, boolean>; } catch { return {}; }
  });
  const [vocabCurrentIndex, setVocabCurrentIndex] = useState(0);
  const [vocabSpeechMessage, setVocabSpeechMessage] = useState<Record<string, string>>({});
  const [vocabListening, setVocabListening] = useState("");
  useEffect(() => { localStorage.setItem("linguapro-vocab-spoken", JSON.stringify(vocabSpoken)); }, [vocabSpoken]);
  useEffect(() => { localStorage.setItem("linguapro-vocab-answers", JSON.stringify(vocabAnswers)); }, [vocabAnswers]);
  useEffect(() => { localStorage.setItem("linguapro-vocab-checked", JSON.stringify(vocabChecked)); }, [vocabChecked]);
  useEffect(() => { localStorage.setItem("linguapro-vocab-completed", JSON.stringify(vocabCompleted)); }, [vocabCompleted]);
  const [isListening, setIsListening] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [message, setMessage] = useState("");
  const [spokenTranscript, setSpokenTranscript] = useState("");
  const [coachCorrect, setCoachCorrect] = useState<boolean | null>(null);
  const [coachAttempts, setCoachAttempts] = useState(0);
  const [authMode, setAuthMode] = useState<"login" | "register" | null>(null);
  const [authName, setAuthName] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [authToken, setAuthToken] = useState(() => sessionStorage.getItem("linguapro-token") ?? "");
  const [serverXp, setServerXp] = useState<number | null>(null);
  const [serverStreak, setServerStreak] = useState(0);
  const [serverCompletedIds, setServerCompletedIds] = useState<string[]>([]);

  const apiBase = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ?? "";
  async function apiFetch(url: string, init: RequestInit = {}): Promise<Response> {
    const headers = new Headers(init.headers ?? {});
    if (authToken) headers.set("Authorization", "Bearer " + authToken);
    return fetch(url, { ...init, headers, credentials: "include" });
  }
  const ownerEmail = (import.meta.env.VITE_OWNER_EMAIL as string | undefined)?.trim().toLowerCase() ?? "";
  const isOwner = authenticated && (profile.role === "owner" || (!!ownerEmail && profile.email.trim().toLowerCase() === ownerEmail));
  const isTeacher = authenticated && profile.role === "teacher" && !isOwner;
  const [ownerSection, setOwnerSection] = useState("overview");
  const [ownerStats, setOwnerStats] = useState<{ totalUsers: number; premiumUsers: number; freeUsers: number; activeLearners: number; totalXp: number } | null>(null);
  const [ownerUsers, setOwnerUsers] = useState<Array<{ _id: string; name: string; email: string; role?: string; plan: string; targetLanguage: string; level: string; totalXp: number; currentStreak: number; createdAt: string }>>([]);
  const [ownerLoading, setOwnerLoading] = useState(false);
  const [teacherName, setTeacherName] = useState("");
  const [teacherEmail, setTeacherEmail] = useState("");
  const [teacherPassword, setTeacherPassword] = useState("");
  const [teacherCreated, setTeacherCreated] = useState("");
  const [teacherList, setTeacherList] = useState<Array<{ _id: string; name: string; email: string; plan: string; createdAt: string }>>([]);
  const [ownerError, setOwnerError] = useState("");
  const [assignmentTitle, setAssignmentTitle] = useState("");
  const [assignmentDescription, setAssignmentDescription] = useState("");
  const [assignmentStudentEmails, setAssignmentStudentEmails] = useState("");
  const [assignmentMessage, setAssignmentMessage] = useState("");
  const [assignmentBusy, setAssignmentBusy] = useState(false);
  const [teacherStudents, setTeacherStudents] = useState<Array<{ _id: string; name: string; email: string; targetLanguage: string; level: string; totalXp: number }>>([]);
  const [teacherAssignments, setTeacherAssignments] = useState<Array<{ _id: string; title: string; description: string; studentIds: Array<{ _id: string; name: string; email: string }>; dueDate?: string; submissions: Array<{ studentId: string; answer: string; submittedAt: string; feedback: string; score?: number }> }>>([]);
  const [studentAssignments, setStudentAssignments] = useState<Array<{ _id: string; title: string; description: string; teacherId?: { name: string; email: string }; dueDate?: string; mySubmission: { answer: string; submittedAt: string; feedback: string; score?: number } | null }>>([]);
  const [assignmentAnswers, setAssignmentAnswers] = useState<Record<string, string>>({});
  const [grading, setGrading] = useState<Record<string, { score: string; feedback: string }>>({});

  async function loadOwnerData(section: "overview" | "users" | "students" | "teachers" = (["overview", "users", "students", "teachers"].includes(ownerSection) ? ownerSection : "overview") as "overview" | "users" | "students" | "teachers") {
    if (!apiBase || !isOwner) return;
    setOwnerLoading(true); setOwnerError("");
    try {
      if (section === "overview") {
        const response = await apiFetch(apiBase + "/admin/overview", { credentials: "include" });
        const payload = await response.json() as { message?: string; data?: { totalUsers: number; premiumUsers: number; freeUsers: number; activeLearners: number; totalXp: number } };
        if (!response.ok || !payload.data) throw new Error(payload.message ?? "Could not load owner overview.");
        setOwnerStats(payload.data);
      } else if (section === "teachers") {
        // The teacher list is loaded when the teacher-management tab is opened.
        const response = await fetch(apiBase + "/admin/teachers", { credentials: "include" });
        const payload = await response.json() as { message?: string; data?: { teachers: Array<{ _id: string; name: string; email: string; plan: string; createdAt: string }> } };
        if (!response.ok || !payload.data) throw new Error(payload.message ?? "Could not load teachers.");
        setTeacherList(payload.data.teachers);
      } else {
        const response = await fetch(apiBase + "/admin/users?type=" + section, { credentials: "include" });
        const payload = await response.json() as { message?: string; data?: { users: typeof ownerUsers } };
        if (!response.ok || !payload.data) throw new Error(payload.message ?? "Could not load accounts.");
        setOwnerUsers(payload.data.users);
      }
    } catch (error) { setOwnerError(error instanceof Error ? error.message : "Owner dashboard could not load."); }
    finally { setOwnerLoading(false); }
  }

  useEffect(() => { if (isOwner) void loadOwnerData("overview"); }, [isOwner, apiBase]);
  async function loadTeacherWorkspace() {
    if (!apiBase || !isTeacher) return;
    try {
      const [sr, ar] = await Promise.all([
        fetch(apiBase + "/assignments/teacher/students", { credentials: "include" }),
        fetch(apiBase + "/assignments/teacher/assignments", { credentials: "include" }),
      ]);
      const sp = await sr.json() as { message?: string; data?: { students: typeof teacherStudents } };
      const ap = await ar.json() as { message?: string; data?: { assignments: typeof teacherAssignments } };
      if (!sr.ok) throw new Error(sp.message ?? "Could not load students.");
      if (!ar.ok) throw new Error(ap.message ?? "Could not load assignments.");
      setTeacherStudents(sp.data?.students ?? []);
      setTeacherAssignments(ap.data?.assignments ?? []);
    } catch (error) { setAssignmentMessage(error instanceof Error ? error.message : "Teacher workspace could not load."); }
  }

  async function loadStudentAssignments() {
    if (!apiBase || !authenticated || isTeacher || isOwner) return;
    try {
      const response = await fetch(apiBase + "/assignments/student/assignments", { credentials: "include" });
      const payload = await response.json() as { message?: string; data?: { assignments: typeof studentAssignments } };
      if (!response.ok) throw new Error(payload.message ?? "Could not load assignments.");
      setStudentAssignments(payload.data?.assignments ?? []);
    } catch (error) { setAssignmentMessage(error instanceof Error ? error.message : "Assignments could not load."); }
  }

  useEffect(() => {
    if (page === "teacher" && isTeacher) void loadTeacherWorkspace();
    if (page === "assignments" && authenticated && !isTeacher && !isOwner) void loadStudentAssignments();
  }, [page, isTeacher, isOwner, authenticated, apiBase]);


  async function loadServerProgress() {
    if (!apiBase) return;
    try {
      const response = await fetch(apiBase + "/progress", { credentials: "include" });
      if (!response.ok) return;
      const payload = await response.json() as { data?: { totalXp?: number; currentStreak?: number; completedToday?: Array<{ taskId: string }> } };
      if (payload.data) {
        setServerXp(Number(payload.data.totalXp ?? 0));
        setServerStreak(Number(payload.data.currentStreak ?? 0));
        setServerCompletedIds((payload.data.completedToday ?? []).map((item) => item.taskId));
      }
    } catch { /* Keep the local demo usable if the API is temporarily unavailable. */ }
  }

  useEffect(() => {
    const onPopState = () => setPage(pageFromPath(window.location.pathname));
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    if (!apiBase) return;
    apiFetch(apiBase + "/auth/me")
      .then(async (response) => {
        if (!response.ok) return;
        const payload = await response.json() as { data?: { user?: { name?: string; email?: string; nativeLanguage?: string; targetLanguage?: string; level?: LearningLevel; plan?: "Free" | "Premium"; role?: "student" | "teacher" | "owner" } } };
        const user = payload.data?.user;
        if (user) {
          setAuthenticated(true);
          setProfile((current) => ({ ...current, ...user, role: user.role ?? "student" }));
          const requestedRolePath = window.location.pathname;
          if (["/owner", "/teacher", "/student"].includes(requestedRolePath)) {
            const destination = user.role === "owner" ? "/owner" : user.role === "teacher" ? "/teacher" : "/student";
            const destinationPage: Page = user.role === "owner" ? "owner" : user.role === "teacher" ? "teacher" : "dashboard";
            if (requestedRolePath !== destination) window.history.replaceState({}, "", destination);
            setPage(destinationPage);
          }
          await loadServerProgress();
        }
      })
      .catch(() => undefined);
  }, []);
  const completed = tasks.filter((task) => task.completed || serverCompletedIds.includes(task.id)).length;
  const xp = serverXp ?? tasks.filter((task) => task.completed).reduce((sum, task) => sum + task.xp, 0);
  const phrase = phrases[phraseIndex];

  function navigate(next: Page) {
    const path = next === "owner" || next === "teacher" ? "/" + next : next === "dashboard" ? "/student" : "/" + next;
    if (window.location.pathname !== path) window.history.pushState({}, "", path);
    setPage(next);
    setMenuOpen(false);
    setMessage("");
    if (next === "speaking") { setSpokenTranscript(""); setCoachCorrect(null); setCoachAttempts(0); }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function saveProfile<K extends keyof UserProfile>(key: K, value: UserProfile[K]) {
    const next = { ...profile, [key]: value };
    setProfile(next);
    localStorage.setItem("linguapro-profile", JSON.stringify(next));
  }

  async function completeTask(id: string) {
    if (authenticated ? serverCompletedIds.includes(id) : tasks.some((task) => task.id === id && task.completed)) {
      setMessage("You have already completed this task today.");
      return;
    }
    if (authenticated && apiBase) {
      try {
        const response = await fetch(apiBase + "/progress/complete", {
          method: "POST", credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ taskId: id }),
        });
        const payload = await response.json() as { message?: string; data?: { totalXp?: number; currentStreak?: number } };
        if (!response.ok) throw new Error(payload.message ?? "Could not save progress.");
        setServerXp(Number(payload.data?.totalXp ?? 0));
        setServerStreak(Number(payload.data?.currentStreak ?? 0));
        setServerCompletedIds((current) => [...current, id]);
        setMessage("Great work! Your progress is saved to your account.");
        return;
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Could not save progress to your account.");
        return;
      }
    }
    const next = tasks.map((task) => task.id === id ? { ...task, completed: true } : task);
    setTasks(next);
    localStorage.setItem("linguapro-tasks", JSON.stringify(next));
    setMessage("Sign in to save your learning progress to your account. This demo progress is saved on this device.");
  }

  function playPhrase() {
    if (!("speechSynthesis" in window)) {
      setMessage("Speech playback is not supported by this browser.");
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(phrase.phrase);
    utterance.lang = profile.targetLanguage === "Hindi" ? "hi-IN" : "en-IN";
    window.speechSynthesis.speak(utterance);
    setMessage("Listen carefully, then repeat the phrase aloud.");
  }

  function recordSpeech() {
    if (isListening || sessionComplete) return;
    type RecognitionResult = { results: ArrayLike<ArrayLike<{ transcript: string }>> };
    type RecognitionError = { error?: string };
    type Recognition = {
      lang: string;
      interimResults?: boolean;
      onresult: ((event: RecognitionResult) => void) | null;
      onerror: ((event: RecognitionError) => void) | null;
      start: () => void;
    };
    const browser = window as Window & {
      SpeechRecognition?: new () => Recognition;
      webkitSpeechRecognition?: new () => Recognition;
    };
    const RecognitionAPI = browser.SpeechRecognition ?? browser.webkitSpeechRecognition;
    if (!RecognitionAPI) {
      setMessage("Speech recognition is not supported in this browser. Try Chrome and allow microphone access.");
      return;
    }
    const recognition = new RecognitionAPI();
    recognition.lang = profile.targetLanguage === "Hindi" ? "hi-IN" : profile.targetLanguage === "Malayalam" ? "ml-IN" : profile.targetLanguage === "Kannada" ? "kn-IN" : profile.targetLanguage === "Telugu" ? "te-IN" : "en-IN";
    recognition.interimResults = false;
    let handledResult = false;

    const speakFeedback = (text: string, onFinished: () => void) => {
      let finished = false;
      const finish = () => {
        if (finished) return;
        finished = true;
        onFinished();
      };
      if (!("speechSynthesis" in window)) {
        setTimeout(finish, 2500);
        return;
      }
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = profile.targetLanguage === "Hindi" ? "hi-IN" : profile.targetLanguage === "Malayalam" ? "ml-IN" : profile.targetLanguage === "Kannada" ? "kn-IN" : profile.targetLanguage === "Telugu" ? "te-IN" : "en-IN";
      utterance.rate = 0.9;
      utterance.onend = finish;
      utterance.onerror = finish;
      window.speechSynthesis.speak(utterance);
    };

    recognition.onresult = (event) => {
      if (handledResult) return;
      handledResult = true;
      setIsListening(false);
      const spoken = (event.results[0]?.[0]?.transcript ?? "").trim();
      const normalize = (value: string) => value.toLocaleLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim();
      const expectedWords = normalize(phrase.phrase).split(" ").filter(Boolean);
      const spokenWords = normalize(spoken).split(" ").filter(Boolean);
      const missingWords = expectedWords.filter((word) => !spokenWords.includes(word));
      const extraWords = spokenWords.filter((word) => !expectedWords.includes(word));
      const matches = expectedWords.filter((word) => spokenWords.includes(word)).length;
      const accuracy = expectedWords.length ? matches / expectedWords.length : 0;
      const localCorrect = accuracy >= 0.8 && missingWords.length <= Math.max(1, Math.floor(expectedWords.length * 0.2)) && spokenWords.length >= Math.max(2, Math.ceil(expectedWords.length * 0.65));
      const localFeedback = localCorrect
        ? "Good work! I heard: " + (spoken || "your sentence") + ". Your sentence is close to the target."
        : "I heard: " + (spoken || "no speech detected") + ". " +
          (missingWords.length ? "You missed: " + missingWords.join(", ") + ". " : "") +
          (extraWords.length ? "Check these extra words: " + extraWords.join(", ") + ". " : "") +
          "The target sentence is: " + phrase.phrase + ".";
      setSpokenTranscript(spoken);
      setCoachCorrect(null);
      setCoachAttempts((attempts) => attempts + 1);
      const moveNext = (passed: boolean) => {
        setCoachCorrect(passed);
        if (!passed) { setMessage("Let’s try once more. Read the target sentence, then tap Try speaking."); return; }
        if (phraseIndex < phrases.length - 1) {
          setPhraseIndex((current) => Math.min(current + 1, phrases.length - 1));
          setMessage("Next phrase. Listen and speak when you are ready.");
        } else {
          setSessionComplete(true);
          setMessage("All 5 phrases completed! Saving your speaking XP…");
          void completeTask("speak");
        }
      };

      const evaluate = async () => {
        let correct = localCorrect;
        let feedback = localFeedback;
        let coachSource = "Practice coach";
        if (authenticated && apiBase) {
          try {
            const response = await fetch(apiBase + "/speaking/feedback", {
              method: "POST",
              credentials: "include",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ targetPhrase: phrase.phrase, transcript: spoken, language: profile.targetLanguage, level: profile.level }),
            });
            const payload = await response.json() as { message?: string; data?: { correct: boolean; correctedSentence: string; feedback: string; spokenFeedback: string; missingWords: string[]; pronunciationTip: string } };
            if (response.ok && payload.data) {
              correct = payload.data.correct;
              feedback = payload.data.feedback + (payload.data.correctedSentence !== phrase.phrase ? " Suggested sentence: " + payload.data.correctedSentence : "") + (payload.data.pronunciationTip ? " Pronunciation tip: " + payload.data.pronunciationTip : "");
              coachSource = "AI speaking coach";
              setMessage(coachSource + ": " + feedback);
              speakFeedback(payload.data.spokenFeedback, () => moveNext(payload.data!.correct));
              return;
            }
          } catch {
            // Continue with local transcript feedback when the AI service is temporarily unavailable.
          }
        }
        setMessage(feedback);
        speakFeedback(correct ? "Well done. " + feedback + " Moving to the next phrase." : feedback + " Please try again.", () => moveNext(correct));
      };
      void evaluate();
    };
    recognition.onerror = (event) => {
      setIsListening(false);
      const feedback = event.error === "not-allowed"
        ? "Microphone permission is blocked. Allow microphone access in your browser settings."
        : "I could not hear that clearly. Please try speaking again.";
      setMessage(feedback);
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(feedback);
        utterance.lang = "en-IN";
        window.speechSynthesis.speak(utterance);
      }
    };
    try {
      recognition.start();
      setIsListening(true);
      setMessage("Listening… say the phrase now.");
    } catch {
      setMessage("Microphone is already active. Please wait and try again.");
    }
  }

  async function submitAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const base = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "");
      if (!base) {
        setMessage("The login UI is ready. Set VITE_API_URL after deploying the Node.js API to enable account access.");
        return;
      }
      const path = authMode === "register" ? "/auth/register" : "/auth/login";
      const response = await fetch(base + path, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(authMode === "register"
          ? { name: authName, email: authEmail, password: authPassword }
          : { email: authEmail, password: authPassword }),
      });
      const payload = await response.json() as { message?: string; token?: string; data?: { user?: { name?: string; email?: string; role?: "student" | "teacher" | "owner" } } };
      if (!response.ok) throw new Error(payload.message ?? "Unable to sign in.");
      if (payload.token) { sessionStorage.setItem("linguapro-token", payload.token); setAuthToken(payload.token); }
      if (payload.data?.user?.name) saveProfile("name", payload.data.user.name);
      if (payload.data?.user?.email) saveProfile("email", payload.data.user.email);
      if (payload.data?.user?.role) saveProfile("role", payload.data.user.role);
      setAuthenticated(true);
      const signedInRole = payload.data?.user?.role ?? "student";
      setAuthMode(null);
      if (signedInRole === "owner") { setOwnerSection("overview"); window.history.replaceState({}, "", "/owner"); setPage("owner"); }
      else if (signedInRole === "teacher") { window.history.replaceState({}, "", "/teacher"); setPage("teacher"); }
      else { window.history.replaceState({}, "", "/student"); setPage("dashboard"); }
      await loadServerProgress();
      setMessage("You are signed in.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to sign in.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="icon-button mobile-menu-button" aria-label="Open menu" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X /> : <Menu />}</button>
        <button className="brand" onClick={() => navigate("dashboard")}><span className="brand-mark">◈</span> Lingua<span className="brand-accent">Pro</span></button>
        <div className="topbar-right">
          {isOwner && <button className="plan-chip owner-chip" onClick={() => { setOwnerSection("overview"); void loadOwnerData("overview"); navigate("owner" as Page); }}><ShieldCheck size={14} /> OWNER</button>}{isTeacher && <button className="plan-chip owner-chip" onClick={() => navigate("teacher" as Page)}><GraduationCap size={14} /> TEACHER</button>}<button className="plan-chip" onClick={() => navigate("plans")}><Sparkles size={14} /> {profile.plan.toUpperCase()} PLAN</button>
          <button className="avatar-button" onClick={() => navigate("profile")} aria-label="Profile"><CircleUserRound size={20} /></button>
          <button className="text-button" onClick={() => { setAuthMode("login"); setMessage(""); }}><LogIn size={16} /> Sign in</button>
        </div>
      </header>

      <div className="app-layout">
        <aside className={"sidebar " + (menuOpen ? "sidebar-open" : "")}>
          <div className="sidebar-caption">{isOwner ? "OWNER CONSOLE" : isTeacher ? "TEACHER WORKSPACE" : "YOUR WORKSPACE"}</div>
          <nav className="sidebar-nav">
            {isOwner ? [
              { id: "overview", label: "Dashboard", icon: LayoutDashboard }, { id: "students", label: "Students", icon: GraduationCap },
              { id: "teachers", label: "Teachers", icon: ShieldCheck }, { id: "admins", label: "Admins", icon: LockKeyhole },
              { id: "users", label: "All users", icon: Users }, { id: "courses", label: "Courses", icon: BookOpen },
              { id: "lessons", label: "Lessons", icon: ClipboardList }, { id: "assessments", label: "Assessments", icon: Check },
              { id: "assignments", label: "Assignments", icon: Send }, { id: "certificates", label: "Certificates", icon: Star },
              { id: "pricing", label: "Plans & pricing", icon: Crown }, { id: "subscriptions", label: "Subscriptions", icon: Star },
              { id: "payments", label: "Payments", icon: TrendingUp }, { id: "invoices", label: "Invoices", icon: ClipboardList },
              { id: "coupons", label: "Coupons & offers", icon: Sparkles }, { id: "categories", label: "Categories", icon: LayoutDashboard },
              { id: "materials", label: "Learning materials", icon: BookOpen }, { id: "announcements", label: "Announcements", icon: Send },
              { id: "settings", label: "Site settings", icon: Settings }, { id: "emails", label: "Email templates", icon: LogIn },
              { id: "reports", label: "Reports & analytics", icon: TrendingUp },
            ].map(({ id, label, icon: Icon }) => <button key={id} className={"nav-item " + (ownerSection === id ? "active" : "")} onClick={() => { setOwnerSection(id); if (["overview", "users", "students", "teachers"].includes(id)) void loadOwnerData(id as "overview" | "users" | "students" | "teachers"); }}><Icon size={17} /><span>{label}</span></button>)
            : navItems.map(({ id, label, icon: Icon }) => <button key={id} className={"nav-item " + (page === id ? "active" : "")} onClick={() => navigate(id)}><Icon size={18} /><span>{label}</span>{id === "dashboard" && <span className="nav-dot" />}</button>)}
          </nav>
          {!isOwner && <div className="sidebar-premium"><div className="premium-icon"><Crown size={20} /></div><strong>Unlock your potential</strong><p>Get more lessons and guided practice with Premium.</p><button className="button button-light" onClick={() => navigate("plans")}>Explore plans <ChevronRight size={15} /></button></div>}
          <div className="sidebar-foot">LinguaPro · {isOwner ? "Platform administration" : "Learn every day"}</div>
        </aside>

        <main className="page-content">
          {page === ("teacher" as Page) && isTeacher && <>
            <PageTitle eyebrow="TEACHER WORKSPACE" title={"Welcome, " + profile.name} subtitle="Create assignments and review student submissions." />
            <div className="stats-grid"><StatCard icon={<Users />} label="Your students" value={String(teacherStudents.length)} detail="Students assigned work" /><StatCard icon={<ClipboardList />} label="Assignments" value={String(teacherAssignments.length)} detail="Created by you" /><StatCard icon={<Check />} label="Submissions" value={String(teacherAssignments.reduce((sum, item) => sum + item.submissions.length, 0))} detail="Student responses" /></div>
            <TeacherCourseBuilder apiBase={apiBase} />
            <TeacherCourseProgress apiBase={apiBase} />
            <section className="surface-card settings-card"><h3>Create assignment</h3><p>Assign work to existing student accounts using their email addresses.</p>
              <form className="form-grid" onSubmit={async (event) => { event.preventDefault(); setAssignmentBusy(true); setAssignmentMessage(""); try { const emails = assignmentStudentEmails.split(/[\s,;]+/).map((email) => email.trim()).filter(Boolean); const response = await fetch(apiBase + "/assignments/teacher/assignments", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: assignmentTitle, description: assignmentDescription, studentEmails: emails }) }); const payload = await response.json() as { message?: string }; if (!response.ok) throw new Error(payload.message ?? "Could not create assignment."); setAssignmentMessage(payload.message ?? "Assignment created."); setAssignmentTitle(""); setAssignmentDescription(""); setAssignmentStudentEmails(""); await loadTeacherWorkspace(); } catch (error) { setAssignmentMessage(error instanceof Error ? error.message : "Could not create assignment."); } finally { setAssignmentBusy(false); } }}>
                <label>Assignment title<input required minLength={3} maxLength={120} value={assignmentTitle} onChange={(event) => setAssignmentTitle(event.target.value)} placeholder="e.g. Introduce yourself in English" /></label>
                <label>Instructions<textarea required minLength={3} maxLength={3000} rows={3} value={assignmentDescription} onChange={(event) => setAssignmentDescription(event.target.value)} placeholder="Explain what students should do" /></label>
                <label>Student email addresses<textarea required rows={2} value={assignmentStudentEmails} onChange={(event) => setAssignmentStudentEmails(event.target.value)} placeholder="student@example.com, another@example.com" /></label>
                <button className="button button-primary" disabled={assignmentBusy}>{assignmentBusy ? "Creating…" : "Create and assign"} <Send size={16} /></button>
              </form>
              {assignmentMessage && <div className="inline-message">{assignmentMessage}</div>}
            </section>
            <section className="surface-card owner-table-card"><div className="card-heading"><div><h3>Your student roster</h3><p>Students assigned to your work.</p></div><button className="button button-outline" onClick={() => void loadTeacherWorkspace()}>Refresh</button></div><div className="owner-table-wrap"><table className="owner-table"><thead><tr><th>Name</th><th>Email</th><th>Level</th><th>Language</th><th>XP</th></tr></thead><tbody>{teacherStudents.map((student) => <tr key={student._id}><td>{student.name}</td><td>{student.email}</td><td>{student.level}</td><td>{student.targetLanguage}</td><td>{student.totalXp ?? 0}</td></tr>)}{!teacherStudents.length && <tr><td colSpan={5}>No students assigned yet.</td></tr>}</tbody></table></div></section>
            <section className="surface-card owner-table-card"><h3>Your assignments</h3>{teacherAssignments.map((assignment) => <article className="word-card" key={assignment._id}><div className="word-letter"><ClipboardList size={18} /></div><div><h3>{assignment.title}</h3><p>{assignment.description}</p><p className="muted-small">{assignment.studentIds.length} student(s) · {(assignment.submissions ?? []).length} submission(s)</p>{(assignment.submissions ?? []).map((submission) => <div className="example-box" key={submission.studentId}><strong>{teacherStudents.find((student) => student._id === submission.studentId)?.name ?? "Student"}'s answer</strong><p>{submission.answer}</p><p className="muted-small">{submission.score !== undefined ? "Score: " + submission.score + "/100" : "Awaiting feedback"}</p>{submission.feedback && <p>{submission.feedback}</p>}<form className="form-grid" onSubmit={async (event) => { event.preventDefault(); const key = assignment._id + ":" + submission.studentId; const values = grading[key] ?? { score: String(submission.score ?? 0), feedback: submission.feedback ?? "" }; try { const response = await fetch(apiBase + "/assignments/teacher/assignments/" + assignment._id + "/grade", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ studentId: submission.studentId, score: Number(values.score), feedback: values.feedback }) }); const payload = await response.json() as { message?: string }; if (!response.ok) throw new Error(payload.message ?? "Could not save feedback."); setAssignmentMessage(payload.message ?? "Feedback saved."); await loadTeacherWorkspace(); } catch (error) { setAssignmentMessage(error instanceof Error ? error.message : "Could not save feedback."); } }}><label>Score (0–100)<input type="number" min={0} max={100} required value={grading[assignment._id + ":" + submission.studentId]?.score ?? String(submission.score ?? 0)} onChange={(event) => setGrading((oldState) => ({ ...oldState, [assignment._id + ":" + submission.studentId]: { score: event.target.value, feedback: oldState[assignment._id + ":" + submission.studentId]?.feedback ?? submission.feedback ?? "" } }))} /></label><label>Teacher feedback<textarea rows={2} value={grading[assignment._id + ":" + submission.studentId]?.feedback ?? submission.feedback ?? ""} onChange={(event) => setGrading((oldState) => ({ ...oldState, [assignment._id + ":" + submission.studentId]: { score: oldState[assignment._id + ":" + submission.studentId]?.score ?? String(submission.score ?? 0), feedback: event.target.value } }))} placeholder="Give constructive feedback" /></label><button className="button button-outline">Save feedback</button></form></div>)}</div></article>)}{!teacherAssignments.length && <p>No assignments yet.</p>}</section>
          </>}
          {page === ("teacher" as Page) && !isTeacher && <section className="surface-card"><h3>Teacher access only</h3><p>Sign in using a teacher account created by the owner.</p></section>}
          {page === ("owner" as Page) && isOwner && <>
            <PageTitle eyebrow="LINGUAPRO ADMINISTRATION" title={ownerSection === "overview" ? "Owner dashboard" : ({ students: "Students", teachers: "Teachers", admins: "Admins", users: "All users", courses: "Courses", lessons: "Lessons", assessments: "Assessments", assignments: "Assignments", certificates: "Certificates", pricing: "Plans & pricing", subscriptions: "Subscriptions", payments: "Payments", invoices: "Invoices", coupons: "Coupons & offers", categories: "Categories", materials: "Learning materials", announcements: "Announcements", settings: "Site settings", emails: "Email templates", reports: "Reports & analytics" } as Record<string, string>)[ownerSection] ?? "Owner dashboard"} subtitle={ownerSection === "overview" ? "Manage your LinguaPro platform from one place." : "Manage and review this part of your LinguaPro platform."} />
            <div className="owner-tabs">
              <button className={ownerSection === "overview" ? "owner-tab active" : "owner-tab"} onClick={() => { setOwnerSection("overview"); void loadOwnerData("overview"); }}><LayoutDashboard size={16} /> Overview</button>
              <button className={ownerSection === "users" ? "owner-tab active" : "owner-tab"} onClick={() => { setOwnerSection("users"); void loadOwnerData("users"); }}><Users size={16} /> All users</button>
              <button className={ownerSection === "students" ? "owner-tab active" : "owner-tab"} onClick={() => { setOwnerSection("students"); void loadOwnerData("students"); }}><GraduationCap size={16} /> Students / customers</button><button className={ownerSection === "teachers" ? "owner-tab active" : "owner-tab"} onClick={() => { setOwnerSection("teachers"); void loadOwnerData("teachers"); }}><ShieldCheck size={16} /> Teachers</button>
            </div>
            {ownerLoading && <div className="inline-message">Loading owner data…</div>}
            {ownerError && <div className="inline-message">{ownerError}</div>}
            {ownerSection === "overview" && ownerStats && <div className="owner-stats-grid">
              <StatCard icon={<Users />} label="Total registered users" value={String(ownerStats.totalUsers)} detail="All accounts" />
              <StatCard icon={<GraduationCap />} label="Active learners" value={String(ownerStats.activeLearners)} detail="Users with earned XP" />
              <StatCard icon={<Crown />} label="Premium users" value={String(ownerStats.premiumUsers)} detail="Premium plan accounts" />
              <StatCard icon={<UserRound />} label="Free users" value={String(ownerStats.freeUsers)} detail="Free plan accounts" />
              <StatCard icon={<Star />} label="Total XP earned" value={String(ownerStats.totalXp)} detail="Across all users" />
              <button className="owner-jump-card" onClick={() => { setOwnerSection("users"); void loadOwnerData("users"); }}><Users /><strong>Manage all users</strong><span>View every registered account</span><ChevronRight /></button>
              <button className="owner-jump-card" onClick={() => { setOwnerSection("students"); void loadOwnerData("students"); }}><GraduationCap /><strong>Student / customer list</strong><span>Users who have started learning</span><ChevronRight /></button>
            </div>}
            {ownerSection === "teachers" && <section className="surface-card owner-table-card"><div className="card-heading"><div><h3>Create teacher account</h3><p>Only the owner can create teacher accounts. Share the temporary password securely.</p></div></div><form className="form-grid" onSubmit={async (event) => { event.preventDefault(); setTeacherCreated(""); setOwnerError(""); try { const response = await fetch(apiBase + "/admin/teachers", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: teacherName, email: teacherEmail, password: teacherPassword }) }); const payload = await response.json() as { message?: string }; if (!response.ok) throw new Error(payload.message ?? "Could not create teacher."); setTeacherCreated(payload.message ?? "Teacher account created."); setTeacherName(""); setTeacherEmail(""); setTeacherPassword(""); await loadOwnerData("teachers"); } catch (error) { setOwnerError(error instanceof Error ? error.message : "Could not create teacher."); } }}><label>Teacher name<input required minLength={2} value={teacherName} onChange={(event) => setTeacherName(event.target.value)} placeholder="Full name" /></label><label>Teacher email<input required type="email" value={teacherEmail} onChange={(event) => setTeacherEmail(event.target.value)} placeholder="teacher@example.com" /></label><label>Temporary password<input required minLength={8} type="password" value={teacherPassword} onChange={(event) => setTeacherPassword(event.target.value)} placeholder="At least 8 characters" /></label><button className="button button-primary" disabled={ownerLoading}>Create teacher account <ChevronRight size={16} /></button></form>{teacherCreated && <div className="inline-message">{teacherCreated}</div>}<div className="owner-table-wrap"><table className="owner-table"><thead><tr><th>Name</th><th>Email</th><th>Plan</th><th>Created</th></tr></thead><tbody>{teacherList.map((teacher) => <tr key={teacher._id}><td>{teacher.name}</td><td>{teacher.email}</td><td>{teacher.plan}</td><td>{teacher.createdAt ? new Date(teacher.createdAt).toLocaleDateString() : "—"}</td></tr>)}{!teacherList.length && !ownerLoading && <tr><td colSpan={4}>No teacher accounts yet.</td></tr>}</tbody></table></div></section>}
            {(ownerSection === "users" || ownerSection === "students") && <section className="surface-card owner-table-card">
              <div className="card-heading"><div><h3>{ownerSection === "users" ? "All registered users" : "Students / customers"}</h3><p>{ownerSection === "users" ? "Every account registered in LinguaPro." : "Accounts with learning XP recorded."}</p></div><button className="button button-outline" onClick={() => void loadOwnerData(ownerSection as "users" | "students")}>Refresh</button></div>
              <div className="owner-table-wrap"><table className="owner-table"><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Plan</th><th>Language</th><th>Level</th><th>XP</th><th>Joined</th></tr></thead><tbody>
                {ownerUsers.map((user) => <tr key={user._id}><td>{user.name}</td><td>{user.email}</td><td>{user.role ?? "student"}</td><td><span className={user.plan === "Premium" ? "owner-plan premium" : "owner-plan"}>{user.plan}</span></td><td>{user.targetLanguage}</td><td>{user.level}</td><td>{user.totalXp ?? 0}</td><td>{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—"}</td></tr>)}
                {!ownerUsers.length && !ownerLoading && <tr><td colSpan={8}>No accounts found in this section yet.</td></tr>}
              </tbody></table></div>
            </section>} 
            {!["overview", "users", "students", "teachers"].includes(ownerSection) && <section className="surface-card owner-module-card">
              <div className="owner-module-hero"><div className="owner-module-symbol"><Sparkles size={25}/></div><div><span className="tag">OWNER CONTROL CENTER</span><h2>{({ admins: "Administrator access", courses: "Course management", lessons: "Lesson library", assessments: "Assessments & quizzes", assignments: "Assignment management", certificates: "Certificates", pricing: "Plans & pricing", subscriptions: "Subscriptions", payments: "Payments", invoices: "Invoices", coupons: "Coupons & offers", categories: "Learning categories", materials: "Learning materials", announcements: "Platform announcements", settings: "Site settings", emails: "Email templates", reports: "Reports & analytics" } as Record<string, string>)[ownerSection] ?? "Platform management"}</h2><p>Manage this area of LinguaPro from your owner workspace.</p></div></div>
              <div className="owner-module-grid"><article><div className="stat-icon"><Users size={20}/></div><strong>{ownerStats?.totalUsers ?? "—"}</strong><span>Registered accounts</span></article><article><div className="stat-icon"><BookOpen size={20}/></div><strong>—</strong><span>Items managed</span></article><article><div className="stat-icon"><TrendingUp size={20}/></div><strong>{ownerStats?.activeLearners ?? "—"}</strong><span>Active learners</span></article></div>
              <div className="owner-module-note"><ShieldCheck size={20}/><div><strong>Owner-only management</strong><p>This screen is ready as the UI foundation. Account overview, student list, teacher account creation, and user management use live backend APIs. This section needs its own database model and API endpoints before it can create or modify real records.</p></div></div>
              <div className="card-heading owner-module-actions"><div><h3>Quick actions</h3><p>Jump to available management tools.</p></div></div>
              <div className="owner-quick-actions"><button className="button button-outline" onClick={() => { setOwnerSection("users"); void loadOwnerData("users"); }}><Users size={16}/> All users</button><button className="button button-outline" onClick={() => { setOwnerSection("students"); void loadOwnerData("students"); }}><GraduationCap size={16}/> Students</button><button className="button button-outline" onClick={() => { setOwnerSection("teachers"); void loadOwnerData("teachers"); }}><ShieldCheck size={16}/> Teachers</button><button className="button button-outline" onClick={() => { setOwnerSection("overview"); void loadOwnerData("overview"); }}><LayoutDashboard size={16}/> Dashboard</button></div>
            </section>}
          </>}
          {page === ("owner" as Page) && !isOwner && <section className="surface-card"><h3>Owner access only</h3><p>Sign in using the owner account configured for this site.</p><button className="button button-primary" onClick={() => { setAuthMode("login"); setMessage(""); }}>Sign in as owner</button></section>}
          {page === ("teacher" as Page) && !isTeacher && <section className="surface-card"><h3>Teacher access only</h3><p>Sign in with your teacher account to open the teacher workspace.</p><button className="button button-primary" onClick={() => { setAuthMode("login"); setMessage(""); }}>Sign in as teacher</button></section>}
          {page === "dashboard" && authenticated && (isOwner || isTeacher) && <section className="surface-card"><h3>Open your workspace</h3><p>Your account has {isOwner ? "owner" : "teacher"} access.</p><button className="button button-primary" onClick={() => navigate(isOwner ? "owner" : "teacher")}>Go to {isOwner ? "Owner" : "Teacher"} dashboard</button></section>}
          {page === "dashboard" && <>
            <div className="page-heading">
              <div><div className="eyebrow">YOUR LEARNING SPACE</div><h1>Keep going, {profile.name || "learner"}! 👋</h1><p>A little practice every day makes a big difference.</p></div>
              <div className="date-chip">{new Date().toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}</div>
            </div>
            <section className="hero-card">
              <div className="hero-copy"><div className="hero-eyebrow"><Sparkles size={14} /> YOUR NEXT STEP</div><h2>Build confidence, one conversation at a time.</h2><p>Practise useful phrases, learn new words, and speak a little more every day.</p><button className="button button-white" onClick={() => navigate("speaking")}>Start speaking practice <ChevronRight size={17} /></button></div>
              <div className="hero-illustration"><div className="bubble bubble-one">Hello!</div><div className="bubble bubble-two">வணக்கம்</div><div className="hero-circle"><Languages size={55} /></div><Sparkles className="hero-sparkle" size={25} /></div>
            </section>
            <section className="stats-grid">
              <StatCard icon={<Flame />} label="Practice streak" value={(serverStreak || (completed ? 1 : 0)) + (serverStreak === 1 || (!serverStreak && completed) ? " day" : " days")} detail="Keep your rhythm" />
              <StatCard icon={<Star />} label="Learning points" value={xp + " XP"} detail="Earn XP as you learn" />
              <StatCard icon={<Target />} label="Today's tasks" value={completed + " / " + tasks.length} detail="Your daily goal" />
            </section>
            <SectionHeading title="Today's learning plan" subtitle="Small steps. Real progress." action="View all" onAction={() => navigate("courses")} />
            <div className="task-grid">{tasks.map((task) => <TaskCard key={task.id} task={task} onStart={() => task.id === "speak" || task.id === "listen" ? navigate("speaking") : task.id === "words" ? navigate("vocabulary") : completeTask(task.id)} />)}</div>
            <section className="momentum-panel">
              <div className="momentum-heading"><div><span className="coach-eyebrow-light">YOUR LEARNING JOURNEY</span><h3>Every step counts</h3><p>Celebrate the progress you have made so far.</p></div><div className="momentum-level"><Sparkles size={16}/><span>{xp >= 100 ? "Dedicated learner" : xp >= 40 ? "Growing learner" : "Getting started"}</span></div></div>
              <div className="achievement-grid">
                <article className={"achievement-card "+(completed > 0 ? "achievement-unlocked" : "")}><div className="achievement-icon achievement-purple"><Flame size={21}/></div><div><strong>First steps</strong><p>Complete your first daily activity</p><span>{completed > 0 ? "UNLOCKED" : "LOCKED · 1 ACTIVITY"}</span></div></article>
                <article className={"achievement-card "+(xp >= 40 ? "achievement-unlocked" : "")}><div className="achievement-icon achievement-blue"><Star size={21}/></div><div><strong>XP collector</strong><p>Earn 40 learning points</p><span>{xp >= 40 ? "UNLOCKED" : "LOCKED · "+xp+"/40 XP"}</span></div></article>
                <article className={"achievement-card "+(completed === tasks.length ? "achievement-unlocked" : "")}><div className="achievement-icon achievement-gold"><Target size={21}/></div><div><strong>Daily finisher</strong><p>Complete all daily activities</p><span>{completed === tasks.length ? "UNLOCKED" : "LOCKED · "+completed+"/"+tasks.length+" TASKS"}</span></div></article>
              </div>
            </section>
            <section className="bottom-grid">
              <div className="surface-card"><div className="card-heading"><div><h3>Your daily goal</h3><p>Complete today's activities to hit your target.</p></div><div className="round-icon"><Target size={20} /></div></div><div className="progress-meta"><span>Daily progress</span><strong>{Math.round(completed / tasks.length * 100)}%</strong></div><div className="progress-track"><span style={{ width: (completed / tasks.length * 100) + "%" }} /></div><p className="goal-note">{completed === tasks.length ? "Amazing! You completed today's plan." : (tasks.length - completed) + " activities left to reach your daily goal."}</p></div>
              <div className="surface-card continue-card"><div className="round-icon"><BookOpen size={20} /></div><div><h3>Continue learning</h3><p>{profile.targetLanguage} · {profile.level} level</p><button className="inline-link" onClick={() => navigate("courses")}>Open my learning <ChevronRight size={15} /></button></div></div>
            </section>
          </>}

          {page === ("assignments" as Page) && !authenticated && <section className="surface-card"><h3>Sign in to view assignments</h3><p>Your teacher will share assignments with your LinguaPro student account.</p><button className="button button-primary" onClick={() => setAuthMode("login")}>Sign in</button></section>}
          {page === ("assignments" as Page) && authenticated && (isTeacher || isOwner) && <section className="surface-card"><h3>Student assignments</h3><p>This page is for student accounts. Open your workspace to manage teacher assignments.</p></section>}
          {page === ("assignments" as Page) && authenticated && !isTeacher && !isOwner && <>
            <PageTitle eyebrow="YOUR CLASSROOM" title="Assignments" subtitle="Complete tasks assigned by your teacher and read their feedback." />
            <button className="button button-outline" onClick={() => void loadStudentAssignments()}>Refresh assignments</button>
            {assignmentMessage && <div className="inline-message">{assignmentMessage}</div>}
            {studentAssignments.map((assignment) => <section className="surface-card settings-card" key={assignment._id}>
              <div className="card-heading"><div><h3>{assignment.title}</h3><p>Teacher: {assignment.teacherId?.name ?? "LinguaPro teacher"} · Due: {assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : "No due date"}</p></div><span className="tag">{assignment.mySubmission ? "SUBMITTED" : "TO DO"}</span></div>
              <p>{assignment.description}</p>
              <form className="form-grid" onSubmit={async (event) => { event.preventDefault(); try { const answer = assignmentAnswers[assignment._id] ?? assignment.mySubmission?.answer ?? ""; const response = await fetch(apiBase + "/assignments/student/assignments/" + assignment._id + "/submit", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ answer }) }); const payload = await response.json() as { message?: string }; if (!response.ok) throw new Error(payload.message ?? "Could not submit answer."); setAssignmentMessage(payload.message ?? "Answer submitted."); await loadStudentAssignments(); } catch (error) { setAssignmentMessage(error instanceof Error ? error.message : "Could not submit answer."); } }}>
                <label>Your answer<textarea required minLength={1} maxLength={5000} rows={4} value={assignmentAnswers[assignment._id] ?? assignment.mySubmission?.answer ?? ""} onChange={(event) => setAssignmentAnswers((old) => ({ ...old, [assignment._id]: event.target.value }))} placeholder="Write your answer here..." /></label>
                <button className="button button-primary"><Send size={16} /> {assignment.mySubmission ? "Update submission" : "Submit answer"}</button>
              </form>
              {assignment.mySubmission?.score !== undefined && <div className="inline-message"><strong>Score: {assignment.mySubmission.score}/100</strong>{assignment.mySubmission.feedback ? " — " + assignment.mySubmission.feedback : ""}</div>}
              {assignment.mySubmission && assignment.mySubmission.score === undefined && assignment.mySubmission.feedback && <div className="inline-message">Teacher feedback: {assignment.mySubmission.feedback}</div>}
            </section>)}
            {!studentAssignments.length && !assignmentMessage && <section className="surface-card"><h3>No assignments yet</h3><p>Assignments from your teacher will appear here.</p></section>}
          </>}
          {page === "courses" && <>
            <PageTitle eyebrow="YOUR LEARNING PATH" title="My learning" subtitle="A clear path from first words to confident conversations." />
            <div className="course-grid">{[
              { icon: "🌱", level: "BASIC", title: "Everyday essentials", text: "Greetings, introductions, numbers, and common expressions.", progress: 20, lessons: "12 lessons" },
              { icon: "🚀", level: "INTERMEDIATE", title: "Speak at work", text: "Meetings, updates, requests, and workplace English.", progress: 0, lessons: "16 lessons" },
              { icon: "🎓", level: "ADVANCED", title: "Fluent conversations", text: "Express opinions and handle complex discussions.", progress: 0, lessons: "20 lessons" },
            ].map((course) => <article className="course-card" key={course.level}><div className="course-art">{course.icon}</div><span className="course-level">{course.level}</span><h3>{course.title}</h3><p>{course.text}</p><div className="course-meta"><span>{course.lessons}</span><span>{course.progress}% complete</span></div><div className="progress-track"><span style={{ width: course.progress + "%" }} /></div><button className="button button-outline full-width" onClick={() => navigate("speaking")}>Open course <ChevronRight size={16} /></button></article>)}</div>
            <StudentCourseLibrary apiBase={apiBase} />
          </>}

          {page === "speaking" && <>
            <PageTitle eyebrow="LINGUAPRO AI COACH" title="Speak with confidence" subtitle="A personal English coach for everyday life, workplace conversations, and career growth." />
            <section className="coach-hero"><div className="coach-hero-content"><span className="coach-eyebrow"><Sparkles size={14}/> YOUR PERSONAL SPEAKING COACH</span><h2>Think in English.<br/><span>Speak with confidence.</span></h2><p>Listen, speak naturally, get helpful corrections, and try again until you get it right.</p><div className="coach-hero-stats"><span><Flame size={15}/> Daily practice</span><span><Mic size={15}/> Voice feedback</span><span><Target size={15}/> {phrases.length} guided phrases</span></div></div><div className="coach-orb"><div className="coach-orb-inner"><AudioLines size={42}/></div><span className="coach-orb-dot dot-one"/><span className="coach-orb-dot dot-two"/><span className="coach-orb-dot dot-three"/></div></section>
            <div className="coach-workspace"><section className="surface-card speaking-card coach-practice-card">
              <div className="coach-progress-head"><div><span className="coach-eyebrow-light">YOUR CURRENT LESSON</span><h3>Guided speaking practice</h3></div><div className="coach-progress-ring" style={{background:"conic-gradient(#8b5cf6 "+((sessionComplete?100:(phraseIndex/phrases.length)*100))+"%, #eee8ff 0)"}}><span>{sessionComplete?100:Math.round((phraseIndex/phrases.length)*100)}%</span></div></div>
              <div className="speaking-top"><span className="tag">{profile.targetLanguage.toUpperCase()} · {profile.level.toUpperCase()}</span><span className="muted-small">Phrase {Math.min(phraseIndex+1,phrases.length)} of {phrases.length}</span></div>
              <div className="coach-phrase-panel"><div className="coach-phrase-icon"><Volume2 size={20}/></div><div className="phrase-mark">“</div><h2 className="practice-phrase">{phrase.phrase}</h2><p className="phrase-meaning">{phrase.meaning}</p><div className="example-box"><span>TRY THIS IN REAL LIFE</span><p>{phrase.example}</p></div></div>
              <div className="coach-actions"><button className="button button-outline" onClick={playPhrase} disabled={isListening}><Volume2 size={17}/> Listen</button><button className="button button-primary coach-record-button" onClick={recordSpeech} disabled={isListening||sessionComplete}><Mic size={17}/>{isListening?"Listening… speak now":"Try speaking"}</button></div>
              <div className="coach-instruction"><Mic size={16}/><span>Tap <strong>Try speaking</strong>, allow microphone access, and say the sentence clearly.</span></div>
              {spokenTranscript && <div className="coach-transcript"><span>WHAT I HEARD</span><p>“{spokenTranscript}”</p></div>}
              {coachCorrect!==null && <div className={"coach-result "+(coachCorrect?"coach-result-success":"coach-result-retry")}><span className="coach-result-icon">{coachCorrect?"✓":"↻"}</span><div><strong>{coachCorrect?"Well done! Sentence accepted.":"Good try — let's practise again."}</strong><p>{coachCorrect?"Your sentence matches the target well. Moving to the next phrase.":"Read the target sentence once more and try speaking again."}</p></div></div>}
              {message && <div className="coach-feedback"><Sparkles size={17}/><div><strong>Coach feedback</strong><p>{message}</p></div></div>}
              <p className="notice">Voice recognition depends on browser support and microphone permission. AI feedback is used when the backend AI provider is configured. Voice recordings are not stored by this app.</p>
              {sessionComplete && <div className="inline-message"><strong>Practice complete!</strong> You finished all {phrases.length} phrases. {authenticated?"Your speaking task XP is being saved to your account.":"Sign in to save XP to your account."}<div className="practice-controls"><button className="button button-primary" onClick={()=>{setPhraseIndex(0);setSessionComplete(false);setSpokenTranscript("");setCoachCorrect(null);setCoachAttempts(0);setMessage("New practice started. Listen to the first phrase.");}}>Practise again</button></div></div>}
              <div className="coach-footer-stats"><span><strong>{coachAttempts}</strong> speaking attempts</span><span><strong>{phraseIndex}</strong> phrases cleared</span><span><strong>{Math.max(0,phrases.length-phraseIndex)}</strong> to go</span></div>
            </section><aside className="coach-side-panel"><div className="coach-side-icon"><GraduationCap size={23}/></div><h3>Your speaking goals</h3><p>Small, repeatable steps help you speak more naturally over time.</p><div className="coach-goal-row"><span className="coach-goal-check"><Check size={14}/></span><div><strong>Listen carefully</strong><small>Notice sentence rhythm</small></div></div><div className="coach-goal-row"><span className="coach-goal-check"><Check size={14}/></span><div><strong>Speak out loud</strong><small>Practise the whole sentence</small></div></div><div className="coach-goal-row"><span className="coach-goal-check"><Check size={14}/></span><div><strong>Learn from feedback</strong><small>Try again when needed</small></div></div><div className="coach-side-tip"><Sparkles size={16}/><span>Tip: Speak at a comfortable pace. Clear words matter more than speed.</span></div></aside></div>
          </>}

{page === "vocabulary" && <>
            <PageTitle eyebrow="WORD BY WORD" title="Vocabulary builder" subtitle="Listen, repeat aloud, and answer correctly to unlock the next word." />
            <section className="vocab-learning-intro surface-card">
              <div><span className="tag">DAILY PRACTICE</span><h3>Learn one word at a time</h3><p>1. Listen to the example. 2. Press Repeat and speak the full sentence. 3. Select the correct answer. Both steps are required to continue.</p></div>
              <div className="vocab-score"><strong>{vocabCompleted.length}/6</strong><span>words practised</span></div>
            </section>
            {vocabCompleted.length === 6 && <section className="vocab-finish surface-card"><Check size={28} /><div><h3>Great work! எல்லா வார்த்தைகளையும் முடித்துவிட்டீர்கள்.</h3><p>நீங்கள் 6 வார்த்தைகளையும் பயிற்சி செய்துவிட்டீர்கள். உங்கள் முன்னேற்றம் சேமிக்கப்பட்டுள்ளது.</p></div><button className="button button-outline" onClick={() => { setVocabAnswers({}); setVocabChecked({}); setVocabCompleted([]); setVocabSpoken({}); setVocabCurrentIndex(0); setVocabSpeechMessage({}); localStorage.removeItem("linguapro-vocab-answers"); localStorage.removeItem("linguapro-vocab-checked"); localStorage.removeItem("linguapro-vocab-completed"); localStorage.removeItem("linguapro-vocab-spoken"); }}>Practise again</button></section>}
            <div className="vocabulary-grid">{[
              { word: "Improve", meaning: "To make something better.", tamil: "மேம்படுத்துதல் / இன்னும் சிறப்பாகச் செய்தல்", example: "I want to improve my English.", question: "What does Improve mean?", options: ["To make better", "To stop working", "To arrive late"], answer: "To make better" },
              { word: "Schedule", meaning: "A plan that lists when things happen.", tamil: "வேலைகள் எப்போது நடக்க வேண்டும் என்பதைக் காட்டும் அட்டவணை", example: "I will check the production schedule.", question: "What will you check?", options: ["The production schedule", "The lunch menu", "The bus ticket"], answer: "The production schedule" },
              { word: "Resolve", meaning: "To find a solution to a problem.", tamil: "ஒரு பிரச்சினைக்குத் தீர்வு காணுதல்", example: "Our team will resolve the issue.", question: "What does Resolve mean?", options: ["Create a problem", "Find a solution", "Forget the task"], answer: "Find a solution" },
              { word: "Reliable", meaning: "Able to be trusted or depended on.", tamil: "நம்பகமான / நம்பி ஒப்படைக்கக்கூடிய", example: "We need a reliable machine.", question: "What kind of machine do we need?", options: ["A reliable machine", "A broken machine", "A new schedule"], answer: "A reliable machine" },
              { word: "Available", meaning: "Free or ready to be used.", tamil: "கிடைக்கக்கூடிய / பயன்படுத்தத் தயாராக இருக்கும்", example: "The mechanic is available now.", question: "Who is ready now?", options: ["The manager", "The mechanic", "The customer"], answer: "The mechanic" },
              { word: "Complete", meaning: "To finish doing something.", tamil: "ஒரு வேலையை முடித்தல்", example: "I will complete the task today.", question: "When will I finish the task?", options: ["Yesterday", "Next month", "Today"], answer: "Today" },
            ].filter((_, itemIndex) => itemIndex === vocabCurrentIndex).map((item) => {
              const checked = !!vocabChecked[item.word];
              const correct = vocabAnswers[item.word] === item.answer;
              const done = vocabCompleted.includes(item.word);
              return <article className="word-card vocab-lesson-card" key={item.word}>
                <div className="word-letter">{item.word[0]}</div>
                <div className="vocab-lesson-content">
                  <div className="vocab-word-heading"><div><h3>{item.word}</h3><p>{item.meaning}</p></div><button className="icon-button" aria-label={"Listen to " + item.word} onClick={() => { if ("speechSynthesis" in window) { window.speechSynthesis.cancel(); window.speechSynthesis.speak(new SpeechSynthesisUtterance(item.word)); } }}><Volume2 size={17} /></button></div>
                  <div className="vocab-tamil"><strong>தமிழ் அர்த்தம்:</strong> {item.tamil}</div>
                  <div className="word-example"><strong>Example:</strong> {item.example}</div>
                  <div className="vocab-actions"><button className="button button-outline" onClick={() => { if ("speechSynthesis" in window) { window.speechSynthesis.cancel(); const utterance = new SpeechSynthesisUtterance(item.example); utterance.lang = "en-US"; window.speechSynthesis.speak(utterance); } }}><Volume2 size={15} /> Listen to sentence</button><button className="button button-primary" disabled={vocabListening === item.word} onClick={() => {
                    const speechWindow = window as Window & { SpeechRecognition?: new () => any; webkitSpeechRecognition?: new () => any };
                    const Recognition = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;
                    if (!Recognition) { setVocabSpeechMessage(prev => ({ ...prev, [item.word]: "இந்த browser-ல் voice recognition கிடைக்கவில்லை. Chrome-ல் திறந்து microphone permission கொடுத்து முயற்சிக்கவும்." })); return; }
                    const recognition = new Recognition(); recognition.lang = "en-US"; recognition.interimResults = false; recognition.maxAlternatives = 3;
                    setVocabListening(item.word); setVocabSpeechMessage(prev => ({ ...prev, [item.word]: "கேட்கிறேன்… முழு sentence-ஐ ஆங்கிலத்தில் சொல்லுங்கள்." }));
                    recognition.onresult = (event: any) => {
                      const transcript = String(event.results?.[0]?.[0]?.transcript || "");
                      const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9']/g, " ").replace(/\\s+/g, " ").trim();
                      const said = normalize(transcript); const expected = normalize(item.example);
                      const words = expected.split(" ").filter(Boolean); const matched = words.filter(word => said.includes(word)).length;
                      const pass = said === expected || (words.length >= 5 && matched / words.length >= 0.8);
                      setVocabSpeechMessage(prev => ({ ...prev, [item.word]: pass ? "Great! உங்கள் sentence சரியாக உள்ளது. / " + transcript : "நீங்கள் சொன்னது: “" + transcript + "”. இன்னொரு முறை முழு sentence-ஐ முயற்சிக்கவும்." }));
                      if (pass) {
                        setVocabSpoken(prev => ({ ...prev, [item.word]: true }));
                        if (vocabChecked[item.word] && vocabAnswers[item.word] === item.answer) {
                          setVocabCompleted(prev => prev.includes(item.word) ? prev : [...prev, item.word]);
                          setTimeout(() => setVocabCurrentIndex(index => Math.min(index + 1, 5)), 900);
                        }
                      }
                    };
                    recognition.onerror = (event: any) => setVocabSpeechMessage(prev => ({ ...prev, [item.word]: event.error === "not-allowed" ? "Microphone permission கொடுக்கவும்." : "Voice கேட்க முடியவில்லை. மீண்டும் முயற்சிக்கவும்." }));
                    recognition.onend = () => setVocabListening("");
                    try { recognition.start(); } catch { setVocabListening(""); setVocabSpeechMessage(prev => ({ ...prev, [item.word]: "மீண்டும் Repeat அழுத்தி முயற்சிக்கவும்." })); }
                  }}>{vocabListening === item.word ? "Listening…" : "Repeat"}</button></div>
                  {vocabSpeechMessage[item.word] && <p className={"vocab-speech-feedback " + (vocabSpoken[item.word] ? "feedback-correct" : "")}>{vocabSpeechMessage[item.word]}</p>}
                  <p className="vocab-step-status">Sentence: {vocabSpoken[item.word] ? "✓ completed" : "Not completed"} · Answer: {vocabChecked[item.word] && vocabAnswers[item.word] === item.answer ? "✓ correct" : "Not completed"}</p>
                  <div className="vocab-quiz"><strong>{item.question}</strong><div className="vocab-options">{item.options.map(option => <label className={"vocab-option " + (checked && option === item.answer ? "is-correct" : "") + (checked && vocabAnswers[item.word] === option && option !== item.answer ? " is-wrong" : "")} key={option}><input type="radio" name={"vocab-" + item.word} value={option} checked={vocabAnswers[item.word] === option} onChange={() => { setVocabAnswers(prev => ({ ...prev, [item.word]: option })); setVocabChecked(prev => ({ ...prev, [item.word]: false })); }} />{option}</label>)}</div>
                    {!checked ? <button className="button button-outline" disabled={!vocabAnswers[item.word]} onClick={() => { const isCorrect = vocabAnswers[item.word] === item.answer; setVocabChecked(prev => ({ ...prev, [item.word]: true })); if (isCorrect && vocabSpoken[item.word]) { setVocabCompleted(prev => prev.includes(item.word) ? prev : [...prev, item.word]); setTimeout(() => setVocabCurrentIndex(index => Math.min(index + 1, 5)), 900); } }}>Check answer</button> : <div className={"vocab-feedback " + (correct ? "feedback-correct" : "feedback-wrong")}>{correct ? "Correct! நல்ல பதில்." : "Not quite. சரியான பதில்: " + item.answer}{!correct && <button className="inline-link" onClick={() => { setVocabAnswers(prev => ({ ...prev, [item.word]: item.answer })); setVocabChecked(prev => ({ ...prev, [item.word]: true })); if (vocabSpoken[item.word]) { setVocabCompleted(prev => prev.includes(item.word) ? prev : [...prev, item.word]); setTimeout(() => setVocabCurrentIndex(index => Math.min(index + 1, 5)), 900); } }}>Show correct answer</button>}</div>}
                  </div>
                </div>
                {done && <span className="vocab-done" title="Practised"><Check size={16} /></span>}
              </article>;
            })}</div>
          </>}

{page === "progress" && <>
            <PageTitle eyebrow="YOUR ACHIEVEMENTS" title="My progress" subtitle="Celebrate the small wins that build lasting skills." />
            <div className="stats-grid"><StatCard icon={<Flame />} label="Practice streak" value={(serverStreak || (completed ? 1 : 0)) + (serverStreak === 1 || (!serverStreak && completed) ? " day" : " days")} detail="Days practised in a row" /><StatCard icon={<Star />} label="Total XP" value={String(xp)} detail="Points earned" /><StatCard icon={<Check />} label="Tasks completed" value={String(completed)} detail="In this demo session" /></div>
            <section className="surface-card progress-detail"><h3>Daily activity</h3><p className="muted-small">Today's learning plan</p>{tasks.map((task) => <div className="activity-row" key={task.id}><span className={"activity-check " + (task.completed ? "complete" : "")}>{task.completed ? <Check size={15} /> : <Target size={13} />}</span><div className="activity-copy"><strong>{task.title}</strong><span>{task.duration}</span></div><b>{task.completed ? "+" + task.xp + " XP" : "Not started"}</b></div>)}</section>
          </>}

          {page === "profile" && <>
            <PageTitle eyebrow="MAKE IT YOURS" title="Profile & settings" subtitle="Personalise your learning experience." />
            <section className="surface-card settings-card"><div className="profile-header"><div className="profile-avatar"><CircleUserRound size={35} /></div><div><h3>{profile.name || "Learner"}</h3><p>{profile.email || "Your email will appear here after sign in."}</p><span className="tag">{profile.plan.toUpperCase()} PLAN</span></div></div><div className="form-grid"><label>Display name<input value={profile.name} onChange={(event) => saveProfile("name", event.target.value)} /></label><label>Native language<select value={profile.nativeLanguage} onChange={(event) => saveProfile("nativeLanguage", event.target.value)}>{["Tamil", "English", "Malayalam", "Hindi", "Kannada", "Telugu"].map((language) => <option key={language}>{language}</option>)}</select></label><label>Learning language<select value={profile.targetLanguage} onChange={(event) => saveProfile("targetLanguage", event.target.value)}>{["English", "Malayalam", "Hindi", "Kannada", "Telugu", "Tamil"].map((language) => <option key={language}>{language}</option>)}</select></label><label>Learning level<select value={profile.level} onChange={(event) => saveProfile("level", event.target.value as LearningLevel)}>{["Basic", "Intermediate", "Advanced"].map((level) => <option key={level}>{level}</option>)}</select></label></div><p className="notice">{authenticated ? "Your account is connected. Profile preferences are currently stored on this device." : "Sign in to connect your account and sync learning progress."}</p><button className="button button-primary" onClick={() => setMessage("Your preferences are saved on this device.")}>Save preferences <Check size={16} /></button>{message && <div className="inline-message">{message}</div>}</section>
          </>}

          {page === "plans" && <>
            <PageTitle eyebrow="CHOOSE YOUR JOURNEY" title="Simple plans, real progress" subtitle="Start free, then upgrade when you are ready for more." />
            <div className="plan-grid"><article className="plan-card"><div className="plan-icon"><BookOpen /></div><span className="course-level">GET STARTED</span><h2>Free</h2><p className="plan-price">₹0 <span>/ forever</span></p><p>Build a consistent daily learning habit.</p><ul><li><Check /> Daily learning tasks</li><li><Check /> Basic speaking practice</li><li><Check /> Progress tracking</li><li><Check /> Vocabulary builder</li></ul><button className="button button-outline full-width" onClick={() => saveProfile("plan", "Free")}>Select free plan</button></article><article className="plan-card featured-plan"><div className="featured-label"><Crown size={14} /> MOST FLEXIBLE</div><div className="plan-icon"><Crown /></div><span className="course-level">GO FURTHER</span><h2>Premium</h2><p className="plan-price">Coming soon</p><p>More structured practice for your goals.</p><ul><li><Check /> Everything in Free</li><li><Check /> More guided lessons</li><li><Check /> Expanded practice library</li><li><Check /> Future AI tutor integration</li></ul><button className="button button-primary full-width" onClick={() => setMessage("Premium payments are not connected yet. No payment has been taken.")}>Notify me when available <ChevronRight size={16} /></button></article></div>{message && <div className="inline-message">{message}</div>}
          </>}

          {message && page !== "speaking" && page !== "profile" && page !== "plans" && <div className="inline-message global-message">{message}</div>}
          <footer className="app-footer"><span>◈ LinguaPro</span><span>Learn a language. Find your voice.</span><span>Demo · {new Date().getFullYear()}</span></footer>
        </main>
      </div>

      {authMode && <div className="modal-backdrop" onClick={() => setAuthMode(null)}><section className="auth-modal" onClick={(event) => event.stopPropagation()}><button className="modal-close icon-button" onClick={() => setAuthMode(null)} aria-label="Close"><X /></button><div className="auth-logo">◈</div><div className="eyebrow">WELCOME TO LINGUAPRO</div><h2>{authMode === "register" ? "Create your account" : "Welcome back"}</h2><p className="muted-small">Your next conversation starts here.</p><form onSubmit={submitAuth}>{authMode === "register" && <label>Full name<input required minLength={2} value={authName} onChange={(event) => setAuthName(event.target.value)} placeholder="Your name" /></label>}<label>Email address<input required type="email" value={authEmail} onChange={(event) => setAuthEmail(event.target.value)} placeholder="you@example.com" /></label><label>Password<input required minLength={8} type="password" value={authPassword} onChange={(event) => setAuthPassword(event.target.value)} placeholder="At least 8 characters" /></label><button className="button button-primary full-width" disabled={busy}>{busy ? "Please wait…" : authMode === "register" ? "Create account" : "Sign in"} <ChevronRight size={16} /></button></form>{message && <div className="inline-message">{message}</div>}<p className="auth-switch">{authMode === "register" ? "Already have an account?" : "New to LinguaPro?"} <button className="inline-link" onClick={() => { setAuthMode(authMode === "register" ? "login" : "register"); setMessage(""); }}>{authMode === "register" ? "Sign in" : "Create account"}</button></p><p className="notice"><LockKeyhole size={13} /> Account access works after backend deployment.</p></section></div>}
    </div>
  );
}

function StatCard({ icon, label, value, detail }: { icon: ReactNode; label: string; value: string; detail: string }) {
  return <article className="stat-card"><div className="stat-icon">{icon}</div><div><span>{label}</span><strong>{value}</strong><small>{detail}</small></div></article>;
}

function SectionHeading({ title, subtitle, action, onAction }: { title: string; subtitle: string; action?: string; onAction?: () => void }) {
  return <div className="section-heading"><div><h2>{title}</h2><p>{subtitle}</p></div>{action && <button className="inline-link" onClick={onAction}>{action} <ChevronRight size={15} /></button>}</div>;
}

function PageTitle({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle: string }) {
  return <div className="page-heading simple-heading"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{subtitle}</p></div></div>;
}

function TaskCard({ task, onStart }: { task: LearningTask; onStart: () => void }) {
  return <article className={"task-card " + (task.completed ? "task-completed" : "")}><div className="task-emoji">{task.icon}</div><div className="task-body"><div className="task-meta"><span>{task.duration}</span><span>+{task.xp} XP</span></div><h3>{task.title}</h3><p>{task.description}</p><button className={"task-action " + (task.completed ? "is-done" : "")} onClick={onStart}>{task.completed ? <><Check size={15} /> Completed</> : <>Start task <ChevronRight size={15} /></>}</button></div></article>;
}

export default App;
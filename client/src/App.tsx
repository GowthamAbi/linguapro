import { useEffect, useState } from "react";
import {
  AudioLines, BookOpen, Check, ChevronRight, CircleUserRound, Crown,
  Flame, GraduationCap, Languages, LayoutDashboard, LockKeyhole, LogIn,
  Menu, Mic, Settings, Sparkles, Star, Target, TrendingUp, Volume2, X, Users, ShieldCheck, UserRound, Activity,
} from "lucide-react";
import type { FormEvent, ReactNode } from "react";
import type { LearningLevel, LearningPhrase, LearningTask, Page, UserProfile } from "./types";

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
  targetLanguage: "English", level: "Basic", plan: "Free",
};

const navItems: { id: Page; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "courses", label: "My learning", icon: GraduationCap },
  { id: "speaking", label: "Speaking", icon: AudioLines },
  { id: "vocabulary", label: "Vocabulary", icon: BookOpen },
  { id: "progress", label: "My progress", icon: TrendingUp },
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

function App() {
  const [page, setPage] = useState<Page>("dashboard");
  const [menuOpen, setMenuOpen] = useState(false);
  const [profile, setProfile] = useState<UserProfile>(() => readStored("linguapro-profile", defaultProfile));
  const [tasks, setTasks] = useState<LearningTask[]>(() => {
    try {
      const stored = localStorage.getItem("linguapro-tasks");
      return stored ? JSON.parse(stored) as LearningTask[] : defaultTasks;
    } catch { return defaultTasks; }
  });
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [message, setMessage] = useState("");
  const [authMode, setAuthMode] = useState<"login" | "register" | null>(null);
  const [authName, setAuthName] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [serverXp, setServerXp] = useState<number | null>(null);
  const [serverStreak, setServerStreak] = useState(0);
  const [serverCompletedIds, setServerCompletedIds] = useState<string[]>([]);

  const apiBase = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ?? "";
  const ownerEmail = (import.meta.env.VITE_OWNER_EMAIL as string | undefined)?.trim().toLowerCase() ?? "";
  const isOwner = authenticated && !!ownerEmail && profile.email.trim().toLowerCase() === ownerEmail;
  const [ownerSection, setOwnerSection] = useState<"overview" | "users" | "students">("overview");
  const [ownerStats, setOwnerStats] = useState<{ totalUsers: number; premiumUsers: number; freeUsers: number; activeLearners: number; totalXp: number } | null>(null);
  const [ownerUsers, setOwnerUsers] = useState<Array<{ _id: string; name: string; email: string; plan: string; targetLanguage: string; level: string; totalXp: number; currentStreak: number; createdAt: string }>>([]);
  const [ownerLoading, setOwnerLoading] = useState(false);
  const [ownerError, setOwnerError] = useState("");

  async function loadOwnerData(section: "overview" | "users" | "students" = ownerSection) {
    if (!apiBase || !isOwner) return;
    setOwnerLoading(true); setOwnerError("");
    try {
      if (section === "overview") {
        const response = await fetch(apiBase + "/admin/overview", { credentials: "include" });
        const payload = await response.json() as { message?: string; data?: { totalUsers: number; premiumUsers: number; freeUsers: number; activeLearners: number; totalXp: number } };
        if (!response.ok || !payload.data) throw new Error(payload.message ?? "Could not load owner overview.");
        setOwnerStats(payload.data);
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
    if (!apiBase) return;
    fetch(apiBase + "/auth/me", { credentials: "include" })
      .then(async (response) => {
        if (!response.ok) return;
        const payload = await response.json() as { data?: { user?: { name?: string; email?: string; nativeLanguage?: string; targetLanguage?: string; level?: LearningLevel; plan?: "Free" | "Premium" } } };
        const user = payload.data?.user;
        if (user) {
          setAuthenticated(true);
          setProfile((current) => ({ ...current, ...user }));
          await loadServerProgress();
        }
      })
      .catch(() => undefined);
  }, []);
  const completed = tasks.filter((task) => task.completed || serverCompletedIds.includes(task.id)).length;
  const xp = serverXp ?? tasks.filter((task) => task.completed).reduce((sum, task) => sum + task.xp, 0);
  const phrase = phrases[phraseIndex];

  function navigate(next: Page) {
    setPage(next);
    setMenuOpen(false);
    setMessage("");
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
      const moveNext = () => {
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
              speakFeedback(payload.data.spokenFeedback, moveNext);
              return;
            }
          } catch {
            // Continue with local transcript feedback when the AI service is temporarily unavailable.
          }
        }
        setMessage(feedback);
        speakFeedback(correct ? "Well done. " + feedback + " Moving to the next phrase." : feedback + " Moving to the next phrase.", moveNext);
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
      const payload = await response.json() as { message?: string; data?: { user?: { name?: string; email?: string } } };
      if (!response.ok) throw new Error(payload.message ?? "Unable to sign in.");
      if (payload.data?.user?.name) saveProfile("name", payload.data.user.name);
      if (payload.data?.user?.email) saveProfile("email", payload.data.user.email);
      setAuthenticated(true);
      await loadServerProgress();
      setAuthMode(null);
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
          {isOwner && <button className="plan-chip owner-chip" onClick={() => { setOwnerSection("overview"); void loadOwnerData("overview"); navigate("owner" as Page); }}><ShieldCheck size={14} /> OWNER</button>}<button className="plan-chip" onClick={() => navigate("plans")}><Sparkles size={14} /> {profile.plan.toUpperCase()} PLAN</button>
          <button className="avatar-button" onClick={() => navigate("profile")} aria-label="Profile"><CircleUserRound size={20} /></button>
          <button className="text-button" onClick={() => { setAuthMode("login"); setMessage(""); }}><LogIn size={16} /> Sign in</button>
        </div>
      </header>

      <div className="app-layout">
        <aside className={"sidebar " + (menuOpen ? "sidebar-open" : "")}>
          <div className="sidebar-caption">YOUR WORKSPACE</div>
          <nav className="sidebar-nav">
            {navItems.map(({ id, label, icon: Icon }) => (
              <button key={id} className={"nav-item " + (page === id ? "active" : "")} onClick={() => navigate(id)}>
                <Icon size={18} /><span>{label}</span>{id === "dashboard" && <span className="nav-dot" />}
              </button>
            ))}
          </nav>
          <div className="sidebar-premium">
            <div className="premium-icon"><Crown size={20} /></div>
            <strong>Unlock your potential</strong>
            <p>Get more lessons and guided practice with Premium.</p>
            <button className="button button-light" onClick={() => navigate("plans")}>Explore plans <ChevronRight size={15} /></button>
          </div>
          <div className="sidebar-foot">LinguaPro · Learn every day</div>
        </aside>

        <main className="page-content">
          {page === ("owner" as Page) && isOwner && <>
            <PageTitle eyebrow="LINGUAPRO ADMINISTRATION" title="Owner dashboard" subtitle="Manage registered accounts and active learning customers separately." />
            <div className="owner-tabs">
              <button className={ownerSection === "overview" ? "owner-tab active" : "owner-tab"} onClick={() => { setOwnerSection("overview"); void loadOwnerData("overview"); }}><LayoutDashboard size={16} /> Overview</button>
              <button className={ownerSection === "users" ? "owner-tab active" : "owner-tab"} onClick={() => { setOwnerSection("users"); void loadOwnerData("users"); }}><Users size={16} /> All users</button>
              <button className={ownerSection === "students" ? "owner-tab active" : "owner-tab"} onClick={() => { setOwnerSection("students"); void loadOwnerData("students"); }}><GraduationCap size={16} /> Students / customers</button>
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
            {(ownerSection === "users" || ownerSection === "students") && <section className="surface-card owner-table-card">
              <div className="card-heading"><div><h3>{ownerSection === "users" ? "All registered users" : "Students / customers"}</h3><p>{ownerSection === "users" ? "Every account registered in LinguaPro." : "Accounts with learning XP recorded."}</p></div><button className="button button-outline" onClick={() => void loadOwnerData(ownerSection)}>Refresh</button></div>
              <div className="owner-table-wrap"><table className="owner-table"><thead><tr><th>Name</th><th>Email</th><th>Plan</th><th>Language</th><th>Level</th><th>XP</th><th>Joined</th></tr></thead><tbody>
                {ownerUsers.map((user) => <tr key={user._id}><td>{user.name}</td><td>{user.email}</td><td><span className={user.plan === "Premium" ? "owner-plan premium" : "owner-plan"}>{user.plan}</span></td><td>{user.targetLanguage}</td><td>{user.level}</td><td>{user.totalXp ?? 0}</td><td>{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—"}</td></tr>)}
                {!ownerUsers.length && !ownerLoading && <tr><td colSpan={7}>No accounts found in this section yet.</td></tr>}
              </tbody></table></div>
            </section>}
          </>}
          {page === ("owner" as Page) && !isOwner && <section className="surface-card"><h3>Owner access only</h3><p>Sign in using the owner account configured for this site.</p></section>}
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
            <section className="bottom-grid">
              <div className="surface-card"><div className="card-heading"><div><h3>Your daily goal</h3><p>Complete today's activities to hit your target.</p></div><div className="round-icon"><Target size={20} /></div></div><div className="progress-meta"><span>Daily progress</span><strong>{Math.round(completed / tasks.length * 100)}%</strong></div><div className="progress-track"><span style={{ width: (completed / tasks.length * 100) + "%" }} /></div><p className="goal-note">{completed === tasks.length ? "Amazing! You completed today's plan." : (tasks.length - completed) + " activities left to reach your daily goal."}</p></div>
              <div className="surface-card continue-card"><div className="round-icon"><BookOpen size={20} /></div><div><h3>Continue learning</h3><p>{profile.targetLanguage} · {profile.level} level</p><button className="inline-link" onClick={() => navigate("courses")}>Open my learning <ChevronRight size={15} /></button></div></div>
            </section>
          </>}

          {page === "courses" && <>
            <PageTitle eyebrow="YOUR LEARNING PATH" title="My learning" subtitle="A clear path from first words to confident conversations." />
            <div className="course-grid">{[
              { icon: "🌱", level: "BASIC", title: "Everyday essentials", text: "Greetings, introductions, numbers, and common expressions.", progress: 20, lessons: "12 lessons" },
              { icon: "🚀", level: "INTERMEDIATE", title: "Speak at work", text: "Meetings, updates, requests, and workplace English.", progress: 0, lessons: "16 lessons" },
              { icon: "🎓", level: "ADVANCED", title: "Fluent conversations", text: "Express opinions and handle complex discussions.", progress: 0, lessons: "20 lessons" },
            ].map((course) => <article className="course-card" key={course.level}><div className="course-art">{course.icon}</div><span className="course-level">{course.level}</span><h3>{course.title}</h3><p>{course.text}</p><div className="course-meta"><span>{course.lessons}</span><span>{course.progress}% complete</span></div><div className="progress-track"><span style={{ width: course.progress + "%" }} /></div><button className="button button-outline full-width" onClick={() => navigate("speaking")}>Open course <ChevronRight size={16} /></button></article>)}</div>
          </>}

          {page === "speaking" && <>
            <PageTitle eyebrow="SPEAK WITH CONFIDENCE" title="Speaking practice" subtitle="Listen to a phrase, say it aloud, and practise real-life conversations." />
            <section className="surface-card speaking-card"><div className="speaking-top"><span className="tag">{profile.targetLanguage.toUpperCase()} · {profile.level.toUpperCase()}</span><span className="muted-small">Phrase {phraseIndex + 1} of {phrases.length}</span></div><div className="phrase-mark">“</div><h2 className="practice-phrase">{phrase.phrase}</h2><p className="phrase-meaning">{phrase.meaning}</p><div className="example-box"><span>EXAMPLE</span><p>{phrase.example}</p></div><div className="practice-controls"><button className="button button-primary" onClick={playPhrase} disabled={isListening}><Volume2 size={17} /> Listen to phrase</button><button className="button button-outline" onClick={recordSpeech} disabled={isListening || sessionComplete}><Mic size={17} /> {isListening ? "Listening…" : "Try speaking"}</button><button className="button button-outline" onClick={() => { setPhraseIndex((current) => Math.min(current + 1, phrases.length - 1)); setMessage(""); }} disabled={isListening || sessionComplete || phraseIndex === phrases.length - 1}><ChevronRight size={17} /> Next phrase</button></div><p className="notice">Microphone recognition depends on browser support and permission. Voice is processed by your browser; LinguaPro does not store voice recordings.</p>{sessionComplete && <div className="inline-message"><strong>Practice complete!</strong> You finished all {phrases.length} phrases. {authenticated ? "Your speaking task XP is being saved to your account." : "Sign in to save XP to your account."}<div className="practice-controls"><button className="button button-primary" onClick={() => { setPhraseIndex(0); setSessionComplete(false); setMessage("New practice started. Listen to the first phrase."); }}>Practise again</button></div></div>}{message && <div className="inline-message">{message}</div>}</section>
          </>}

          {page === "vocabulary" && <>
            <PageTitle eyebrow="WORD BY WORD" title="Vocabulary builder" subtitle="Useful words for everyday life and your workplace." />
            <div className="vocabulary-grid">{[
              ["Improve", "To make something better.", "I want to improve my English."],
              ["Schedule", "A plan that lists when things happen.", "I will check the production schedule."],
              ["Resolve", "To find a solution to a problem.", "Our team will resolve the issue."],
              ["Reliable", "Able to be trusted or depended on.", "We need a reliable machine."],
              ["Available", "Free or ready to be used.", "The mechanic is available now."],
              ["Complete", "To finish doing something.", "I will complete the task today."],
            ].map(([word, meaning, example]) => <article className="word-card" key={word}><div className="word-letter">{word[0]}</div><div><h3>{word}</h3><p>{meaning}</p><div className="word-example">{example}</div></div><button className="icon-button" aria-label={"Listen to " + word} onClick={() => { if ("speechSynthesis" in window) window.speechSynthesis.speak(new SpeechSynthesisUtterance(word)); }}><Volume2 size={17} /></button></article>)}</div>
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
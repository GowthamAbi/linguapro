import { useEffect, useMemo, useState } from "react";
import { Award, BookOpen, ChevronDown, ChevronRight, Languages, RefreshCw, TrendingUp } from "lucide-react";
import ArticleALesson from "./ArticleALesson";

type QuizQuestion = { question: string; options: string[]; explanationTamil?: string };
type QuizResult = { score: number; total: number; percentage: number; results: { question: string; options: string[]; selectedAnswerIndex: number; correctAnswerIndex: number; isCorrect: boolean; explanationTamil: string }[] };
type Lesson = { _id: string; title: string; content?: string; tamilMeaning?: string; practiceType: "reading" | "speaking" | "listening" | "quiz" | "roleplay"; quizQuestions?: QuizQuestion[] };
type Module = { _id: string; title: string; lessons: Lesson[] };
type Course = {
  _id: string; title: string; description: string;
  learnerCategory: "kids" | "adults" | "working-professionals" | "job-seekers";
  level: "Basic" | "Intermediate" | "Advanced";
  industry: string; goal: string; modules: Module[];
  teacherId?: { name?: string } | string;
};
const categoryLabels: Record<Course["learnerCategory"], string> = {
  kids: "Kids", adults: "Adults", "working-professionals": "Working Professionals", "job-seekers": "Job Seekers",
};
const industryLabels: Record<string, string> = {
  general: "General English", "garments-textile": "Garments & Textile", "it-software": "IT & Software",
  healthcare: "Healthcare", "sales-customer-service": "Sales & Customer Service", other: "Other industry",
};
const practiceLabels: Record<Lesson["practiceType"], string> = {
  reading: "Reading", speaking: "Speaking", listening: "Listening", quiz: "Quiz", roleplay: "Role-play",
};

export default function StudentCourseLibrary({ apiBase, authToken = "", initialLevel = "all" }: { apiBase: string; authToken?: string; initialLevel?: "all" | "Basic" | "Intermediate" | "Advanced" }) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [category, setCategory] = useState("all");
  const [level, setLevel] = useState<"all" | "Basic" | "Intermediate" | "Advanced">(initialLevel);
  useEffect(() => { setLevel(initialLevel); }, [initialLevel]);
  const [expanded, setExpanded] = useState<string>("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<Record<string, { completedLessonIds: string[]; completedAt?: string | null }>>({});
  const [progressMessage, setProgressMessage] = useState("");
  const [openPractice, setOpenPractice] = useState<string>("");
  const [practiceResponses, setPracticeResponses] = useState<Record<string, string>>({});
  const [practiceFeedback, setPracticeFeedback] = useState<Record<string, string>>({});
  const [xpHistory, setXpHistory] = useState<{ totalXp: number; dailyXpGoal: number; todayXp: number; streakDays: number; activeDaysThisWeek: number; weekly: { date: string; day: string; xp: number }[]; events: { _id: string; label: string; xpEarned: number; earnedOn: string }[] } | null>(null);
  const [goalSaving, setGoalSaving] = useState(false);
  const [goalMessage, setGoalMessage] = useState("");
  const [quizSelections, setQuizSelections] = useState<Record<string, number[]>>({});
  const [quizResults, setQuizResults] = useState<Record<string, QuizResult>>({});
  const [quizMessages, setQuizMessages] = useState<Record<string, string>>({});
  const [practiceHistory, setPracticeHistory] = useState<{ _id: string; courseTitle: string; lessonTitle: string; response: string; practiceType: Lesson["practiceType"]; submittedAt: string }[]>([]);
  const [quizHistory, setQuizHistory] = useState<{ _id: string; courseTitle: string; lessonTitle: string; score: number; total: number; percentage: number; submittedAt: string }[]>([]);

  function authHeaders(extra?: HeadersInit): Headers { const headers = new Headers(extra); if (authToken) headers.set("Authorization", "Bearer " + authToken); return headers; }

  async function loadCourses() {
    if (!apiBase) { setError("Course library needs the backend API. Set VITE_API_URL in Netlify."); return; }
    setLoading(true); setError("");
    try {
      const response = await fetch(apiBase + "/student-courses", { credentials: "include", headers: authHeaders() });
      const payload = await response.json() as { message?: string; data?: { courses: Course[]; progress?: Record<string, { completedLessonIds: string[]; completedAt?: string | null }> } };
      if (!response.ok) throw new Error(payload.message ?? "Could not load published courses.");
      setCourses(payload.data?.courses ?? []);
      setProgress(payload.data?.progress ?? {});
      const xpResponse = await fetch(apiBase + "/student-courses/xp-history", { credentials: "include", headers: authHeaders() });
      const xpPayload = await xpResponse.json() as { data?: { totalXp: number; dailyXpGoal: number; todayXp: number; streakDays: number; activeDaysThisWeek: number; weekly: { date: string; day: string; xp: number }[]; events: { _id: string; label: string; xpEarned: number; earnedOn: string }[] } };
      if (xpResponse.ok) setXpHistory(xpPayload.data ?? null);
      const historyResponse = await fetch(apiBase + "/student-courses/practice-history", { credentials: "include", headers: authHeaders() });
      const historyPayload = await historyResponse.json() as { data?: { entries: typeof practiceHistory } };
      if (historyResponse.ok) setPracticeHistory(historyPayload.data?.entries ?? []);
      const quizHistoryResponse = await fetch(apiBase + "/student-courses/quiz-history", { credentials: "include", headers: authHeaders() });
      const quizHistoryPayload = await quizHistoryResponse.json() as { data?: { entries: typeof quizHistory } };
      if (quizHistoryResponse.ok) setQuizHistory(quizHistoryPayload.data?.entries ?? []);
    } catch (err) { setError(err instanceof Error ? err.message : "Could not load courses."); }
    finally { setLoading(false); }
  }
  useEffect(() => { void loadCourses(); }, [apiBase, authToken]);

  async function saveDailyGoal(dailyXpGoal: number) {
    setGoalSaving(true);
    setGoalMessage("");
    try {
      const response = await fetch(apiBase + "/student-courses/learning-goal", {
        method: "PATCH", credentials: "include", headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ dailyXpGoal }),
      });
      const payload = await response.json() as { message?: string; data?: { dailyXpGoal: number } };
      if (!response.ok || !payload.data) throw new Error(payload.message ?? "Could not save your daily goal.");
      setXpHistory((old) => old ? { ...old, dailyXpGoal: payload.data?.dailyXpGoal ?? dailyXpGoal } : old);
      setGoalMessage("Daily goal saved!");
    } catch (err) {
      setGoalMessage(err instanceof Error ? err.message : "Could not save your daily goal.");
    } finally {
      setGoalSaving(false);
    }
  }

  async function completeLesson(courseId: string, lessonId: string) {
    setProgressMessage("");
    try {
      const response = await fetch(apiBase + "/student-courses/" + courseId + "/lessons/" + lessonId + "/complete", {
        method: "POST", credentials: "include", headers: authHeaders({ "Content-Type": "application/json" }),
      });
      const payload = await response.json() as { message?: string; data?: { completedLessonIds: string[]; courseCompleted: boolean; xpEarned?: number; totalXp?: number } };
      if (!response.ok) throw new Error(payload.message ?? "Could not save lesson progress.");
      setProgress((old) => ({ ...old, [courseId]: { completedLessonIds: payload.data?.completedLessonIds ?? [...(old[courseId]?.completedLessonIds ?? []), lessonId], completedAt: payload.data?.courseCompleted ? new Date().toISOString() : old[courseId]?.completedAt ?? null } }));
      if (payload.data?.xpEarned) {
        const today = new Date().toISOString().slice(0, 10);
        setXpHistory((old) => old ? { ...old, totalXp: payload.data?.totalXp ?? old.totalXp, events: [{ _id: courseId + ":" + lessonId, label: "Course lesson", xpEarned: payload.data?.xpEarned ?? 0, earnedOn: today }, ...old.events].slice(0, 100), weekly: old.weekly.map((day) => day.date === today ? { ...day, xp: day.xp + (payload.data?.xpEarned ?? 0) } : day) } : old);
      }
      setProgressMessage(payload.data?.courseCompleted ? "🎉 Course completed! Excellent work. +" + (payload.data?.xpEarned ?? 0) + " XP" : "Lesson completed! +" + (payload.data?.xpEarned ?? 0) + " XP. Progress saved.");
    } catch (err) {
      setProgressMessage(err instanceof Error ? err.message : "Could not save lesson progress.");
    }
  }


  async function submitQuiz(courseId: string, lesson: Lesson) {
    const questions = lesson.quizQuestions ?? [];
    const answers = quizSelections[lesson._id] ?? [];
    if (!questions.length) {
      setQuizMessages((old) => ({ ...old, [lesson._id]: "இந்த பாடத்திற்கு ஆசிரியர் இன்னும் quiz questions சேர்க்கவில்லை." }));
      return;
    }
    if (answers.length !== questions.length || answers.some((answer) => answer === undefined || answer < 0 || answer > 3)) {
      setQuizMessages((old) => ({ ...old, [lesson._id]: "Submit செய்வதற்கு முன் எல்லா கேள்விகளுக்கும் பதில் தேர்வு செய்யுங்கள்." }));
      return;
    }
    setQuizMessages((old) => ({ ...old, [lesson._id]: "Checking your answers…" }));
    try {
      const response = await fetch(apiBase + "/student-courses/" + courseId + "/lessons/" + lesson._id + "/quiz", {
        method: "POST", credentials: "include", headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ answers }),
      });
      const payload = await response.json() as { message?: string; data?: QuizResult };
      if (!response.ok || !payload.data) throw new Error(payload.message ?? "Could not check quiz answers.");
      setQuizResults((old) => ({ ...old, [lesson._id]: payload.data as QuizResult }));
      setQuizMessages((old) => ({ ...old, [lesson._id]: "Quiz checked. Review each answer and the Tamil explanation below." }));
      const historyResponse = await fetch(apiBase + "/student-courses/quiz-history", { credentials: "include", headers: authHeaders() });
      const historyPayload = await historyResponse.json() as { data?: { entries: typeof quizHistory } };
      if (historyResponse.ok) setQuizHistory(historyPayload.data?.entries ?? []);
    } catch (err) {
      setQuizMessages((old) => ({ ...old, [lesson._id]: err instanceof Error ? err.message : "Could not check quiz answers." }));
    }
  }


  async function savePractice(courseId: string, lesson: Lesson) {
    const answer = (practiceResponses[lesson._id] ?? "").trim();
    if (answer.length < 8) {
      setPracticeFeedback((old) => ({ ...old, [lesson._id]: "Write at least one complete sentence (8 characters or more), then save." }));
      return;
    }
    setPracticeFeedback((old) => ({ ...old, [lesson._id]: "Saving your practice answer…" }));
    try {
      const response = await fetch(apiBase + "/student-courses/" + courseId + "/lessons/" + lesson._id + "/practice", {
        method: "POST",
        credentials: "include",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ response: answer }),
      });
      const payload = await response.json() as { message?: string };
      if (!response.ok) throw new Error(payload.message ?? "Could not save your practice answer.");
      setPracticeFeedback((old) => ({ ...old, [lesson._id]: "Saved successfully! Your practice answer has been recorded." }));
      const historyResponse = await fetch(apiBase + "/student-courses/practice-history", { credentials: "include", headers: authHeaders() });
      const historyPayload = await historyResponse.json() as { data?: { entries: typeof practiceHistory } };
      if (historyResponse.ok) setPracticeHistory(historyPayload.data?.entries ?? []);
    } catch (err) {
      setPracticeFeedback((old) => ({ ...old, [lesson._id]: err instanceof Error ? err.message : "Could not save your practice answer." }));
    }
  }

  const visibleCourses = useMemo(() => courses.filter((course) =>
    (category === "all" || course.learnerCategory === category) &&
    (level === "all" || course.level === level)
  ), [courses, category, level]);

  const dailyTasks = useMemo(() => visibleCourses.flatMap((course) =>
    course.modules.flatMap((module) => module.lessons.map((lesson) => ({
      course,
      module,
      lesson,
      completed: (progress[course._id]?.completedLessonIds ?? []).includes(lesson._id),
    })))
  ).filter((task) => !task.completed).slice(0, 3), [visibleCourses, progress]);

  return <section className="student-course-library">
    <div className="section-heading">
      <div><h2>Courses from your teachers</h2><p>Choose a course, study each lesson, and practise with Tamil explanations.</p></div>
      <button className="button button-outline" onClick={() => void loadCourses()} disabled={loading}><RefreshCw size={15} /> Refresh</button>
    </div>
    <section className="surface-card student-daily-tasks">
      <div className="card-heading"><div><span className="course-builder-eyebrow">YOUR NEXT STEPS</span><h3>Today's Study Tasks</h3><p>Complete these lessons to practise English and earn XP.</p></div><span className="student-task-count">{dailyTasks.length} left</span></div>
      {dailyTasks.length ? <div className="student-task-list">{dailyTasks.map((task, index) => <article className="student-task-row" key={task.course._id + ":" + task.lesson._id}>
        <span className="student-task-number">{index + 1}</span>
        <div className="student-task-copy"><strong>{task.lesson.title}</strong><small>{task.course.title} · {task.module.title}</small><span>{practiceLabels[task.lesson.practiceType]} · Earn 10 XP</span></div>
        <button type="button" className="button button-primary" onClick={() => { setExpanded(task.course._id); setOpenPractice(task.lesson._id); setPracticeFeedback((old) => ({ ...old, [task.lesson._id]: "" })); }}>Start</button>
      </article>)}</div> : <div className="student-tasks-complete"><strong>🎉 You're all caught up!</strong><p>No unfinished lessons in this course filter. Choose another level or check your courses below.</p></div>}
    </section>
    <section className="surface-card student-xp-panel">
      <div className="card-heading"><div><span className="course-builder-eyebrow">YOUR LEARNING MOMENTUM</span><h3>XP history &amp; weekly progress</h3><p>Your recent XP rewards and activity from the last 7 days.</p></div><div className="student-xp-total"><strong>{xpHistory?.totalXp ?? 0}</strong><span>Total XP</span></div></div>
      <div className="student-daily-goal-grid">
        <article className="student-goal-metric"><span aria-hidden="true">🔥</span><div><strong>{xpHistory?.streakDays ?? 0} day{(xpHistory?.streakDays ?? 0) === 1 ? "" : "s"}</strong><small>Learning streak</small></div></article>
        <article className="student-goal-metric"><span aria-hidden="true">🎯</span><div><strong>{xpHistory?.todayXp ?? 0} / {xpHistory?.dailyXpGoal ?? 20} XP</strong><small>Today's goal</small></div></article>
        <article className="student-goal-metric"><span aria-hidden="true">📅</span><div><strong>{xpHistory?.activeDaysThisWeek ?? 0} / 7 days</strong><small>Weekly activity</small></div></article>
      </div>
      <div className="student-daily-goal-setting">
        <div><strong>Set your daily XP goal</strong><small>Choose a realistic target and build a steady habit.</small></div>
        <div className="student-goal-options">{[10, 20, 30, 50].map((goal) => <button type="button" key={goal} className={"button " + ((xpHistory?.dailyXpGoal ?? 20) === goal ? "button-primary" : "button-outline")} disabled={goalSaving} onClick={() => void saveDailyGoal(goal)}>{goal} XP</button>)}</div>
        {goalMessage && <p role="status">{goalMessage}</p>}
      </div>
      <div className="student-goal-progress" aria-label="Today's XP goal progress"><div><span>Daily goal progress</span><strong>{Math.min(100, Math.round(((xpHistory?.todayXp ?? 0) / Math.max(1, xpHistory?.dailyXpGoal ?? 20)) * 100))}%</strong></div><div className="student-progress-track"><span style={{ width: Math.min(100, ((xpHistory?.todayXp ?? 0) / Math.max(1, xpHistory?.dailyXpGoal ?? 20)) * 100) + "%" }} /></div></div>
      <div className="xp-week-chart" role="img" aria-label="XP earned each day in the last seven days">
        {(xpHistory?.weekly ?? []).map((day) => <div className="xp-week-day" key={day.date}><strong>{day.xp}</strong><div className="xp-week-bar"><span style={{ height: Math.max(day.xp > 0 ? 8 : 3, (day.xp / Math.max(1, ...(xpHistory?.weekly.map((item) => item.xp) ?? [1]))) * 100) + "%" }} /></div><small>{day.day}</small></div>)}
      </div>
      <div className="xp-history-list"><div className="xp-history-heading"><TrendingUp size={16} /><strong>Recent XP rewards</strong></div>
        {(xpHistory?.events ?? []).slice(0, 5).map((event) => <div className="xp-history-row" key={event._id}><div><strong>{event.label}</strong><small>{event.earnedOn}</small></div><b>+{event.xpEarned} XP</b></div>)}
        {(!xpHistory?.events.length) && <p className="muted-small">Complete a lesson or daily practice to start building your XP history.</p>}
      </div>
    </section>
    <section className="surface-card student-practice-history">
      <div className="card-heading"><div><span className="course-builder-eyebrow">YOUR PRACTICE JOURNAL</span><h3>Recent practice answers</h3><p>Your latest saved responses, so you can review your learning.</p></div><span className="tag">{practiceHistory.length} saved</span></div>
      {practiceHistory.length === 0 ? <p className="muted-small">Your saved practice answers will appear here after you submit one.</p> : <div className="student-practice-history-list">
        {practiceHistory.slice(0, 5).map((entry) => <article className="student-practice-history-entry" key={entry._id}>
          <div className="student-practice-history-meta"><strong>{entry.lessonTitle}</strong><span className="tag">{practiceLabels[entry.practiceType]}</span></div>
          <p>{entry.response}</p>
          <small>{entry.courseTitle} · {new Date(entry.submittedAt).toLocaleString()}</small>
        </article>)}
      </div>}
    </section>
    <section className="surface-card student-practice-history">
      <div className="card-heading"><div><span className="course-builder-eyebrow">YOUR QUIZ PROGRESS</span><h3>Quiz score history</h3><p>Your latest quiz attempts and scores are saved to your account.</p></div><span className="tag">{quizHistory.length} attempts</span></div>
      {quizHistory.length > 0 && <div className="student-quiz-progress-chart" role="img" aria-label="Recent quiz scores as percentages">
        <div className="student-quiz-chart-heading"><strong>Recent score trend</strong><span>Score out of 100%</span></div>
        <div className="student-quiz-chart-bars">{quizHistory.slice(0, 7).slice().reverse().map((attempt, index) => <div className="student-quiz-chart-bar" key={attempt._id} title={attempt.lessonTitle + ": " + attempt.percentage + "%"}>
          <strong>{attempt.percentage}%</strong><div className="student-quiz-chart-track"><span style={{ height: attempt.percentage + "%" }} /></div><small>{index + 1}</small>
        </div>)}</div>
        <p className="muted-small">Bars are shown from oldest to newest among your latest seven attempts. Use the scores below to identify lessons to practise again.</p>
      </div>}
      {quizHistory.length > 0 && <div className="student-quiz-review-focus"><strong>Lessons to review</strong>{[...quizHistory].sort((a, b) => a.percentage - b.percentage).slice(0, 3).map((attempt) => <div className="student-quiz-review-row" key={attempt._id}><span>{attempt.lessonTitle}</span><span className="tag">{attempt.percentage}%</span></div>)}</div>}
      {quizHistory.length === 0 ? <p className="muted-small">Complete and submit a quiz to see your score history here.</p> : <div className="student-practice-history-list">
        {quizHistory.slice(0, 8).map((attempt) => <article className="student-practice-history-entry" key={attempt._id}>
          <div className="student-practice-history-meta"><strong>{attempt.lessonTitle}</strong><span className="tag">{attempt.score}/{attempt.total} · {attempt.percentage}%</span></div>
          <p>{attempt.courseTitle}</p><small>{new Date(attempt.submittedAt).toLocaleString()}</small>
        </article>)}
      </div>}
    </section>
    <div className="course-library-filters">
      <label>Learner category<select value={category} onChange={(event) => setCategory(event.target.value)}><option value="all">All categories</option><option value="kids">Kids</option><option value="adults">Adults</option><option value="working-professionals">Working Professionals</option><option value="job-seekers">Job Seekers</option></select></label>
      <label>Level<select value={level} onChange={(event) => setLevel(event.target.value as "all" | "Basic" | "Intermediate" | "Advanced")}><option value="all">All levels</option><option>Basic</option><option>Intermediate</option><option>Advanced</option></select></label>
    </div>
    {loading && <p className="inline-message">Loading courses…</p>}
    {error && <p className="inline-message">{error}</p>}
    {progressMessage && <p className="inline-message">{progressMessage}</p>}
    {!loading && !error && visibleCourses.length === 0 && <div className="surface-card"><h3>No published courses yet</h3><p>When your teacher publishes a course, it will appear here.</p></div>}
    <div className="student-course-list">{visibleCourses.map((course) => {
      const isExpanded = expanded === course._id;
      const teacherName = typeof course.teacherId === "object" ? course.teacherId?.name : undefined;
      const lessonCount = course.modules.reduce((sum, module) => sum + module.lessons.length, 0);
      const completedIds = progress[course._id]?.completedLessonIds ?? [];
      const courseDone = Boolean(progress[course._id]?.completedAt) || (lessonCount > 0 && completedIds.length >= lessonCount);
      return <article className="surface-card student-course-item" key={course._id}>
        <div className="student-course-summary">
          <div className="course-art"><BookOpen size={30} /></div>
          <div className="student-course-copy">
            <span className="course-level">{course.level.toUpperCase()} · {categoryLabels[course.learnerCategory]}</span>
            <h3>{course.title}</h3><p>{course.description}</p>
            <div className="course-meta"><span>{industryLabels[course.industry] ?? course.industry}</span><span>{course.modules.length} modules · {lessonCount} lessons</span></div>
            {teacherName && <p className="muted-small">Teacher: {teacherName}</p>}
          </div>
          <button className="button button-outline" onClick={() => setExpanded(isExpanded ? "" : course._id)}>{isExpanded ? "Hide lessons" : "Open course"} {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}</button>
        </div>
        <div className="student-course-progress">
          <div><strong>{completedIds.length}/{lessonCount} lessons completed</strong><span>{lessonCount ? Math.round((completedIds.length / lessonCount) * 100) : 0}%</span></div>
          <div className="student-progress-track"><span style={{ width: (lessonCount ? Math.min(100, (completedIds.length / lessonCount) * 100) : 0) + "%" }} /></div>
        </div>
        {courseDone && <section className="student-certificate"><div className="certificate-seal"><Award size={28} /></div><span className="certificate-kicker">CERTIFICATE OF COMPLETION</span><h3>{course.title}</h3><p>This recognises successful completion of the course by the signed-in learner.</p><div className="certificate-signature"><span>LinguaPro Learning</span><small>{progress[course._id]?.completedAt ? new Date(progress[course._id]?.completedAt as string).toLocaleDateString() : "Completed"}</small></div><button className="button button-outline certificate-print-button" onClick={() => window.print()}><Award size={15} /> Print / Save certificate</button></section>}
        {isExpanded && <div className="student-course-lessons">
          {course.modules.length === 0 && <p>This course has no modules yet. Check back soon.</p>}
          {course.modules.map((module, moduleIndex) => <section className="student-module" key={module._id}>
            <h4><span>{moduleIndex + 1}</span>{module.title}</h4>
            {module.lessons.length === 0 && <p className="muted-small">Lessons will be added soon.</p>}
            {module.lessons.map((lesson, lessonIndex) => {
              const isDone = (progress[course._id]?.completedLessonIds ?? []).includes(lesson._id);
              return <article className={"student-lesson " + (isDone ? "student-lesson-done" : "")} key={lesson._id}>
                <div className="student-lesson-heading"><strong>{moduleIndex + 1}.{lessonIndex + 1} {lesson.title}</strong><span className="tag">{practiceLabels[lesson.practiceType]}</span></div>
                {lesson.title === "Article A: The First Step" ? <ArticleALesson isDone={isDone} onComplete={() => void completeLesson(course._id, lesson._id)} /> : <>
                  {lesson.content && <p>{lesson.content}</p>}
                  {lesson.tamilMeaning && <div className="student-tamil-meaning"><Languages size={16} /><div><strong>தமிழ் விளக்கம்</strong><p>{lesson.tamilMeaning}</p></div></div>}
                  <button className="button button-outline student-practice-toggle" type="button" onClick={() => { setOpenPractice(openPractice === lesson._id ? "" : lesson._id); setPracticeFeedback((old) => ({ ...old, [lesson._id]: "" })); }}>{openPractice === lesson._id ? "Hide practice" : "Start practice"} · {practiceLabels[lesson.practiceType]}</button>
                  {openPractice === lesson._id && <div className="student-practice-panel">
                    {lesson.practiceType === "quiz" ? <>
                      <strong>🧠 Multiple-choice quiz</strong>
                      {(lesson.quizQuestions ?? []).length === 0 ? <p>இந்த பாடத்திற்கு quiz questions இன்னும் சேர்க்கப்படவில்லை. ஆசிரியரிடம் கேளுங்கள்.</p> : <>
                        {(lesson.quizQuestions ?? []).map((question, qi) => <fieldset className="student-quiz-question" key={qi}>
                          <legend>{qi + 1}. {question.question}</legend>
                          {question.options.map((option, oi) => <label className="student-quiz-option" key={oi}><input type="radio" name={lesson._id + "-quiz-" + qi} checked={quizSelections[lesson._id]?.[qi] === oi} onChange={() => { setQuizSelections((old) => { const answers = [...(old[lesson._id] ?? [])]; answers[qi] = oi; return { ...old, [lesson._id]: answers }; }); setQuizResults((old) => { const next = { ...old }; delete next[lesson._id]; return next; }); setQuizMessages((old) => ({ ...old, [lesson._id]: "" })); }} /> <span>{option}</span></label>)}
                        </fieldset>)}
                        <button type="button" className="button button-primary" onClick={() => void submitQuiz(course._id, lesson)}>Submit quiz</button>
                        {quizMessages[lesson._id] && <p className="student-practice-feedback" role="status">{quizMessages[lesson._id]}</p>}
                        {quizResults[lesson._id] && <div className="student-quiz-results"><h4>Score: {quizResults[lesson._id].score}/{quizResults[lesson._id].total} ({quizResults[lesson._id].percentage}%)</h4>{quizResults[lesson._id].results.map((result, ri) => <article key={ri}><strong>{ri + 1}. {result.isCorrect ? "✓ Correct" : "✗ Incorrect"} — {result.question}</strong><p>Correct answer: {result.options[result.correctAnswerIndex]}</p>{result.explanationTamil && <p className="student-tamil-meaning"><Languages size={16} /> தமிழ் விளக்கம்: {result.explanationTamil}</p>}</article>)}</div>}
                      </>}
                    </> : <>
                      <strong>{lesson.practiceType === "speaking" ? "🎙️ Speaking challenge" : lesson.practiceType === "listening" ? "🎧 Listen & repeat" : lesson.practiceType === "roleplay" ? "💬 Real-life role-play" : "✍️ Reading & writing practice"}</strong>
                      <p>{lesson.practiceType === "speaking" ? "Say the lesson phrase aloud. Then type what you said from memory." : lesson.practiceType === "listening" ? "Read the lesson aloud slowly, repeat it twice, then type the key sentence you remember." : lesson.practiceType === "roleplay" ? "Imagine you are using this English in a real conversation. Write your reply below." : "Write one sentence using the new phrase or idea from this lesson."}</p>
                      <textarea aria-label={"Practice response for " + lesson.title} rows={3} value={practiceResponses[lesson._id] ?? ""} onChange={(event) => { setPracticeResponses((old) => ({ ...old, [lesson._id]: event.target.value })); setPracticeFeedback((old) => ({ ...old, [lesson._id]: "" })); }} placeholder="Type your practice answer here…" />
                      <button type="button" className="button button-primary" onClick={() => void savePractice(course._id, lesson)}>Save my practice</button>
                      {practiceFeedback[lesson._id] && <p className="student-practice-feedback" role="status">{practiceFeedback[lesson._id]}</p>}
                    </>}
                  </div>}
                  <button className={"button " + (isDone ? "button-outline" : "button-primary") + " student-lesson-complete"} disabled={isDone} onClick={() => void completeLesson(course._id, lesson._id)}>{isDone ? "✓ Completed" : "Mark lesson complete"}</button>
                </>}
              </article>;
            })}
          </section>)}
        </div>}
      </article>;
    })}</div>
  </section>;
}

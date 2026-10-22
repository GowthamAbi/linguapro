import { useEffect, useMemo, useState } from "react";
import { Award, BookOpen, ChevronDown, ChevronRight, Languages, RefreshCw, TrendingUp } from "lucide-react";

type Lesson = { _id: string; title: string; content?: string; tamilMeaning?: string; practiceType: "reading" | "speaking" | "listening" | "quiz" | "roleplay" };
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
  const [xpHistory, setXpHistory] = useState<{ totalXp: number; weekly: { date: string; day: string; xp: number }[]; events: { _id: string; label: string; xpEarned: number; earnedOn: string }[] } | null>(null);

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
      const xpPayload = await xpResponse.json() as { data?: { totalXp: number; weekly: { date: string; day: string; xp: number }[]; events: { _id: string; label: string; xpEarned: number; earnedOn: string }[] } };
      if (xpResponse.ok) setXpHistory(xpPayload.data ?? null);
    } catch (err) { setError(err instanceof Error ? err.message : "Could not load courses."); }
    finally { setLoading(false); }
  }
  useEffect(() => { void loadCourses(); }, [apiBase, authToken]);

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

  const visibleCourses = useMemo(() => courses.filter((course) =>
    (category === "all" || course.learnerCategory === category) &&
    (level === "all" || course.level === level)
  ), [courses, category, level]);

  return <section className="student-course-library">
    <div className="section-heading">
      <div><h2>Courses from your teachers</h2><p>Choose a course, study each lesson, and practise with Tamil explanations.</p></div>
      <button className="button button-outline" onClick={() => void loadCourses()} disabled={loading}><RefreshCw size={15} /> Refresh</button>
    </div>
    <section className="surface-card student-xp-panel">
      <div className="card-heading"><div><span className="course-builder-eyebrow">YOUR LEARNING MOMENTUM</span><h3>XP history &amp; weekly progress</h3><p>Your recent XP rewards and activity from the last 7 days.</p></div><div className="student-xp-total"><strong>{xpHistory?.totalXp ?? 0}</strong><span>Total XP</span></div></div>
      <div className="xp-week-chart" role="img" aria-label="XP earned each day in the last seven days">
        {(xpHistory?.weekly ?? []).map((day) => <div className="xp-week-day" key={day.date}><strong>{day.xp}</strong><div className="xp-week-bar"><span style={{ height: Math.max(day.xp > 0 ? 8 : 3, (day.xp / Math.max(1, ...(xpHistory?.weekly.map((item) => item.xp) ?? [1]))) * 100) + "%" }} /></div><small>{day.day}</small></div>)}
      </div>
      <div className="xp-history-list"><div className="xp-history-heading"><TrendingUp size={16} /><strong>Recent XP rewards</strong></div>
        {(xpHistory?.events ?? []).slice(0, 5).map((event) => <div className="xp-history-row" key={event._id}><div><strong>{event.label}</strong><small>{event.earnedOn}</small></div><b>+{event.xpEarned} XP</b></div>)}
        {(!xpHistory?.events.length) && <p className="muted-small">Complete a lesson or daily practice to start building your XP history.</p>}
      </div>
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
                {lesson.content && <p>{lesson.content}</p>}
                {lesson.tamilMeaning && <div className="student-tamil-meaning"><Languages size={16} /><div><strong>தமிழ் விளக்கம்</strong><p>{lesson.tamilMeaning}</p></div></div>}
                <button className={"button " + (isDone ? "button-outline" : "button-primary") + " student-lesson-complete"} disabled={isDone} onClick={() => void completeLesson(course._id, lesson._id)}>{isDone ? "✓ Completed" : "Mark lesson complete"}</button>
              </article>;
            })}
          </section>)}
        </div>}
      </article>;
    })}</div>
  </section>;
}

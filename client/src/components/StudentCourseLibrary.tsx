import { useEffect, useMemo, useState } from "react";
import { BookOpen, ChevronDown, ChevronRight, Languages, RefreshCw } from "lucide-react";

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

export default function StudentCourseLibrary({ apiBase }: { apiBase: string }) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [category, setCategory] = useState("all");
  const [level, setLevel] = useState("all");
  const [expanded, setExpanded] = useState<string>("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function loadCourses() {
    if (!apiBase) { setError("Course library needs the backend API. Set VITE_API_URL in Netlify."); return; }
    setLoading(true); setError("");
    try {
      const response = await fetch(apiBase + "/student-courses", { credentials: "include" });
      const payload = await response.json() as { message?: string; data?: { courses: Course[] } };
      if (!response.ok) throw new Error(payload.message ?? "Could not load published courses.");
      setCourses(payload.data?.courses ?? []);
    } catch (err) { setError(err instanceof Error ? err.message : "Could not load courses."); }
    finally { setLoading(false); }
  }
  useEffect(() => { void loadCourses(); }, [apiBase]);

  const visibleCourses = useMemo(() => courses.filter((course) =>
    (category === "all" || course.learnerCategory === category) &&
    (level === "all" || course.level === level)
  ), [courses, category, level]);

  return <section className="student-course-library">
    <div className="section-heading">
      <div><h2>Courses from your teachers</h2><p>Choose a course, study each lesson, and practise with Tamil explanations.</p></div>
      <button className="button button-outline" onClick={() => void loadCourses()} disabled={loading}><RefreshCw size={15} /> Refresh</button>
    </div>
    <div className="course-library-filters">
      <label>Learner category<select value={category} onChange={(event) => setCategory(event.target.value)}><option value="all">All categories</option><option value="kids">Kids</option><option value="adults">Adults</option><option value="working-professionals">Working Professionals</option><option value="job-seekers">Job Seekers</option></select></label>
      <label>Level<select value={level} onChange={(event) => setLevel(event.target.value)}><option value="all">All levels</option><option>Basic</option><option>Intermediate</option><option>Advanced</option></select></label>
    </div>
    {loading && <p className="inline-message">Loading courses…</p>}
    {error && <p className="inline-message">{error}</p>}
    {!loading && !error && visibleCourses.length === 0 && <div className="surface-card"><h3>No published courses yet</h3><p>When your teacher publishes a course, it will appear here.</p></div>}
    <div className="student-course-list">{visibleCourses.map((course) => {
      const isExpanded = expanded === course._id;
      const teacherName = typeof course.teacherId === "object" ? course.teacherId?.name : undefined;
      const lessonCount = course.modules.reduce((sum, module) => sum + module.lessons.length, 0);
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
        {isExpanded && <div className="student-course-lessons">
          {course.modules.length === 0 && <p>This course has no modules yet. Check back soon.</p>}
          {course.modules.map((module, moduleIndex) => <section className="student-module" key={module._id}>
            <h4><span>{moduleIndex + 1}</span>{module.title}</h4>
            {module.lessons.length === 0 && <p className="muted-small">Lessons will be added soon.</p>}
            {module.lessons.map((lesson, lessonIndex) => <article className="student-lesson" key={lesson._id}>
              <div className="student-lesson-heading"><strong>{moduleIndex + 1}.{lessonIndex + 1} {lesson.title}</strong><span className="tag">{practiceLabels[lesson.practiceType]}</span></div>
              {lesson.content && <p>{lesson.content}</p>}
              {lesson.tamilMeaning && <div className="student-tamil-meaning"><Languages size={16} /><div><strong>தமிழ் விளக்கம்</strong><p>{lesson.tamilMeaning}</p></div></div>}
            </article>)}
          </section>)}
        </div>}
      </article>;
    })}</div>
  </section>;
}

import { useEffect, useState } from "react";
import { BookOpen, Plus, Send, Save, PencilLine } from "lucide-react";

type PracticeType = "reading" | "speaking" | "listening" | "quiz" | "roleplay";
type LessonDraft = { title: string; content: string; tamilMeaning: string; practiceType: PracticeType };
type ModuleDraft = { title: string; lessons: LessonDraft[] };
type Course = {
  _id: string; title: string; description: string;
  learnerCategory: "kids" | "adults" | "working-professionals" | "job-seekers";
  level: "Basic" | "Intermediate" | "Advanced";
  industry: string; goal: string; status: "draft" | "published";
  modules: Array<{ _id?: string; title: string; lessons: Array<LessonDraft & { _id?: string }> }>;
  createdAt: string;
};
type Props = { apiBase: string };

const emptyLesson = (): LessonDraft => ({ title: "", content: "", tamilMeaning: "", practiceType: "speaking" });
const emptyModule = (): ModuleDraft => ({ title: "", lessons: [emptyLesson()] });
const labels: Record<string, string> = {
  kids: "Kids", adults: "Adults", "working-professionals": "Working Professionals", "job-seekers": "Job Seekers / Interview",
  general: "General English", "garments-textile": "Garments & Textile", "it-software": "IT & Software",
  healthcare: "Healthcare", "sales-customer-service": "Sales & Customer Service", other: "Other",
  "daily-conversation": "Daily Conversation", "manager-communication": "Manager Communication",
  "job-interview": "Job Interview", "meeting-presentation": "Meetings & Presentations", grammar: "Grammar",
};

export default function TeacherCourseBuilder({ apiBase }: Props) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [learnerCategory, setLearnerCategory] = useState<Course["learnerCategory"]>("working-professionals");
  const [level, setLevel] = useState<Course["level"]>("Basic");
  const [industry, setIndustry] = useState("garments-textile");
  const [goal, setGoal] = useState("manager-communication");
  const [modules, setModules] = useState<ModuleDraft[]>([{ title: "Introduction", lessons: [emptyLesson()] }]);
  const [editingId, setEditingId] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function loadCourses() {
    if (!apiBase) return;
    try {
      const response = await fetch(apiBase + "/courses", { credentials: "include" });
      const payload = await response.json() as { message?: string; data?: { courses: Course[] } };
      if (!response.ok) throw new Error(payload.message ?? "Could not load courses.");
      setCourses(payload.data?.courses ?? []);
    } catch (e) { setError(e instanceof Error ? e.message : "Could not load courses."); }
  }
  useEffect(() => { void loadCourses(); }, [apiBase]);

  function resetForm() {
    setEditingId(""); setTitle(""); setDescription("");
    setLearnerCategory("working-professionals"); setLevel("Basic");
    setIndustry("garments-textile"); setGoal("manager-communication");
    setModules([{ title: "Introduction", lessons: [emptyLesson()] }]);
  }
  function editCourse(course: Course) {
    setEditingId(course._id); setTitle(course.title); setDescription(course.description);
    setLearnerCategory(course.learnerCategory); setLevel(course.level); setIndustry(course.industry); setGoal(course.goal);
    setModules(course.modules.length ? course.modules.map((m) => ({ title: m.title, lessons: m.lessons.length ? m.lessons.map((l) => ({ title: l.title, content: l.content, tamilMeaning: l.tamilMeaning, practiceType: l.practiceType })) : [emptyLesson()] })) : [emptyModule()]);
    setStatusMessage("Editing: " + course.title); setError("");
    document.getElementById("course-builder-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  function updateModule(moduleIndex: number, patch: Partial<ModuleDraft>) {
    setModules((current) => current.map((m, i) => i === moduleIndex ? { ...m, ...patch } : m));
  }
  function updateLesson(moduleIndex: number, lessonIndex: number, patch: Partial<LessonDraft>) {
    setModules((current) => current.map((m, mi) => mi !== moduleIndex ? m : {
      ...m, lessons: m.lessons.map((l, li) => li === lessonIndex ? { ...l, ...patch } : l),
    }));
  }
  async function saveCourse(event: React.FormEvent<HTMLFormElement>, status: "draft" | "published") {
    event.preventDefault(); setLoading(true); setError(""); setStatusMessage("");
    const cleanModules = modules.filter((m) => m.title.trim()).map((m) => ({
      title: m.title.trim(),
      lessons: m.lessons.filter((l) => l.title.trim()).map((l) => ({ ...l, title: l.title.trim() })),
    }));
    const body = { title, description, learnerCategory, level, industry, goal, status, modules: cleanModules };
    try {
      const response = await fetch(apiBase + (editingId ? "/courses/" + editingId : "/courses"), {
        method: editingId ? "PUT" : "POST",
        credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      const payload = await response.json() as { message?: string };
      if (!response.ok) throw new Error(payload.message ?? "Could not save course.");
      setStatusMessage(payload.message ?? "Course saved.");
      resetForm(); await loadCourses();
    } catch (e) { setError(e instanceof Error ? e.message : "Could not save course."); }
    finally { setLoading(false); }
  }

  return <div className="course-builder-workspace">
    <div className="section-heading"><div><h2>Course Builder</h2><p>Create structured courses, modules, and practical lessons for your learners.</p></div><button type="button" className="button button-outline" onClick={() => void loadCourses()}>Refresh</button></div>
    <section id="course-builder-form" className="surface-card settings-card">
      <div className="card-heading"><div><h3>{editingId ? "Edit course" : "Create a course"}</h3><p>Choose who this course is for, then add modules and lessons.</p></div><BookOpen className="round-icon" /></div>
      <form onSubmit={(event) => void saveCourse(event, "draft")}>
        <div className="form-grid">
          <label>Course name<input required minLength={3} maxLength={160} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. English for Garment Supervisors" /></label>
          <label>Learner category<select value={learnerCategory} onChange={(e) => setLearnerCategory(e.target.value as Course["learnerCategory"])}><option value="kids">Kids</option><option value="adults">Adults — General English</option><option value="working-professionals">Working Professionals</option><option value="job-seekers">Job Seekers / Interview</option></select></label>
          <label>English level<select value={level} onChange={(e) => setLevel(e.target.value as Course["level"])}><option>Basic</option><option>Intermediate</option><option>Advanced</option></select></label>
          <label>Industry<select value={industry} onChange={(e) => setIndustry(e.target.value)}><option value="general">General English</option><option value="garments-textile">Garments & Textile</option><option value="it-software">IT & Software</option><option value="healthcare">Healthcare</option><option value="sales-customer-service">Sales & Customer Service</option><option value="other">Other</option></select></label>
          <label>Learning goal<select value={goal} onChange={(e) => setGoal(e.target.value)}><option value="daily-conversation">Daily Conversation</option><option value="manager-communication">Manager Communication</option><option value="job-interview">Job Interview</option><option value="meeting-presentation">Meetings & Presentations</option><option value="grammar">Grammar</option><option value="other">Other</option></select></label>
        </div>
        <label>Course description<textarea required minLength={3} maxLength={3000} rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What will students learn and be able to do?" /></label>
        <div className="section-heading" style={{ marginTop: 24 }}><div><h3>Modules & lessons</h3><p>Each module can contain multiple lessons with English content, Tamil meaning, and a practice activity.</p></div><button type="button" className="button button-outline" onClick={() => setModules((old) => [...old, emptyModule()])}><Plus size={15} /> Add module</button></div>
        {modules.map((module, mi) => <section className="course-module-editor" key={mi}>
          <div className="card-heading"><strong>Module {mi + 1}</strong><button type="button" className="inline-link" onClick={() => setModules((old) => old.filter((_, i) => i !== mi))} disabled={modules.length === 1}>Remove module</button></div>
          <label>Module title<input required minLength={2} value={module.title} onChange={(e) => updateModule(mi, { title: e.target.value })} placeholder="e.g. Production and Quality English" /></label>
          {module.lessons.map((lesson, li) => <div className="course-lesson-editor" key={li}>
            <div className="card-heading"><strong>Lesson {li + 1}</strong><button type="button" className="inline-link" onClick={() => updateModule(mi, { lessons: module.lessons.filter((_, i) => i !== li) })} disabled={module.lessons.length === 1}>Remove lesson</button></div>
            <label>Lesson title<input required minLength={2} value={lesson.title} onChange={(e) => updateLesson(mi, li, { title: e.target.value })} placeholder="e.g. Report a machine breakdown" /></label>
            <label>Lesson content / example sentences<textarea rows={3} value={lesson.content} onChange={(e) => updateLesson(mi, li, { content: e.target.value })} placeholder="Add dialogue, useful phrases, examples, or instructions." /></label>
            <label>Tamil meaning / explanation<textarea rows={2} value={lesson.tamilMeaning} onChange={(e) => updateLesson(mi, li, { tamilMeaning: e.target.value })} placeholder="Tamil explanation for learners (optional)" /></label>
            <label>Practice activity<select value={lesson.practiceType} onChange={(e) => updateLesson(mi, li, { practiceType: e.target.value as PracticeType })}><option value="speaking">Speaking practice</option><option value="roleplay">Role-play conversation</option><option value="listening">Listening practice</option><option value="reading">Reading</option><option value="quiz">Quiz</option></select></label>
          </div>)}
          <button type="button" className="button button-outline" onClick={() => updateModule(mi, { lessons: [...module.lessons, emptyLesson()] })}><Plus size={15} /> Add lesson</button>
        </section>)}
        {error && <div className="inline-message">{error}</div>}{statusMessage && <div className="inline-message">{statusMessage}</div>}
        <div className="practice-controls"><button className="button button-outline" type="submit" disabled={loading}><Save size={16} /> {loading ? "Saving…" : "Save draft"}</button><button className="button button-primary" type="button" disabled={loading} onClick={(event) => { const form = event.currentTarget.form; if (form?.reportValidity()) void saveCourse({ preventDefault: () => undefined } as React.FormEvent<HTMLFormElement>, "published"); }}><Send size={16} /> Publish course</button>{editingId && <button className="button button-outline" type="button" onClick={resetForm}>Cancel edit</button>}</div>
      </form>
    </section>
    <section className="surface-card owner-table-card">
      <div className="section-heading"><div><h2>Your courses</h2><p>Draft courses are private to you. Published courses are marked ready for the student library.</p></div><span className="owner-plan">{courses.length} courses</span></div>
      <div className="course-grid">{courses.map((course) => <article className="course-card" key={course._id}>
        <div className="course-art"><BookOpen size={32} /></div><span className="course-level">{course.level.toUpperCase()} · {labels[course.learnerCategory] ?? course.learnerCategory}</span>
        <h3>{course.title}</h3><p>{course.description}</p><div className="course-meta"><span>{labels[course.industry] ?? course.industry}</span><span>{course.modules.length} modules</span></div>
        <p className="muted-small">{course.modules.reduce((sum, m) => sum + m.lessons.length, 0)} lessons · {course.status === "published" ? "Published" : "Draft"}</p>
        <div className="practice-controls"><button className="button button-outline" onClick={() => editCourse(course)}><PencilLine size={15} /> Edit</button>{course.status === "draft" && <button className="button button-primary" onClick={() => editCourse(course)}><Send size={15} /> Review & publish</button>}</div>
      </article>)}{!courses.length && <p>No courses yet. Create your first course above.</p>}</div>
    </section>
  </div>;
}

import { useCallback, useEffect, useState } from "react";
import { BarChart3, BookOpenCheck, RefreshCw, Users } from "lucide-react";

type ProgressRow = {
  courseId: string;
  courseTitle: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  studentLevel: string;
  studentTotalXp: number;
  completedLessons: number;
  totalLessons: number;
  completionPercent: number;
  courseCompleted: boolean;
  completedAt?: string | null;
  lastActivity?: string;
};
type Report = {
  summary: { courses: number; learners: number; enrollments: number; completedCourses: number };
  rows: ProgressRow[];
};

export default function TeacherCourseProgress({ apiBase }: { apiBase: string }) {
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadReport = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(apiBase + "/courses/progress", { credentials: "include" });
      const payload = await response.json() as { message?: string; data?: Report };
      if (!response.ok) throw new Error(payload.message ?? "Could not load course progress.");
      setReport(payload.data ?? { summary: { courses: 0, learners: 0, enrollments: 0, completedCourses: 0 }, rows: [] });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load course progress.");
    } finally {
      setLoading(false);
    }
  }, [apiBase]);

  useEffect(() => { void loadReport(); }, [loadReport]);

  return <section className="surface-card teacher-progress-card">
    <div className="card-heading">
      <div><span className="course-builder-eyebrow">LEARNER ANALYTICS</span><h3>Course progress report</h3><p>Track lesson completion for learners studying your courses.</p></div>
      <button className="button button-outline" onClick={() => void loadReport()} disabled={loading}><RefreshCw size={15} /> {loading ? "Refreshing…" : "Refresh"}</button>
    </div>
    <div className="teacher-progress-stats">
      <article><span><BookOpenCheck size={17} /></span><div><strong>{report?.summary.courses ?? 0}</strong><small>Your courses</small></div></article>
      <article><span><Users size={17} /></span><div><strong>{report?.summary.learners ?? 0}</strong><small>Active learners</small></div></article>
      <article><span><BarChart3 size={17} /></span><div><strong>{report?.summary.completedCourses ?? 0}</strong><small>Courses completed</small></div></article>
    </div>
    {error && <p className="inline-message">{error}</p>}
    {loading && !report ? <p className="muted-small">Loading learner progress…</p> : report?.rows.length ? <div className="owner-table-wrap teacher-progress-table-wrap">
      <table className="owner-table"><thead><tr><th>Student</th><th>Course</th><th>Lessons</th><th>Progress</th><th>Total XP</th><th>Last activity</th><th>Status</th></tr></thead>
        <tbody>{report.rows.map((row) => <tr key={row.courseId + ":" + row.studentId}>
          <td><strong>{row.studentName}</strong><br /><span className="muted-small">{row.studentEmail}</span></td>
          <td>{row.courseTitle}</td>
          <td>{row.completedLessons}/{row.totalLessons}</td>
          <td><div className="teacher-progress-cell"><span>{row.completionPercent}%</span><div><i style={{ width: row.completionPercent + "%" }} /></div></div></td>
          <td>{row.lastActivity ? new Date(row.lastActivity).toLocaleDateString() : "—"}</td>
          <td><span className={"teacher-course-status " + (row.courseCompleted ? "is-complete" : "")}>{row.courseCompleted ? "Completed" : "In progress"}</span></td>
        </tr>)}</tbody>
      </table>
    </div> : <div className="teacher-progress-empty"><BookOpenCheck size={25} /><strong>No course activity yet</strong><p>When students complete lessons in your published courses, their progress will appear here.</p></div>}
  </section>;
}

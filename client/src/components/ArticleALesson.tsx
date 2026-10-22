import { useState } from "react";
import { CheckCircle2, ChevronRight, Headphones, Mic, Volume2 } from "lucide-react";

type Props = { isDone: boolean; onComplete: () => void };

const tasks = [
  { type: "Choose the article", question: "I have ___ book.", options: ["a", "an", "the"], answer: "a", why: "Book begins with the consonant sound /b/, so we use “a book”." },
  { type: "Fill in the blank", question: "She ate ___ apple.", options: ["a", "an", "the"], answer: "an", why: "Apple begins with a vowel sound, so we use “an apple”." },
  { type: "Choose the correct phrase", question: "Which phrase is correct?", options: ["a orange", "an orange", "the orange (first mention)"], answer: "an orange", why: "Orange begins with a vowel sound: /ɒ/ or /ɔː/, so “an orange”." },
  { type: "Sentence order", question: "Choose the correct sentence.", options: ["I have a pen.", "A have I pen.", "Pen I a have."], answer: "I have a pen.", why: "The natural order is subject + verb + article + noun: I + have + a + pen." },
];

export default function ArticleALesson({ isDone, onComplete }: Props) {
  const [taskIndex, setTaskIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [checked, setChecked] = useState<Record<number, boolean>>({});
  const [speakingMessage, setSpeakingMessage] = useState("");
  const current = tasks[taskIndex];
  const correct = answers[taskIndex] === current.answer;
  const completedTasks = tasks.filter((task, index) => checked[index] && answers[index] === task.answer).length;
  const speak = (text: string) => {
    if (!("speechSynthesis" in window)) {
      setSpeakingMessage("Audio playback is not available in this browser. Please read the example aloud.");
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 0.85;
    window.speechSynthesis.speak(utterance);
    setSpeakingMessage("Listen carefully, then repeat: “" + text + "”");
  };

  return <div className="article-a-lesson">
    <div className="article-a-visual">
      <div className="article-a-visual-top"><span>VISUAL LESSON</span><span>LESSON 01 · GRAMMAR</span></div>
      <div className="article-a-scene">
        <div className="article-a-letter">A</div>
        <div className="article-a-object"><span role="img" aria-label="red apple">🍎</span><strong>an apple</strong><small>starts with a vowel sound</small></div>
        <div className="article-a-object article-a-book"><span role="img" aria-label="book">📘</span><strong>a book</strong><small>starts with a consonant sound</small></div>
      </div>
      <div className="article-a-play-row"><button type="button" className="button button-outline" onClick={() => speak("A book. An apple.")}><Volume2 size={16}/> Listen to examples</button><span>Look · Listen · Learn</span></div>
    </div>

    <section className="article-a-explanation">
      <span className="course-builder-eyebrow">THE LESSON</span>
      <h3>Article “A” — when do we use it?</h3>
      <p>“A” is an indefinite article. We usually use it before a singular countable noun when we mention something for the first time.</p>
      <div className="article-a-rule"><strong>Sound rule</strong><p>Use <b>A</b> before a consonant <b>sound</b>: <em>a book, a car, a university</em>.</p><p>Use <b>AN</b> before a vowel <b>sound</b>: <em>an apple, an egg, an hour</em>.</p><small>முக்கியம்: எழுத்தை மட்டும் பார்க்க வேண்டாம்; சொல்லின் தொடக்க ஒலியைக் கவனிக்க வேண்டும். “University” என்பது /yuː/ ஒலியில் தொடங்குவதால் “a university”.</small></div>
      <h4>Where can we use “a”?</h4>
      <ul><li><b>First mention:</b> I saw <b>a</b> dog.</li><li><b>Job or role:</b> She is <b>a</b> teacher.</li><li><b>One item:</b> I need <b>a</b> pen.</li><li><b>Describing something:</b> It is <b>a</b> beautiful day.</li></ul>
      <p className="article-a-tamil"><b>தமிழில்:</b> பொதுவாக ஒரு பொருள்/நபரை முதன்முறையாகக் குறிப்பிடும்போது, ஒருமையில் வரும் countable noun-க்கு முன் “a” அல்லது “an” பயன்படுத்துகிறோம். “A” எல்லா இடங்களிலும் வராது; தொடக்க ஒலியைப் பொறுத்து தேர்வு செய்ய வேண்டும்.</p>
    </section>

    <section className="article-a-task-box">
      <div className="article-a-task-heading"><div><span className="course-builder-eyebrow">MOVE TO TASKS</span><h3>Practice what you learned</h3><p>Answer each question, read the explanation, and try speaking.</p></div><span className="article-a-progress">{completedTasks}/{tasks.length}</span></div>
      <div className="article-a-task-types">{["Choose word","Fill blanks","Sentence order","Speaking"].map((label, index) => <button type="button" key={label} className={taskIndex === Math.min(index, tasks.length - 1) ? "active" : ""} onClick={() => setTaskIndex(Math.min(index, tasks.length - 1))}>{index + 1}. {label}</button>)}</div>
      <div className="article-a-question"><span>QUESTION {taskIndex + 1} OF {tasks.length} · {current.type.toUpperCase()}</span><h4>{current.question}</h4><div className="article-a-options">{current.options.map((option) => <button type="button" key={option} className={(checked[taskIndex] && option === current.answer ? "correct " : "") + (checked[taskIndex] && answers[taskIndex] === option && !correct ? "incorrect" : "") + (answers[taskIndex] === option ? " selected" : "")} onClick={() => { setAnswers((old) => ({ ...old, [taskIndex]: option })); setChecked((old) => ({ ...old, [taskIndex]: false })); }}>{option}</button>)}</div>
        {!checked[taskIndex] ? <button type="button" className="button button-primary" disabled={!answers[taskIndex]} onClick={() => setChecked((old) => ({ ...old, [taskIndex]: true }))}>Check answer <ChevronRight size={16}/></button> : <div className={"article-a-feedback " + (correct ? "good" : "try-again")}><strong>{correct ? "Correct! ✓" : "Try again"}</strong><p>{current.why}</p>{taskIndex < tasks.length - 1 && <button type="button" className="button button-outline" onClick={() => setTaskIndex((index) => index + 1)}>Next question <ChevronRight size={15}/></button>}</div>}
      </div>
      <div className="article-a-speaking"><div><Mic size={20}/><div><strong>Speaking practice</strong><p>Listen, then say: “I have a book. She ate an apple.”</p></div></div><button type="button" className="button button-outline" onClick={() => speak("I have a book. She ate an apple.")}><Headphones size={15}/> Listen &amp; repeat</button>{speakingMessage && <small role="status">{speakingMessage}</small>}</div>
      {completedTasks === tasks.length && <div className="article-a-finish"><CheckCircle2 size={20}/><span>Great work! You answered all four tasks correctly.</span></div>}
    </section>
    <div className="article-a-complete"><p>{isDone ? "This lesson is completed and your progress is saved." : "Finished the lesson and practice? Save your progress below."}</p><button type="button" className="button button-primary" disabled={isDone} onClick={onComplete}>{isDone ? "✓ Lesson completed" : "Complete lesson · Earn 10 XP"}</button></div>
  </div>;
}

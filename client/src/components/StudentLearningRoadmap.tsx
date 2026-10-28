import { useMemo, useState } from "react";
import { Check, ChevronRight, CircleHelp, LockKeyhole, Mic, RotateCcw, Volume2 } from "lucide-react";
import type { LearningLevel } from "../types";

type Props = {
  mode: "test" | "roadmap";
  initialLevel: LearningLevel;
  onLevelDetermined: (level: LearningLevel) => void;
  onOpenRoadmap: () => void;
  onStartSpeaking: (phrase?: string) => void;
};

type Question = { prompt: string; options: string[]; answer: number; explanation: string };
type Lesson = {
  id: string; level: LearningLevel; title: string; subtitle: string; emoji: string;
  tamil: string; pattern: string; examples: string[];
  blanks: Array<{ prompt: string; answer: string; options: string[] }>;
  arrange: Array<{ words: string[]; answer: string }>;
  quiz: Question[];
};

const placementQuestions: Question[] = [
  { prompt: "I ___ a student.", options: ["am", "is", "are"], answer: 0, explanation: "I உடன் am பயன்படுத்த வேண்டும்." },
  { prompt: "She ___ to work every day.", options: ["go", "goes", "going"], answer: 1, explanation: "He/She/It + present simple verb-s/es." },
  { prompt: "They ___ playing now.", options: ["is", "am", "are"], answer: 2, explanation: "They உடன் are பயன்படுத்த வேண்டும்." },
  { prompt: "Yesterday, we ___ a movie.", options: ["watch", "watched", "will watch"], answer: 1, explanation: "Yesterday என்பது past tense-ஐக் குறிக்கிறது." },
  { prompt: "Choose the correct sentence.", options: ["He don't like tea.", "He doesn't like tea.", "He not likes tea."], answer: 1, explanation: "He/She/It negative: doesn't + base verb." },
  { prompt: "I have lived here ___ 2020.", options: ["for", "since", "from"], answer: 1, explanation: "குறிப்பிட்ட தொடக்க நேரத்துடன் since பயன்படுத்துவோம்." },
  { prompt: "If it rains, we ___ at home.", options: ["stay", "will stay", "stayed"], answer: 1, explanation: "First conditional: If + present, will + verb." },
  { prompt: "Choose the polite request.", options: ["Give me water.", "Could I have some water, please?", "Water now."], answer: 1, explanation: "Could I have…? என்பது மரியாதையான request." },
  { prompt: "The report ___ by Mina yesterday.", options: ["was prepared", "prepared", "is prepare"], answer: 0, explanation: "Past passive: was/were + past participle." },
  { prompt: "By next June, I ___ my course.", options: ["finish", "finished", "will have finished"], answer: 2, explanation: "Future perfect ஒரு எதிர்கால நேரத்திற்குள் முடிந்த செயலைக் குறிக்கும்." },
  { prompt: "Choose the correct question.", options: ["Where you live?", "Where do you live?", "Where does you live?"], answer: 1, explanation: "You உடன் question-ல் do பயன்படுத்துவோம்." },
  { prompt: "She is interested ___ learning English.", options: ["in", "on", "at"], answer: 0, explanation: "Interested in என்பது சரியான word combination." },
  { prompt: "Choose the natural sentence.", options: ["I am agree.", "I agree with you.", "I agreeing you."], answer: 1, explanation: "Agree ஒரு verb; 'am agree' என்று சொல்ல வேண்டாம்." },
  { prompt: "The meeting was postponed ___ the manager was ill.", options: ["although", "because", "unless"], answer: 1, explanation: "காரணத்தைச் சொல்ல because பயன்படுத்தப்படுகிறது." },
  { prompt: "Choose the most professional sentence.", options: ["Send me this fast.", "Could you please send the report by noon?", "You send report now."], answer: 1, explanation: "Polite request + clear deadline professional communication-க்கு உதவும்." },
];

const lessonSeeds: Array<Omit<Lesson, "id" | "level" | "quiz"> & { level: LearningLevel; quiz: Question[] }> = [
  {
    level: "Basic", title: "Build your first sentence", subtitle: "Subject + be verb + information", emoji: "🧩",
    tamil: "ஒரு எளிய English sentence-ல் யார்/எது (Subject), அதற்கான be verb (am/is/are), பின்னர் தகவல் வரும். தமிழில் சொற்களின் வரிசை வேறுபடலாம்; English-ல் இந்த வரிசையைப் பழகுங்கள்.",
    pattern: "Subject + am / is / are + noun or adjective",
    examples: ["I am happy.", "You are kind.", "He is a student.", "She is ready.", "We are friends.", "They are at home."],
    blanks: [
      { prompt: "I ___ ready.", answer: "am", options: ["am", "is", "are"] },
      { prompt: "She ___ happy.", answer: "is", options: ["am", "is", "are"] },
      { prompt: "They ___ friends.", answer: "are", options: ["is", "are", "be"] },
      { prompt: "He ___ a teacher.", answer: "is", options: ["are", "am", "is"] },
      { prompt: "We ___ here.", answer: "are", options: ["is", "are", "am"] },
    ],
    arrange: [
      { words: ["am", "I", "ready"], answer: "I am ready" },
      { words: ["is", "She", "kind"], answer: "She is kind" },
      { words: ["are", "We", "friends"], answer: "We are friends" },
    ],
    quiz: [
      { prompt: "Choose the correct sentence.", options: ["I are ready.", "I am ready.", "I is ready."], answer: 1, explanation: "I + am." },
      { prompt: "He ___ tired.", options: ["are", "am", "is"], answer: 2, explanation: "He + is." },
      { prompt: "Choose the correct order.", options: ["Happy am I.", "I am happy.", "Am happy I."], answer: 1, explanation: "Subject + be verb + information." },
    ],
  },
  {
    level: "Basic", title: "Present simple for routines", subtitle: "Habits, facts and daily activities", emoji: "🌅",
    tamil: "தினமும் நடக்கும் பழக்கம் அல்லது பொதுவான உண்மைக்கு Present Simple பயன்படுத்துவோம். I/You/We/They உடன் base verb; He/She/It உடன் பொதுவாக verb-s அல்லது -es.",
    pattern: "I / You / We / They + verb · He / She / It + verb-s",
    examples: ["I wake up at six.", "We work every day.", "They speak Tamil.", "He works in a factory.", "She studies English.", "The bus arrives at nine."],
    blanks: [
      { prompt: "I ___ English every day.", answer: "study", options: ["study", "studies", "studying"] },
      { prompt: "She ___ to work.", answer: "goes", options: ["go", "goes", "going"] },
      { prompt: "They ___ football.", answer: "play", options: ["plays", "play", "playing"] },
      { prompt: "He ___ in Coimbatore.", answer: "lives", options: ["live", "lives", "living"] },
      { prompt: "We ___ at eight.", answer: "start", options: ["starts", "starting", "start"] },
    ],
    arrange: [
      { words: ["English", "I", "study", "daily"], answer: "I study English daily" },
      { words: ["works", "She", "here"], answer: "She works here" },
      { words: ["at seven", "They", "start"], answer: "They start at seven" },
    ],
    quiz: [
      { prompt: "He ___ every morning.", options: ["exercise", "exercises", "exercising"], answer: 1, explanation: "He + verb-s." },
      { prompt: "Which one describes a habit?", options: ["I am sleeping now.", "I walk to work every day.", "I walked yesterday."], answer: 1, explanation: "Every day என்பது routine-ஐக் குறிக்கிறது." },
      { prompt: "They ___ English at home.", options: ["practises", "practise", "practising"], answer: 1, explanation: "They உடன் base verb பயன்படுத்த வேண்டும்." },
    ],
  },
  {
    level: "Basic", title: "Make negative sentences", subtitle: "Don't and doesn't", emoji: "🚫",
    tamil: "Present Simple-ல் இல்லை என்று சொல்ல I/you/we/they உடன் don't; he/she/it உடன் doesn't பயன்படுத்துவோம். Doesn't வந்த பிறகு verb-க்கு s சேர்க்க வேண்டாம்.",
    pattern: "I / You / We / They + don't + verb · He / She / It + doesn't + verb",
    examples: ["I don't drink coffee.", "We don't work on Sundays.", "They don't live here.", "He doesn't drive a car.", "She doesn't eat meat.", "My phone doesn't work."],
    blanks: [
      { prompt: "I ___ understand.", answer: "don't", options: ["don't", "doesn't", "isn't"] },
      { prompt: "She ___ like coffee.", answer: "doesn't", options: ["don't", "doesn't", "isn't"] },
      { prompt: "They ___ speak French.", answer: "don't", options: ["doesn't", "don't", "aren't"] },
      { prompt: "He doesn't ___ tea.", answer: "drink", options: ["drinks", "drink", "drinking"] },
      { prompt: "We ___ need help.", answer: "don't", options: ["doesn't", "don't", "isn't"] },
    ],
    arrange: [
      { words: ["don't", "I", "smoke"], answer: "I don't smoke" },
      { words: ["like", "doesn't", "He", "tea"], answer: "He doesn't like tea" },
      { words: ["here", "They", "don't", "work"], answer: "They don't work here" },
    ],
    quiz: [
      { prompt: "She ___ eat meat.", options: ["don't", "doesn't", "not"], answer: 1, explanation: "She உடன் doesn't." },
      { prompt: "Choose the correct sentence.", options: ["He doesn't likes it.", "He don't like it.", "He doesn't like it."], answer: 2, explanation: "Doesn't + base verb." },
      { prompt: "We ___ have time.", options: ["doesn't", "don't", "isn't"], answer: 1, explanation: "We உடன் don't." },
    ],
  },
  {
    level: "Basic", title: "Past simple: yesterday", subtitle: "Talk about finished actions", emoji: "🕰️",
    tamil: "கடந்த காலத்தில் முடிந்த செயல்களை Past Simple-ல் சொல்வோம். Regular verbs-க்கு பொதுவாக -ed சேர்க்கப்படும்; சில verbs irregular (go → went).",
    pattern: "Subject + past verb + object / time",
    examples: ["I worked yesterday.", "She called me last night.", "We visited Chennai.", "He went to school.", "They ate lunch early.", "I finished my task."],
    blanks: [
      { prompt: "Yesterday, I ___ at home.", answer: "worked", options: ["work", "worked", "working"] },
      { prompt: "She ___ me last night.", answer: "called", options: ["call", "called", "calls"] },
      { prompt: "We ___ to the shop.", answer: "went", options: ["go", "went", "gone"] },
      { prompt: "He ___ breakfast at eight.", answer: "ate", options: ["eat", "eaten", "ate"] },
      { prompt: "They ___ the job.", answer: "finished", options: ["finish", "finishes", "finished"] },
    ],
    arrange: [
      { words: ["yesterday", "I", "worked"], answer: "I worked yesterday" },
      { words: ["went", "She", "home"], answer: "She went home" },
      { words: ["the task", "finished", "We"], answer: "We finished the task" },
    ],
    quiz: [
      { prompt: "Yesterday, he ___ to work.", options: ["go", "went", "goes"], answer: 1, explanation: "Go-வின் past form went." },
      { prompt: "Which word signals past time?", options: ["Tomorrow", "Usually", "Yesterday"], answer: 2, explanation: "Yesterday கடந்த காலத்தைக் குறிக்கிறது." },
      { prompt: "Past form of finish?", options: ["finished", "finishes", "finishing"], answer: 0, explanation: "Regular verb: finish → finished." },
    ],
  },
  {
    level: "Basic", title: "Ask simple questions", subtitle: "Do, does, what, where and when", emoji: "❓",
    tamil: "கேள்வி கேட்க Do/Does அல்லது What/Where/When போன்ற question words பயன்படுத்தலாம். Do/Does வந்த பிறகு main verb base form-ல் வரும்.",
    pattern: "Do / Does + subject + base verb? · Question word + do/does + subject + verb?",
    examples: ["Do you work here?", "Does she speak English?", "What do you need?", "Where do they live?", "When does the shop open?", "How do you feel?"],
    blanks: [
      { prompt: "___ you speak English?", answer: "Do", options: ["Do", "Does", "Are"] },
      { prompt: "___ he work here?", answer: "Does", options: ["Do", "Does", "Is"] },
      { prompt: "Where ___ she live?", answer: "does", options: ["do", "does", "is"] },
      { prompt: "What ___ you need?", answer: "do", options: ["does", "do", "are"] },
      { prompt: "When ___ the bus arrive?", answer: "does", options: ["do", "does", "is"] },
    ],
    arrange: [
      { words: ["you", "Do", "work", "here"], answer: "Do you work here" },
      { words: ["does", "Where", "she", "live"], answer: "Where does she live" },
      { words: ["need", "What", "you", "do"], answer: "What do you need" },
    ],
    quiz: [
      { prompt: "___ she like tea?", options: ["Do", "Does", "Is"], answer: 1, explanation: "She உடன் Does." },
      { prompt: "Choose the correct question.", options: ["Where you live?", "Where do you live?", "Where does you live?"], answer: 1, explanation: "You உடன் do." },
      { prompt: "After does, use…", options: ["verb-s", "base verb", "verb-ing"], answer: 1, explanation: "Does + base verb." },
    ],
  },
  {
    level: "Intermediate", title: "Present continuous", subtitle: "Actions happening now", emoji: "🎬",
    tamil: "இப்போது நடந்து கொண்டிருக்கும் செயலுக்கு am/is/are + verb-ing பயன்படுத்துவோம். 'now', 'at the moment' போன்ற சொற்கள் உதவும்.",
    pattern: "Subject + am / is / are + verb-ing",
    examples: ["I am learning English.", "She is talking on the phone.", "They are waiting outside.", "We are checking the report.", "He is driving now.", "The machine is running."],
    blanks: [
      { prompt: "I ___ studying now.", answer: "am", options: ["am", "is", "are"] },
      { prompt: "She is ___ a message.", answer: "writing", options: ["write", "writes", "writing"] },
      { prompt: "They ___ waiting.", answer: "are", options: ["is", "are", "am"] },
      { prompt: "He is ___ the machine.", answer: "checking", options: ["check", "checks", "checking"] },
      { prompt: "We are ___ English.", answer: "practising", options: ["practise", "practising", "practised"] },
    ],
    arrange: [
      { words: ["am", "I", "learning", "English"], answer: "I am learning English" },
      { words: ["waiting", "are", "They", "outside"], answer: "They are waiting outside" },
      { words: ["is", "She", "speaking", "now"], answer: "She is speaking now" },
    ],
    quiz: [
      { prompt: "He ___ working at the moment.", options: ["is", "are", "am"], answer: 0, explanation: "He + is + verb-ing." },
      { prompt: "Choose the present continuous sentence.", options: ["I work every day.", "I worked yesterday.", "I am working now."], answer: 2, explanation: "Am + working indicates an action in progress." },
      { prompt: "They are ___ lunch.", options: ["eat", "eating", "eats"], answer: 1, explanation: "Are + verb-ing." },
    ],
  },
  {
    level: "Intermediate", title: "Future plans with will", subtitle: "Promises, decisions and predictions", emoji: "🚀",
    tamil: "எதிர்கால முடிவு, வாக்குறுதி அல்லது கணிப்பைச் சொல்ல will + base verb பயன்படுத்துவோம். Will-க்கு பிறகு verb-ல் s அல்லது ing சேர்க்க வேண்டாம்.",
    pattern: "Subject + will + base verb",
    examples: ["I will call you tomorrow.", "She will finish the report.", "We will practise tonight.", "They will arrive soon.", "I will help you.", "The team will meet on Monday."],
    blanks: [
      { prompt: "I will ___ you tomorrow.", answer: "call", options: ["call", "calls", "calling"] },
      { prompt: "She ___ come later.", answer: "will", options: ["will", "is", "does"] },
      { prompt: "We will ___ the task.", answer: "finish", options: ["finishes", "finish", "finishing"] },
      { prompt: "They will ___ soon.", answer: "arrive", options: ["arrives", "arrive", "arriving"] },
      { prompt: "He will ___ you.", answer: "help", options: ["helps", "help", "helping"] },
    ],
    arrange: [
      { words: ["tomorrow", "will", "I", "call", "you"], answer: "I will call you tomorrow" },
      { words: ["help", "will", "We", "you"], answer: "We will help you" },
      { words: ["soon", "arrive", "They", "will"], answer: "They will arrive soon" },
    ],
    quiz: [
      { prompt: "After will, use…", options: ["base verb", "verb-s", "verb-ing"], answer: 0, explanation: "Will + base verb." },
      { prompt: "I ___ help you.", options: ["will", "am", "did"], answer: 0, explanation: "Future plan/promise: will." },
      { prompt: "Which is correct?", options: ["She will goes.", "She will going.", "She will go."], answer: 2, explanation: "Will go, not will goes." },
    ],
  },
  {
    level: "Intermediate", title: "Present perfect", subtitle: "Experience and results", emoji: "🧭",
    tamil: "கடந்த காலத்தில் நடந்தாலும் அதன் அனுபவம் அல்லது தற்போதைய விளைவுடன் தொடர்பு உள்ள செயலுக்கு have/has + past participle பயன்படுத்துவோம்.",
    pattern: "I / You / We / They + have + V3 · He / She / It + has + V3",
    examples: ["I have finished my work.", "She has visited Delhi.", "We have learned five words.", "He has lost his keys.", "They have arrived.", "I have never tried sushi."],
    blanks: [
      { prompt: "I have ___ my work.", answer: "finished", options: ["finish", "finished", "finishing"] },
      { prompt: "She ___ completed the task.", answer: "has", options: ["have", "has", "is"] },
      { prompt: "They have ___ home.", answer: "arrived", options: ["arrive", "arrives", "arrived"] },
      { prompt: "We ___ learned a lot.", answer: "have", options: ["has", "have", "are"] },
      { prompt: "He has ___ his phone.", answer: "lost", options: ["lose", "lost", "loses"] },
    ],
    arrange: [
      { words: ["have", "I", "finished", "work", "my"], answer: "I have finished my work" },
      { words: ["has", "She", "arrived"], answer: "She has arrived" },
      { words: ["learned", "We", "have", "a lot"], answer: "We have learned a lot" },
    ],
    quiz: [
      { prompt: "She ___ finished the task.", options: ["have", "has", "is"], answer: 1, explanation: "She + has + V3." },
      { prompt: "Choose the present perfect.", options: ["I finish now.", "I finished yesterday.", "I have finished my work."], answer: 2, explanation: "Have + past participle." },
      { prompt: "They have ___.", options: ["arrive", "arrived", "arriving"], answer: 1, explanation: "Have + V3." },
    ],
  },
  {
    level: "Advanced", title: "Professional sentence patterns", subtitle: "Clear, tactful workplace communication", emoji: "💼",
    tamil: "Advanced English-ல் grammar சரியாக இருப்பதுடன், உங்கள் கருத்தை தெளிவாகவும் மரியாதையாகவும் சொல்ல வேண்டும். Could you…? / I would appreciate it if… போன்ற patterns உதவும்.",
    pattern: "Could you please + base verb…? · I would appreciate it if + past form…",
    examples: ["Could you please review the report?", "I would appreciate it if you could respond today.", "Would you mind sharing the update?", "The issue has been resolved.", "Although we faced a delay, we met the deadline.", "I recommend that we review the process."],
    blanks: [
      { prompt: "Could you please ___ the report?", answer: "review", options: ["review", "reviews", "reviewing"] },
      { prompt: "I would appreciate it if you ___ respond today.", answer: "could", options: ["can", "could", "will"] },
      { prompt: "The issue has been ___.", answer: "resolved", options: ["resolve", "resolving", "resolved"] },
      { prompt: "___ we faced a delay, we met the deadline.", answer: "Although", options: ["Because", "Although", "Unless"] },
      { prompt: "I recommend that we ___ the process.", answer: "review", options: ["reviews", "review", "reviewing"] },
    ],
    arrange: [
      { words: ["please", "Could", "review", "you", "the report"], answer: "Could you please review the report" },
      { words: ["has", "The issue", "resolved", "been"], answer: "The issue has been resolved" },
      { words: ["recommend", "I", "we", "review", "the process", "that"], answer: "I recommend that we review the process" },
    ],
    quiz: [
      { prompt: "Choose the most tactful request.", options: ["Send it now.", "Could you please send it by noon?", "You must send it."], answer: 1, explanation: "Polite modal request + deadline is clear and professional." },
      { prompt: "The issue has been ___.", options: ["resolve", "resolved", "resolving"], answer: 1, explanation: "Present perfect passive: has been + V3." },
      { prompt: "Which word shows contrast?", options: ["Because", "Although", "Therefore"], answer: 1, explanation: "Although introduces contrast." },
    ],
  },
  {
    level: "Advanced", title: "Conditionals and reasoning", subtitle: "Explain possibilities and consequences", emoji: "🧠",
    tamil: "Conditionals மூலம் நிபந்தனை, சாத்தியம், கற்பனை அல்லது கடந்தகால வருத்தத்தைச் சொல்லலாம். If-clause மற்றும் result clause-ஐ சரியாக இணைப்பது முக்கியம்.",
    pattern: "If + present, will + verb · If + past, would + verb",
    examples: ["If I have time, I will call you.", "If we plan well, we will finish early.", "If I were you, I would ask for feedback.", "If the machine stopped, we would inspect it.", "If she had known, she would have helped.", "Unless we act now, we may miss the deadline."],
    blanks: [
      { prompt: "If it rains, we ___ stay home.", answer: "will", options: ["will", "would have", "did"] },
      { prompt: "If I were you, I ___ ask.", answer: "would", options: ["will", "would", "am"] },
      { prompt: "Unless we hurry, we ___ be late.", answer: "may", options: ["may", "have", "were"] },
      { prompt: "If she had known, she would have ___.", answer: "helped", options: ["help", "helped", "helping"] },
      { prompt: "If we plan well, we ___ finish early.", answer: "will", options: ["will", "would have", "did"] },
    ],
    arrange: [
      { words: ["I", "will", "If", "time", "have", "call", "you"], answer: "If I have time I will call you" },
      { words: ["you", "were", "If", "I", "would", "ask"], answer: "If I were you I would ask" },
      { words: ["act now", "Unless", "we", "may", "we", "be late"], answer: "Unless we act now we may be late" },
    ],
    quiz: [
      { prompt: "If I have time, I ___ call.", options: ["will", "would have", "did"], answer: 0, explanation: "First conditional: If + present, will + verb." },
      { prompt: "If I were you, I ___ apologise.", options: ["will", "would", "am"], answer: 1, explanation: "Second conditional uses would + base verb." },
      { prompt: "Unless means…", options: ["if not", "because", "even though"], answer: 0, explanation: "Unless = if not." },
    ],
  },
  {
    level: "Advanced", title: "Fluency and connected ideas", subtitle: "Link sentences and speak with nuance", emoji: "🌟",
    tamil: "Fluent English-ல் தனித்தனி sentence-களை connectors மூலம் இணைப்போம். However, therefore, in addition, for example போன்ற சொற்கள் கருத்தை ஒழுங்காக வெளிப்படுத்த உதவும்.",
    pattern: "Main idea + connector + supporting idea",
    examples: ["The task was difficult; however, we completed it.", "We improved quality; therefore, rework decreased.", "In addition, we trained the new team.", "For example, short daily practice helps retention.", "Although I was nervous, I presented clearly.", "Overall, the new process saved time."],
    blanks: [
      { prompt: "The task was hard; ___, we finished it.", answer: "however", options: ["however", "because", "unless"] },
      { prompt: "We trained the team; ___, quality improved.", answer: "therefore", options: ["although", "therefore", "unless"] },
      { prompt: "___, daily practice builds confidence.", answer: "For example", options: ["For example", "Unless", "Despite"] },
      { prompt: "___, the project met its goals.", answer: "Overall", options: ["Overall", "Because", "Unless"] },
      { prompt: "___ I was nervous, I spoke clearly.", answer: "Although", options: ["Although", "Therefore", "In addition"] },
    ],
    arrange: [
      { words: ["however", "difficult", "was", "The task", "we", "finished", "it"], answer: "The task was difficult however we finished it" },
      { words: ["therefore", "quality", "improved", "We trained", "the team"], answer: "We trained the team therefore quality improved" },
      { words: ["Overall", "saved", "time", "the process"], answer: "Overall the process saved time" },
    ],
    quiz: [
      { prompt: "Which connector introduces contrast?", options: ["Therefore", "However", "For example"], answer: 1, explanation: "However introduces a contrast." },
      { prompt: "Which connector introduces a result?", options: ["Therefore", "Although", "Meanwhile"], answer: 0, explanation: "Therefore introduces a result." },
      { prompt: "Which phrase summarises a conclusion?", options: ["For instance", "Overall", "Unless"], answer: 1, explanation: "Overall can summarise a conclusion." },
    ],
  },
];

const levelOrder: LearningLevel[] = ["Basic", "Intermediate", "Advanced"];
function makeLesson(level: LearningLevel, index: number): Lesson {
  const seeds = lessonSeeds.filter((item) => item.level === level);
  const seed = seeds[index % seeds.length];
  return { ...seed, id: level.toLowerCase() + "-" + (index + 1), level,
    subtitle: seed.subtitle, emoji: seed.emoji };
}
const lessons: Lesson[] = levelOrder.flatMap((level) => Array.from({ length: 5 }, (_, index) => makeLesson(level, index)));

function readCompleted(): string[] {
  try { return JSON.parse(localStorage.getItem("linguapro-roadmap-completed") ?? "[]") as string[]; } catch { return []; }
}
function readPlacementLevel(): LearningLevel | null {
  const value = localStorage.getItem("linguapro-placement-level");
  return value === "Basic" || value === "Intermediate" || value === "Advanced" ? value : null;
}

export default function StudentLearningRoadmap({ mode, initialLevel, onLevelDetermined, onOpenRoadmap, onStartSpeaking }: Props) {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [testSubmitted, setTestSubmitted] = useState(false);
  const [testLevel, setTestLevel] = useState<LearningLevel | null>(readPlacementLevel);
  const [completed, setCompleted] = useState<string[]>(readCompleted);
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [blankAnswers, setBlankAnswers] = useState<Record<number, string>>({});
  const [blankChecked, setBlankChecked] = useState<Record<number, boolean>>({});
  const [arrangeAnswers, setArrangeAnswers] = useState<Record<number, string[]>>({});
  const [lessonQuizAnswers, setLessonQuizAnswers] = useState<Record<number, number>>({});
  const [lessonQuizSubmitted, setLessonQuizSubmitted] = useState(false);
  const [speakingTranscript, setSpeakingTranscript] = useState("");
  const [speakingFeedback, setSpeakingFeedback] = useState("");
  const placementScore = placementQuestions.filter((question, index) => answers[index] === question.answer).length;
  const placementLevel: LearningLevel = placementScore <= 5 ? "Basic" : placementScore <= 10 ? "Intermediate" : "Advanced";
  const currentLevel = testLevel ?? initialLevel;
  const activeLesson = lessons.find((lesson) => lesson.id === activeLessonId) ?? null;
  const startIndex = Math.max(0, levelOrder.indexOf(currentLevel));
  const visibleLessons = lessons.filter((lesson) => levelOrder.indexOf(lesson.level) >= startIndex);
  const unlocked = useMemo(() => {
    const result = new Set<string>();
    let nextOpen = true;
    for (const lesson of visibleLessons) {
      if (nextOpen || completed.includes(lesson.id)) result.add(lesson.id);
      nextOpen = completed.includes(lesson.id);
    }
    return result;
  }, [visibleLessons, completed]);

  function submitPlacement() {
    const level = placementLevel;
    setTestLevel(level);
    setTestSubmitted(true);
    localStorage.setItem("linguapro-placement-level", level);
    localStorage.setItem("linguapro-placement-score", String(placementScore));
    onLevelDetermined(level);
  }

  function completeLesson() {
    if (!activeLesson) return;
    const next = completed.includes(activeLesson.id) ? completed : [...completed, activeLesson.id];
    setCompleted(next);
    localStorage.setItem("linguapro-roadmap-completed", JSON.stringify(next));
    setActiveLessonId(null);
    setBlankAnswers({});
    setBlankChecked({});
    setArrangeAnswers({});
    setLessonQuizAnswers({});
    setLessonQuizSubmitted(false);
    setSpeakingTranscript("");
    setSpeakingFeedback("");
  }

  function listen(text: string) {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-IN";
    window.speechSynthesis.speak(utterance);
  }

  function checkSpeaking() {
    const browser = window as Window & { SpeechRecognition?: new () => { lang: string; onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null; onerror: (() => void) | null; start: () => void }; webkitSpeechRecognition?: new () => { lang: string; onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null; onerror: (() => void) | null; start: () => void } };
    const Recognition = browser.SpeechRecognition ?? browser.webkitSpeechRecognition;
    if (!Recognition || !activeLesson) {
      onStartSpeaking(activeLesson?.examples[0]);
      return;
    }
    const recognition = new Recognition();
    recognition.lang = "en-IN";
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript ?? "";
      setSpeakingTranscript(transcript);
      const expected = activeLesson.examples[0].toLowerCase().replace(/[^a-z0-9 ]/g, "").trim();
      const heard = transcript.toLowerCase().replace(/[^a-z0-9 ]/g, "").trim();
      const passed = expected === heard || (expected.split(/\s+/).filter((word) => heard.includes(word)).length / expected.split(/\s+/).length) >= 0.75;
      setSpeakingFeedback(passed ? "Great attempt! Your sentence is close to the model. Try to keep the words clear." : "Good try. Listen to the model once more, then repeat the full sentence slowly.");
    };
    recognition.onerror = () => setSpeakingFeedback("Microphone access or speech recognition is unavailable. Use Listen and try again.");
    recognition.start();
    setSpeakingFeedback("Listening… say the example sentence now.");
  }

  if (mode === "test") {
    return <div className="roadmap-page placement-page">
      <div className="roadmap-heading"><div><span className="roadmap-kicker">PERSONAL LEVEL CHECK</span><h1>Find your English starting point</h1><p>15 quick questions. Answer honestly — this helps us choose the right learning route.</p></div><div className="roadmap-heading-icon">🎯</div></div>
      {!testSubmitted ? <section className="roadmap-panel">
        <div className="roadmap-progress-head"><span>Question {Math.min(Object.keys(answers).length + 1, placementQuestions.length)} of {placementQuestions.length}</span><span>{Object.keys(answers).length} answered</span></div>
        <div className="roadmap-progress-track"><span style={{ width: (Object.keys(answers).length / placementQuestions.length * 100) + "%" }} /></div>
        {placementQuestions.map((question, index) => <article className="placement-question" key={question.prompt}>
          <div className="placement-question-number">{String(index + 1).padStart(2, "0")}</div><div className="placement-question-body"><h3>{question.prompt}</h3><div className="placement-options">{question.options.map((option, optionIndex) => <button type="button" key={option} className={"placement-option " + (answers[index] === optionIndex ? "selected" : "")} onClick={() => setAnswers((old) => ({ ...old, [index]: optionIndex }))}><span>{String.fromCharCode(65 + optionIndex)}</span>{option}</button>)}</div></div>
        </article>)}
        <button className="button button-primary roadmap-submit" disabled={Object.keys(answers).length !== placementQuestions.length} onClick={submitPlacement}>Check my level <ChevronRight size={17} /></button>
      </section> : <section className="placement-result roadmap-panel">
        <div className="placement-result-emoji">{testLevel === "Basic" ? "🌱" : testLevel === "Intermediate" ? "🚀" : "🏆"}</div>
        <span className="roadmap-kicker">YOUR RESULT</span><h2>{testLevel} English</h2><p>You scored <strong>{placementScore}/{placementQuestions.length}</strong>. Your learning map will start at the {testLevel?.toLowerCase()} stage, with lessons unlocked one by one.</p>
        <div className="placement-result-levels">{levelOrder.map((level) => <div className={level === testLevel ? "active" : ""} key={level}><span>{level === "Basic" ? "🌱" : level === "Intermediate" ? "🚀" : "🏆"}</span><strong>{level}</strong><small>{level === "Basic" ? "0–5 correct" : level === "Intermediate" ? "6–10 correct" : "11–15 correct"}</small></div>)}</div>
        <button className="button button-primary" onClick={onOpenRoadmap}>Open my learning map <ChevronRight size={17} /></button>
      </section>}
    </div>;
  }

  if (activeLesson) {
    const blanksCorrect = activeLesson.blanks.every((item, index) => blankAnswers[index] === item.answer && blankChecked[index]);
    const arrangeCorrect = activeLesson.arrange.every((item, index) => (arrangeAnswers[index] ?? []).join(" ") === item.answer);
    const quizCorrect = activeLesson.quiz.filter((question, index) => lessonQuizAnswers[index] === question.answer).length;
    const lessonPassed = blanksCorrect && arrangeCorrect && lessonQuizSubmitted && quizCorrect >= Math.ceil(activeLesson.quiz.length * 0.67);
    return <div className="roadmap-page lesson-page">
      <button className="roadmap-back" onClick={() => setActiveLessonId(null)}>← Back to learning map</button>
      <div className="roadmap-heading"><div><span className="roadmap-kicker">{activeLesson.level.toUpperCase()} · LEVEL {lessons.findIndex((lesson) => lesson.id === activeLesson.id) + 1}</span><h1>{activeLesson.title}</h1><p>{activeLesson.subtitle}</p></div><div className="roadmap-heading-icon">{activeLesson.emoji}</div></div>
      <section className="lesson-visual-card"><div className="lesson-visual-scene"><div className="visual-sun">☀️</div><div className="visual-main-emoji">{activeLesson.emoji}</div><div className="visual-bubble visual-bubble-left">Hello!</div><div className="visual-bubble visual-bubble-right">I can do it!</div></div><div className="lesson-visual-copy"><span className="roadmap-kicker">LOOK · LISTEN · UNDERSTAND</span><h2>See the sentence in action</h2><p>{activeLesson.tamil}</p><button className="button button-outline" onClick={() => listen(activeLesson.examples[0])}><Volume2 size={16} /> Listen to the model sentence</button></div></section>
      <section className="roadmap-panel lesson-explanation"><span className="roadmap-kicker">01 · LEARN</span><h2>Sentence pattern</h2><div className="lesson-pattern">{activeLesson.pattern}</div><p>{activeLesson.tamil}</p><h3>Examples — உதாரணங்கள்</h3><div className="lesson-example-list">{activeLesson.examples.map((example, index) => <div key={example}><span>{index + 1}</span><p>{example}</p><button aria-label={"Listen to " + example} onClick={() => listen(example)}><Volume2 size={16} /></button></div>)}</div></section>
      <section className="roadmap-panel"><span className="roadmap-kicker">02 · PRACTICE</span><h2>Fill in the blanks</h2><p>சரியான பதிலைத் தேர்ந்தெடுக்கவும்.</p><div className="lesson-exercise-list">{activeLesson.blanks.map((item, index) => <div className="lesson-exercise" key={item.prompt}><strong>{index + 1}. {item.prompt}</strong><div className="exercise-options">{item.options.map((option) => <button key={option} type="button" className={"exercise-option " + (blankAnswers[index] === option ? "selected" : "") + (blankChecked[index] ? (option === item.answer ? " correct" : blankAnswers[index] === option ? " incorrect" : "") : "")} onClick={() => { if (!blankChecked[index]) setBlankAnswers((old) => ({ ...old, [index]: option })); }}>{option}</button>)}</div>{blankChecked[index] && <small className={blankAnswers[index] === item.answer ? "answer-correct" : "answer-incorrect"}>{blankAnswers[index] === item.answer ? "Correct!" : "Correct answer: " + item.answer}</small>}<button className="exercise-check" type="button" onClick={() => setBlankChecked((old) => ({ ...old, [index]: true }))} disabled={!blankAnswers[index] || blankChecked[index]}>Check</button></div>)}</div>
      </section>
      <section className="roadmap-panel"><span className="roadmap-kicker">03 · SENTENCE BUILDER</span><h2>Arrange the sentence</h2><p>கீழே உள்ள வார்த்தைகளைச் சரியான வரிசையில் தேர்ந்தெடுக்கவும்.</p>{activeLesson.arrange.map((item, index) => <div className="arrange-card" key={item.answer}><strong>{index + 1}. Build the sentence</strong><div className="arrange-word-bank">{item.words.map((word, wordIndex) => <button type="button" key={wordIndex + "-" + word} className="arrange-word" onClick={() => setArrangeAnswers((old) => ({ ...old, [index]: [...(old[index] ?? []), word] }))} disabled={(arrangeAnswers[index] ?? []).length >= item.words.length}>{word}</button>)}</div><div className="arrange-answer">{(arrangeAnswers[index] ?? []).map((word, wordIndex) => <button type="button" key={wordIndex} onClick={() => setArrangeAnswers((old) => ({ ...old, [index]: (old[index] ?? []).filter((_, i) => i !== wordIndex) }))}>{word} ×</button>)}</div><small>{(arrangeAnswers[index] ?? []).join(" ") === item.answer ? "Correct sentence!" : (arrangeAnswers[index] ?? []).length === item.words.length ? "Not quite — tap words below to remove them and try again." : "Tap the words in the correct order."}</small></div>)}</section>
      <section className="roadmap-panel lesson-speaking"><span className="roadmap-kicker">04 · SPEAK</span><h2>Say it out loud</h2><p>Listen first, then repeat the full sentence. Your browser checks how closely the words match.</p><div className="lesson-speaking-target">“{activeLesson.examples[0]}”</div><div className="lesson-speaking-actions"><button className="button button-outline" onClick={() => listen(activeLesson.examples[0])}><Volume2 size={16} /> Listen</button><button className="button button-primary" onClick={checkSpeaking}><Mic size={16} /> Try speaking</button></div>{speakingTranscript && <p className="lesson-transcript">I heard: “{speakingTranscript}”</p>}{speakingFeedback && <p className="lesson-feedback">{speakingFeedback}</p>}</section>
      <section className="roadmap-panel lesson-test"><span className="roadmap-kicker">05 · QUICK TEST</span><h2>Check what you learned</h2><p>Complete all practice steps and answer at least two questions correctly to unlock the next level.</p>{activeLesson.quiz.map((question, index) => <div className="lesson-quiz-question" key={question.prompt}><strong>{index + 1}. {question.prompt}</strong><div className="placement-options">{question.options.map((option, optionIndex) => <button type="button" key={option} className={"placement-option " + (lessonQuizAnswers[index] === optionIndex ? "selected" : "")} onClick={() => { if (!lessonQuizSubmitted) setLessonQuizAnswers((old) => ({ ...old, [index]: optionIndex })); }}><span>{String.fromCharCode(65 + optionIndex)}</span>{option}</button>)}</div>{lessonQuizSubmitted && <small className={lessonQuizAnswers[index] === question.answer ? "answer-correct" : "answer-incorrect"}>{question.explanation}</small>}</div>)}{lessonQuizSubmitted && <div className="lesson-result-note">{quizCorrect}/{activeLesson.quiz.length} correct · {lessonPassed ? "Level complete — next level unlocked!" : "Review the answers and retry the test."}</div>}<div className="lesson-test-actions">{!lessonQuizSubmitted ? <button className="button button-primary" disabled={Object.keys(lessonQuizAnswers).length !== activeLesson.quiz.length || !blanksCorrect || !arrangeCorrect} onClick={() => setLessonQuizSubmitted(true)}>Submit lesson test <Check size={16} /></button> : lessonPassed ? <button className="button button-primary" onClick={completeLesson}>Complete level and unlock next <ChevronRight size={16} /></button> : <button className="button button-outline" onClick={() => { setLessonQuizAnswers({}); setLessonQuizSubmitted(false); }}>Try test again <RotateCcw size={16} /></button>}</div></section>
    </div>;
  }

  const stageEmojis: Record<LearningLevel, string> = { Basic: "🌱", Intermediate: "🚀", Advanced: "🏆" };
  const stageDescriptions: Record<LearningLevel, string> = { Basic: "Start with simple words, sentence patterns and everyday grammar.", Intermediate: "Connect ideas, use more tenses and speak in real-life situations.", Advanced: "Communicate fluently with complex grammar and professional English." };
  const stageLessons = levelOrder.map((level) => ({ level, lessons: visibleLessons.filter((lesson) => lesson.level === level) })).filter((stage) => stage.lessons.length);
  return <div className="roadmap-page">
    <div className="roadmap-heading"><div><span className="roadmap-kicker">YOUR CANDY-STYLE LEARNING JOURNEY</span><h1>Every lesson unlocks your next step</h1><p>Your placement level: <strong>{currentLevel}</strong>. Finish a lesson and pass its test to move along the path.</p></div><div className="roadmap-heading-icon">🗺️</div></div>
    {!readPlacementLevel() && <div className="roadmap-callout"><CircleHelp size={20} /><div><strong>Not sure about your level yet?</strong><p>Take the placement test to start at the right stage.</p></div><button className="button button-primary" onClick={() => { setTestSubmitted(false); setAnswers({}); onLevelDetermined(initialLevel); onOpenRoadmap(); }}>Take level test <ChevronRight size={16} /></button></div>}
    <div className="roadmap-summary-cards"><div><span>🌱</span><strong>{completed.filter((id) => id.startsWith("basic-")).length}/5</strong><small>Basic levels</small></div><div><span>🚀</span><strong>{completed.filter((id) => id.startsWith("intermediate-")).length}/5</strong><small>Intermediate levels</small></div><div><span>🏆</span><strong>{completed.filter((id) => id.startsWith("advanced-")).length}/5</strong><small>Advanced levels</small></div></div>
    {stageLessons.map((stage) => <section className="roadmap-stage" key={stage.level}><div className="roadmap-stage-heading"><span>{stageEmojis[stage.level]}</span><div><h2>{stage.level}</h2><p>{stageDescriptions[stage.level]}</p></div><span className="roadmap-stage-count">{stage.lessons.filter((lesson) => completed.includes(lesson.id)).length}/{stage.lessons.length} complete</span></div><div className="candy-path">{stage.lessons.map((lesson, index) => { const isComplete = completed.includes(lesson.id); const isUnlocked = unlocked.has(lesson.id); return <div className={"candy-node-wrap " + (index % 2 ? "node-offset" : "")} key={lesson.id}><div className="candy-node-connector" /><button type="button" className={"candy-node " + (isComplete ? "node-complete" : isUnlocked ? "node-unlocked" : "node-locked")} disabled={!isUnlocked} onClick={() => { setActiveLessonId(lesson.id); setBlankAnswers({}); setBlankChecked({}); setArrangeAnswers({}); setLessonQuizAnswers({}); setLessonQuizSubmitted(false); }}><span className="candy-node-icon">{isComplete ? "⭐" : isUnlocked ? lesson.emoji : <LockKeyhole size={18} />}</span><span className="candy-node-number">LEVEL {index + 1}</span><strong>{lesson.title}</strong><small>{isComplete ? "Completed" : isUnlocked ? "Tap to learn" : "Complete the previous level"}</small></button></div>; })}</div></section>)}
    <section className="roadmap-next-step"><div className="roadmap-heading-icon">🎓</div><div><h2>Keep moving forward</h2><p>Learn the pattern, try the exercises, speak out loud and pass the quick test to unlock the next level.</p></div><button className="button button-primary" onClick={() => { const nextLesson = visibleLessons.find((lesson) => unlocked.has(lesson.id) && !completed.includes(lesson.id)); if (nextLesson) setActiveLessonId(nextLesson.id); else onStartSpeaking(); }}>Continue learning <ChevronRight size={16} /></button></section>
  </div>;
}

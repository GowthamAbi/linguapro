import "dotenv/config";
import mongoose from "mongoose";
import { connectDatabase } from "../config/database";
import { Course } from "../models/Course";
import { User } from "../models/User";

const starterCourses = [
  {
    title: "Basic English: Everyday Confidence",
    description: "Start with useful sentences, polite requests, and simple daily conversations with Tamil explanations.",
    learnerCategory: "adults",
    level: "Basic",
    industry: "general",
    goal: "daily-conversation",
    modules: [
      { title: "Introduce yourself", lessons: [
        { title: "Say your name and background", content: "Model: My name is ___. I am from ___. I work as a ___. Practise saying the three sentences aloud.", tamilMeaning: "என் பெயர் ___. நான் ___-லிருந்து வருகிறேன். நான் ___ ஆக வேலை செய்கிறேன்.", practiceType: "speaking" },
        { title: "Talk about your daily routine", content: "Model: I start work at nine. I check my tasks in the morning. I finish work in the evening.", tamilMeaning: "எனது அன்றாட வேலைகளைப் பற்றி எளிய நிகழ்காலத்தில் பேசுவது.", practiceType: "reading" },
      ]},
      { title: "Polite English", lessons: [
        { title: "Ask for help politely", content: "Practise: Could you please help me? Could you explain this again? Thank you for your support.", tamilMeaning: "மரியாதையாக உதவி கேட்கவும், மீண்டும் விளக்கம் கேட்கவும் பயன்படும் வாக்கியங்கள்.", practiceType: "roleplay" },
        { title: "Ask someone to repeat", content: "Practise: Sorry, could you say that again, please? Could you speak a little more slowly?", tamilMeaning: "புரியவில்லை என்றால் மீண்டும் சொல்லச் சொல்லும் மரியாதையான வழிகள்.", practiceType: "speaking" },
      ]},
      { title: "Build a short conversation", lessons: [
        { title: "A simple workplace conversation", content: "A: Good morning. How are you? B: I'm fine, thank you. How about you? A: I'm good. Let's start the work.", tamilMeaning: "வேலை இடத்தில் காலை நேரத்தில் பேசக்கூடிய எளிய உரையாடல்.", practiceType: "roleplay" },
        { title: "Review your first sentences", content: "Say your name, describe your job, ask for help politely, and ask someone to repeat a sentence. Repeat until you can speak without reading.", tamilMeaning: "கற்ற வாக்கியங்களைப் பார்க்காமல் பேசிப் பயிற்சி செய்யுங்கள்.", practiceType: "speaking" },
      ]},
    ],
  },
  {
    title: "Intermediate English: Workplace Communication",
    description: "Explain tasks, report progress, handle delays, and communicate clearly with colleagues and supervisors.",
    learnerCategory: "working-professionals",
    level: "Intermediate",
    industry: "garments-textile",
    goal: "manager-communication",
    modules: [
      { title: "Report daily work", lessons: [
        { title: "Explain your responsibilities", content: "Model: My main responsibility is to maintain production targets while ensuring quality and on-time delivery. Adapt this sentence to your role.", tamilMeaning: "உங்கள் பொறுப்புகளைத் தெளிவாகவும் தொழில்முறையாகவும் விளக்குவது.", practiceType: "speaking" },
        { title: "Give a progress update", content: "Model: We have completed 70% of today's target. The remaining work is in progress, and we expect to finish by 5 p.m.", tamilMeaning: "வேலையின் முன்னேற்றம், மீதமுள்ள வேலை, முடிக்கும் நேரம் ஆகியவற்றைச் சொல்வது.", practiceType: "roleplay" },
      ]},
      { title: "Describe a problem and solution", lessons: [
        { title: "Report a machine breakdown", content: "Model: The machine has stopped because of a technical issue. I have informed the mechanic, and we are working to restart production as soon as possible.", tamilMeaning: "இயந்திரக் கோளாறு, எடுத்த நடவடிக்கை, அடுத்த படி ஆகியவற்றை வரிசையாக விளக்குவது.", practiceType: "speaking" },
        { title: "Suggest an improvement", content: "Model: To reduce downtime, I recommend regular preventive maintenance and a quick response plan for breakdowns.", tamilMeaning: "ஒரு பிரச்சினைக்கான தீர்வை பரிந்துரைக்கும் தொழில்முறை வாக்கியம்.", practiceType: "reading" },
      ]},
      { title: "Meetings and teamwork", lessons: [
        { title: "Ask for clarification in a meeting", content: "Practise: Could you clarify the deadline? What should we prioritise first? Let me confirm the next steps.", tamilMeaning: "கூட்டத்தில் தெளிவுபடுத்தவும் அடுத்த நடவடிக்கைகளை உறுதிப்படுத்தவும் பயன்படும் வாக்கியங்கள்.", practiceType: "roleplay" },
        { title: "Give a concise handover", content: "Use this structure: completed work, pending work, current issue, person responsible, and expected completion time.", tamilMeaning: "ஷிப்ட் அல்லது குழு மாற்றத்தின் போது முக்கிய தகவல்களைச் சுருக்கமாக ஒப்படைப்பது.", practiceType: "speaking" },
      ]},
    ],
  },
  {
    title: "Advanced English: Interviews and Presentations",
    description: "Present ideas persuasively, answer interview questions with structure, and discuss outcomes professionally.",
    learnerCategory: "job-seekers",
    level: "Advanced",
    industry: "general",
    goal: "job-interview",
    modules: [
      { title: "Structured interview answers", lessons: [
        { title: "Explain your experience with impact", content: "Use the STAR structure: Situation, Task, Action, Result. Include a specific example and measurable result when you can support it.", tamilMeaning: "சூழ்நிலை, பொறுப்பு, எடுத்த நடவடிக்கை, கிடைத்த முடிவு என்ற STAR முறையில் பதில் அமைக்கவும்.", practiceType: "speaking" },
        { title: "Answer a strength question", content: "Model: One of my strengths is coordinating people and resolving production issues quickly. For example, ___. The result was ___. Replace the blanks with a real example.", tamilMeaning: "உங்கள் உண்மையான அனுபவத்துடன் பலத்தை விளக்கும் பதில்.", practiceType: "roleplay" },
      ]},
      { title: "Present an idea", lessons: [
        { title: "Structure a short presentation", content: "Use four parts: purpose, current situation, recommendation, expected benefit. Keep each part clear and support claims with facts.", tamilMeaning: "நோக்கம், தற்போதைய நிலை, பரிந்துரை, எதிர்பார்க்கும் பயன் என்ற வரிசையில் பேசவும்.", practiceType: "reading" },
        { title: "Handle follow-up questions", content: "Practise: That's an important question. Based on the information we have, ___. I will verify the remaining details and follow up by ___.", tamilMeaning: "உறுதியாகத் தெரியாத தகவலை ஊகிக்காமல், சரிபார்த்து பதில் தருவதாகச் சொல்வது.", practiceType: "speaking" },
      ]},
      { title: "Professional fluency", lessons: [
        { title: "Disagree respectfully", content: "Practise: I understand your point. Another option we could consider is ___. The benefit would be ___.", tamilMeaning: "மற்றவரின் கருத்தை மதித்து, மாற்று யோசனையை முன்வைப்பது.", practiceType: "roleplay" },
        { title: "Deliver a final summary", content: "Summarise your main point, the decision needed, who will act, and the deadline. Finish by checking that everyone agrees on the next step.", tamilMeaning: "முக்கிய கருத்து, முடிவு, பொறுப்பாளர், காலக்கெடு ஆகியவற்றைச் சுருக்கமாகச் சொல்லுங்கள்.", practiceType: "speaking" },
      ]},
    ],
  },
] as const;

async function seed(): Promise<void> {
  await connectDatabase();
  const teacher = await User.findOne({ role: "teacher" }).select("_id").lean();
  if (!teacher) {
    throw new Error("No teacher account exists yet. Create a teacher account, then run npm run seed:student-courses again.");
  }

  let created = 0;
  let skipped = 0;
  for (const course of starterCourses) {
    const existing = await Course.findOne({ title: course.title, learnerCategory: course.learnerCategory, level: course.level }).select("_id").lean();
    if (existing) {
      skipped += 1;
      continue;
    }
    await Course.create({ ...course, teacherId: teacher._id, status: "published" });
    created += 1;
  }
  console.info(`Starter curriculum complete. Created: ${created}; already existed: ${skipped}. Courses are stored in MongoDB.`);
}

seed()
  .catch((error: unknown) => {
    console.error("Could not seed student courses.", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });

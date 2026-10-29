import type { Response } from "express";
import { z } from "zod";
import type { AuthenticatedRequest } from "../middleware/authenticate";
import { LiveSpeakingTurn } from "../models/LiveSpeakingTurn";
const turnSchema = z.object({ transcript: z.string().trim().min(1).max(2000), sessionId: z.string().trim().min(1).max(80), level: z.enum(["Basic","Intermediate","Advanced"]).default("Basic") });
const resultSchema = z.object({ correctedSentence: z.string().min(1).max(2000), explanation: z.string().min(1).max(1500), coachReply: z.string().min(1).max(2000), grammarIssues: z.array(z.string().max(200)).max(10), vocabularySuggestions: z.array(z.string().max(100)).max(10) });
export async function createLiveSpeakingTurn(request: AuthenticatedRequest, response: Response): Promise<void> {
  const parsed = turnSchema.safeParse(request.body);
  if (!parsed.success) { response.status(400).json({ message: "Send the sentence you spoke and a valid session ID." }); return; }
  const apiKey = process.env.AI_PROVIDER_API_KEY;
  if (!apiKey) { response.status(503).json({ message: "Live AI is not configured. Add AI_PROVIDER_API_KEY to the Render backend environment." }); return; }
  const baseUrl = (process.env.AI_PROVIDER_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");
  const model = process.env.AI_MODEL || "gpt-4o-mini";
  const providerResponse = await fetch(baseUrl + "/chat/completions", {
    method: "POST", headers: { Authorization: "Bearer " + apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({ model, temperature: 0.35, response_format: { type: "json_object" }, messages: [
      { role: "system", content: "You are LinguaPro's friendly live English conversation coach. Correct grammar and word choice while preserving meaning. Explain the most useful mistakes simply and briefly, using Tamil support when useful. Respond naturally to the learner and ask one short follow-up question. Return JSON only: correctedSentence, explanation, coachReply, grammarIssues (array), vocabularySuggestions (array). Do not claim to evaluate pronunciation from text alone. Be encouraging and adapt to the learner's level." },
      { role: "user", content: JSON.stringify({ learnerLevel: parsed.data.level, learnerSaid: parsed.data.transcript }) }
    ] })
  });
  if (!providerResponse.ok) { response.status(providerResponse.status === 429 ? 429 : 502).json({ message: providerResponse.status === 429 ? "AI service is busy. Please try again shortly." : "Live AI could not process this sentence." }); return; }
  const payload = await providerResponse.json() as { choices?: Array<{ message?: { content?: string | null } }> };
  const content = payload.choices?.[0]?.message?.content;
  if (!content) { response.status(502).json({ message: "The AI returned an empty response." }); return; }
  let decoded: unknown;
  try { decoded = JSON.parse(content); } catch { response.status(502).json({ message: "The AI returned an invalid response." }); return; }
  const result = resultSchema.safeParse(decoded);
  if (!result.success) { response.status(502).json({ message: "The AI response was missing required feedback fields." }); return; }
  const saved = await LiveSpeakingTurn.create({ userId: request.userId, sessionId: parsed.data.sessionId, transcript: parsed.data.transcript, ...result.data });
  response.status(201).json({ data: { ...result.data, id: saved._id, createdAt: saved.createdAt } });
}
export async function getLiveSpeakingReport(request: AuthenticatedRequest, response: Response): Promise<void> {
  const period = request.query.period === "day" ? "day" : "week";
  const now = new Date(); const days = period === "day" ? 1 : 7;
  const start = new Date(now); start.setDate(start.getDate() - (days - 1)); start.setHours(0,0,0,0);
  const previousStart = new Date(start); previousStart.setDate(previousStart.getDate() - days);
  const [current, previous, recent] = await Promise.all([
    LiveSpeakingTurn.find({ userId: request.userId, createdAt: { $gte: start, $lte: now } }).sort({ createdAt: 1 }).lean(),
    LiveSpeakingTurn.find({ userId: request.userId, createdAt: { $gte: previousStart, $lt: start } }).lean(),
    LiveSpeakingTurn.find({ userId: request.userId }).sort({ createdAt: -1 }).limit(30).lean()
  ]);
  const wordCount = (items: typeof current) => items.reduce((sum,item) => sum + item.transcript.split(/\s+/).filter(Boolean).length, 0);
  const correctionCount = (items: typeof current) => items.filter(item => item.transcript.trim().toLowerCase().replace(/[.!?]+$/,"") !== item.correctedSentence.trim().toLowerCase().replace(/[.!?]+$/,"")).length;
  const dailyMap = new Map<string,{date:string;turns:number;words:number;corrections:number}>();
  for (const item of current) {
    const date = new Date(item.createdAt ?? now).toISOString().slice(0,10);
    const row = dailyMap.get(date) ?? { date, turns: 0, words: 0, corrections: 0 };
    row.turns++; row.words += item.transcript.split(/\s+/).filter(Boolean).length;
    if (item.transcript.trim().toLowerCase().replace(/[.!?]+$/,"") !== item.correctedSentence.trim().toLowerCase().replace(/[.!?]+$/,"")) row.corrections++;
    dailyMap.set(date,row);
  }
  response.json({ data: { period, current: { turns: current.length, words: wordCount(current), corrections: correctionCount(current) }, previous: { turns: previous.length, words: wordCount(previous), corrections: correctionCount(previous) }, daily: Array.from(dailyMap.values()), recent: recent.map(item => ({ id:item._id, sessionId:item.sessionId, transcript:item.transcript, correctedSentence:item.correctedSentence, explanation:item.explanation, coachReply:item.coachReply, grammarIssues:item.grammarIssues, vocabularySuggestions:item.vocabularySuggestions, createdAt:item.createdAt })) } });
}

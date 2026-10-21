import type { Response } from "express";
import { z } from "zod";
import type { AuthenticatedRequest } from "../middleware/authenticate";

const feedbackSchema = z.object({
  targetPhrase: z.string().trim().min(2).max(240),
  transcript: z.string().trim().max(500),
  language: z.enum(["English", "Tamil", "Malayalam", "Hindi", "Kannada", "Telugu"]).default("English"),
  level: z.enum(["Basic", "Intermediate", "Advanced"]).default("Basic"),
});

const resultSchema = z.object({
  correct: z.boolean(),
  correctedSentence: z.string().min(1).max(500),
  feedback: z.string().min(1).max(700),
  spokenFeedback: z.string().min(1).max(700),
  missingWords: z.array(z.string().max(40)).max(20),
  pronunciationTip: z.string().max(300),
});

export async function evaluateSpeaking(
  request: AuthenticatedRequest,
  response: Response,
): Promise<void> {
  const parsed = feedbackSchema.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ message: "Provide a target phrase and speech transcript." });
    return;
  }

  const apiKey = process.env.AI_PROVIDER_API_KEY;
  if (!apiKey) {
    response.status(503).json({ message: "AI feedback is not configured yet. Add AI_PROVIDER_API_KEY to the backend environment." });
    return;
  }

  const baseUrl = (process.env.AI_PROVIDER_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");
  const model = process.env.AI_MODEL || "gpt-4o-mini";
  const { targetPhrase, transcript, language, level } = parsed.data;

  const providerResponse = await fetch(baseUrl + "/chat/completions", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "You are a kind language speaking coach. Compare a speech-recognition transcript to the exact target sentence. Do not claim to measure actual pronunciation from text alone. Accept minor punctuation/capitalization differences and harmless speech-recognition noise. Return JSON only with keys correct (boolean), correctedSentence (string), feedback (short learner-friendly explanation), spokenFeedback (natural short feedback suitable for text-to-speech), missingWords (array of target words omitted from transcript), pronunciationTip (brief practical tip, or empty string). If transcript is empty, mark incorrect and encourage retry. Be supportive and concise. Do not move to the next sentence in the feedback; the app handles navigation."
        },
        {
          role: "user",
          content: JSON.stringify({ targetPhrase, transcript, language, level }),
        },
      ],
    }),
  });

  if (!providerResponse.ok) {
    const status = providerResponse.status;
    response.status(status === 429 ? 429 : 502).json({
      message: status === 429
        ? "AI feedback is busy right now. Please try again shortly."
        : "The AI feedback service could not evaluate this attempt.",
    });
    return;
  }

  const providerPayload = await providerResponse.json() as {
    choices?: Array<{ message?: { content?: string | null } }>;
  };
  const content = providerPayload.choices?.[0]?.message?.content;
  if (!content) {
    response.status(502).json({ message: "The AI feedback response was empty." });
    return;
  }

  let decoded: unknown;
  try {
    decoded = JSON.parse(content);
  } catch {
    response.status(502).json({ message: "The AI feedback response was invalid." });
    return;
  }

  const result = resultSchema.safeParse(decoded);
  if (!result.success) {
    response.status(502).json({ message: "The AI feedback response did not match the expected format." });
    return;
  }

  response.json({ data: result.data });
}

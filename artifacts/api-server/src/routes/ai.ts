import { Router } from "express";
import OpenAI from "openai";
import { db } from "@workspace/db";
import { campaignsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/auth";
import { logger } from "../lib/logger";

const router = Router();

const recipientTitles: Record<string, string> = {
  district_collector: "The District Collector",
  municipality: "The Municipal Commissioner",
  cm_office: "The Chief Minister",
  minister: "The Honourable Minister",
  mp_mla: "The Member of Parliament / MLA",
  other: "The Concerned Authority",
};

function getOpenAI(): OpenAI | null {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  return new OpenAI({ apiKey: key });
}

// POST /api/ai/generate-email
router.post("/generate-email", requireAuth, async (req: AuthRequest, res) => {
  const {
    concern,
    recipientType,
    language = "english",
    campaignId,
  } = req.body as {
    concern: string;
    recipientType: string;
    language?: string;
    campaignId?: number;
  };

  const recipientTitle = recipientTitles[recipientType] ?? "The Concerned Authority";

  const openai = getOpenAI();
  if (!openai) {
    // Fallback draft without AI
    res.json({
      subject: `Citizen Concern: ${concern.slice(0, 60)}`,
      body: `Respected ${recipientTitle},\n\nI am writing to bring to your attention the following concern:\n\n${concern}\n\nI kindly request your urgent attention and appropriate action on this matter.\n\nYours sincerely,\nA Concerned Citizen`,
      recipientTitle,
      language,
    });
    return;
  }

  const langInstruction =
    language === "hindi"
      ? "Write the email in Hindi (Devanagari script)."
      : language === "marathi"
        ? "Write the email in Marathi (Devanagari script)."
        : "Write the email in formal English.";

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an expert civic communication writer helping Indian citizens write professional emails to government officials. ${langInstruction} Always be respectful, factual, and solution-oriented. Return a JSON object with fields: subject (string) and body (string).`,
        },
        {
          role: "user",
          content: `Write a formal email to ${recipientTitle} about this citizen concern: "${concern}"`,
        },
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(completion.choices[0].message.content ?? "{}") as {
      subject?: string;
      body?: string;
    };
    res.json({
      subject: result.subject ?? `Citizen Concern: ${concern.slice(0, 60)}`,
      body: result.body ?? concern,
      recipientTitle,
      language,
    });
  } catch (err) {
    logger.error({ err }, "OpenAI email generation failed");
    res.json({
      subject: `Citizen Concern: ${concern.slice(0, 60)}`,
      body: `Respected ${recipientTitle},\n\nI am writing to bring to your attention the following concern:\n\n${concern}\n\nI kindly request your urgent attention and appropriate action on this matter.\n\nYours sincerely,\nA Concerned Citizen`,
      recipientTitle,
      language,
    });
  }
});

// POST /api/ai/generate-letter
router.post("/generate-letter", requireAuth, async (req: AuthRequest, res) => {
  const {
    concern,
    recipientType,
    senderName,
    senderAddress,
    language = "english",
  } = req.body as {
    concern: string;
    recipientType: string;
    senderName: string;
    senderAddress?: string;
    language?: string;
  };

  const recipientTitle = recipientTitles[recipientType] ?? "The Concerned Authority";
  const date = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const openai = getOpenAI();
  if (!openai) {
    const content = `${senderName}\n${senderAddress ?? ""}\n\nDate: ${date}\n\nTo,\n${recipientTitle}\n\nSubject: Civic Concern – Request for Immediate Action\n\nRespected Sir/Madam,\n\nI, ${senderName}, wish to bring to your kind attention the following matter of public importance:\n\n${concern}\n\nI sincerely request your honourable office to take note of this issue and initiate appropriate action at the earliest.\n\nThank you for your time and consideration.\n\nYours faithfully,\n${senderName}`;
    res.json({ content, recipientTitle, language });
    return;
  }

  const langInstruction =
    language === "hindi"
      ? "Write the letter in Hindi (Devanagari script)."
      : language === "marathi"
        ? "Write the letter in Marathi (Devanagari script)."
        : "Write the letter in formal English.";

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an expert civic letter writer for Indian citizens. ${langInstruction} Write a formal official letter. Return a JSON with field: content (full letter as a string with proper formatting).`,
        },
        {
          role: "user",
          content: `Write a formal letter from ${senderName} (address: ${senderAddress ?? "N/A"}) to ${recipientTitle}, dated ${date}, about: "${concern}"`,
        },
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(completion.choices[0].message.content ?? "{}") as {
      content?: string;
    };
    res.json({
      content: result.content ?? concern,
      recipientTitle,
      language,
    });
  } catch (err) {
    logger.error({ err }, "OpenAI letter generation failed");
    const content = `${senderName}\n${senderAddress ?? ""}\n\nDate: ${date}\n\nTo,\n${recipientTitle}\n\nSubject: Civic Concern\n\nRespected Sir/Madam,\n\n${concern}\n\nYours faithfully,\n${senderName}`;
    res.json({ content, recipientTitle, language });
  }
});

// POST /api/ai/summarize
router.post("/summarize", requireAuth, async (req: AuthRequest, res) => {
  const { campaignId } = req.body as { campaignId: number };

  const [campaign] = await db
    .select()
    .from(campaignsTable)
    .where(eq(campaignsTable.id, campaignId))
    .limit(1);

  if (!campaign) {
    res.status(404).json({ error: "Campaign not found" });
    return;
  }

  const openai = getOpenAI();
  if (!openai) {
    res.json({
      summary: campaign.description.slice(0, 300),
      keyPoints: [
        `Category: ${campaign.category}`,
        `Status: ${campaign.status}`,
        campaign.location ? `Location: ${campaign.location}` : "National campaign",
      ],
    });
    return;
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a civic analyst summarizing public campaigns for Indian citizens. Return JSON with: summary (2-3 sentence overview, string) and keyPoints (array of 3-5 short strings).`,
        },
        {
          role: "user",
          content: `Summarize this campaign titled "${campaign.title}" (${campaign.category}): ${campaign.description}`,
        },
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(completion.choices[0].message.content ?? "{}") as {
      summary?: string;
      keyPoints?: string[];
    };
    res.json({
      summary: result.summary ?? campaign.description.slice(0, 300),
      keyPoints: result.keyPoints ?? [],
    });
  } catch (err) {
    logger.error({ err }, "OpenAI summarize failed");
    res.json({
      summary: campaign.description.slice(0, 300),
      keyPoints: [`Category: ${campaign.category}`, `Status: ${campaign.status}`],
    });
  }
});

export default router;

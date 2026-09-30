import Groq from 'groq-sdk';
import { z } from 'zod';

const MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';

let client = null;
function getClient() {
  if (!process.env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is not configured. Add it to your .env file (local) or Vercel env vars.');
  }
  // Created lazily: `new Groq()` throws at import time if the key is missing,
  // which used to crash every API route (even /api/health).
  client ??= new Groq({ apiKey: process.env.GROQ_API_KEY });
  return client;
}

function parseJson(content, fallback) {
  if (!content) return fallback;
  const cleaned = String(content).replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start !== -1 && end > start) {
      try {
        return JSON.parse(cleaned.slice(start, end + 1));
      } catch {
        /* fall through */
      }
    }
    throw new Error('The AI model returned invalid JSON');
  }
}

const text = z.string().nullish().transform((v) => (v == null ? '' : String(v).trim()));

const extractionSchema = z.object({
  medications: z
    .array(
      z.object({
        name: z.string().min(1),
        dose: text,
        frequency: text,
        route: text,
        duration: text,
      })
    )
    .default([]),
});

export async function extractPrescription(prescriptionText) {
  const completion = await getClient().chat.completions.create({
    model: MODEL,
    temperature: 0,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content:
          'Extract medications from the prescription text. Return JSON only in the form {"medications":[{"name":"","dose":"","frequency":"","route":"","duration":""}]}. ' +
          'Use the generic or brand name exactly as written, and use an empty string for any field that is not stated. Do not infer medications that are not present in the text.',
      },
      { role: 'user', content: prescriptionText },
    ],
  });

  const raw = parseJson(completion.choices?.[0]?.message?.content, { medications: [] });
  const parsed = extractionSchema.safeParse(raw);
  if (!parsed.success) throw new Error('The AI model returned an unexpected medication format');
  return parsed.data;
}

const explanationSchema = z.object({
  explanations: z
    .array(
      z.object({
        id: z.string(),
        mechanism: text,
        clinicalConsiderations: text,
      })
    )
    .default([]),
});

export async function explainFindings(context) {
  const completion = await getClient().chat.completions.create({
    model: MODEL,
    temperature: 0.2,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content:
          'You explain medication safety findings to clinicians clearly and cautiously. Use ONLY the findings and evidence excerpts provided. ' +
          'Do not create new findings, diagnoses, doses, or treatment instructions. ' +
          'Return JSON in the form {"explanations":[{"id":"<finding id>","mechanism":"1-2 sentences on why the conflict matters, grounded in the evidence","clinicalConsiderations":"1-2 sentences on what a clinician may want to review"}]}. ' +
          'Final decisions remain with a qualified healthcare professional.',
      },
      { role: 'user', content: JSON.stringify(context) },
    ],
  });

  const raw = parseJson(completion.choices?.[0]?.message?.content, { explanations: [] });
  const parsed = explanationSchema.safeParse(raw);
  return parsed.success ? parsed.data : { explanations: [] };
}

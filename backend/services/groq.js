import Groq from 'groq-sdk';
import { z } from 'zod';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const medicationSchema = z.object({
  name: z.string().min(1),
  dose: z.string().optional().default(''),
  frequency: z.string().optional().default(''),
  route: z.string().optional().default(''),
  duration: z.string().optional().default(''),
});

const extractionSchema = z.object({
  medications: z.array(medicationSchema),
});

function parseJson(content) {
  try {
    return JSON.parse(content || '{"medications":[]}');
  } catch {
    throw new Error('Groq returned invalid JSON');
  }
}

export async function extractPrescription(text) {
  if (!process.env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is not configured');
  }

  const completion = await groq.chat.completions.create({
    model: 'openai/gpt-oss-120b',
    temperature: 0,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content:
          'Extract medications from the prescription text. Return JSON only with a medications array. Each medication must contain name, dose, frequency, route, and duration when present. Do not infer medications not present in the text. Preserve wording when a field is unclear.',
      },
      { role: 'user', content: text },
    ],
  });

  const parsed = parseJson(completion.choices?.[0]?.message?.content);
  return extractionSchema.parse(parsed);
}

export async function explainFindings(context) {
  if (!process.env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is not configured');
  }

  const completion = await groq.chat.completions.create({
    model: 'openai/gpt-oss-120b',
    temperature: 0.2,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content:
          'Explain provided clinical safety findings clearly and cautiously. Do not create new findings, diagnoses, or treatment instructions. Return JSON with explanations only. Final decisions remain with a qualified healthcare professional.',
      },
      { role: 'user', content: JSON.stringify(context) },
    ],
  });

  return parseJson(completion.choices?.[0]?.message?.content);
}

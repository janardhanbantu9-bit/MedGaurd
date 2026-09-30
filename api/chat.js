import Groq from 'groq-sdk';
import { fail } from './_http.js';
import { requireUser } from './_auth.js';
import { getOwnedPatientContext } from './_patient.js';

const MODEL =
  process.env.GROQ_CHAT_MODEL ||
  process.env.GROQ_MODEL ||
  'openai/gpt-oss-120b';

let client;

function getClient() {
  if (!process.env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is not configured');
  }

  client ??= new Groq({
    apiKey: process.env.GROQ_API_KEY,
    timeout: 30000,
  });

  return client;
}

function compactContext(patient = {}) {
  return {
    age: patient.age ?? null,
    sex: patient.sex ?? null,
    weight: patient.weight ?? null,
    allergies: (patient.allergies ?? []).map((a) => ({
      name: a.name,
      severity: a.severity,
      reaction: a.reaction,
    })),
    diagnoses: (patient.diagnoses ?? []).map((d) => ({
      name: d.name,
      status: d.status,
    })),
    currentMedications: (patient.currentMeds ?? []).map((m) => ({
      name: m.name,
      dose: m.dose,
      frequency: m.freq,
      route: m.route,
    })),
  };
}

const SYSTEM = `
You are MediGuard AI, a concise medication-information assistant.

Your job:
- Explain medications, prescriptions, allergies, diagnoses, and MediGuard results.
- Use the supplied patient context only when relevant.
- Answer the user's question first.

Safety:
- Do not diagnose.
- Do not prescribe.
- Do not tell the user to start, stop, or change a medication.
- Do not invent drug interactions, contraindications, dosage limits, or patient-specific conclusions.
- MediGuard's deterministic safety checks are the source of truth for detected safety findings.
- Groq explains findings; it does not create safety findings.
- For individualized interaction, allergy, duplicate-therapy, disease-conflict, or dose-safety questions, tell the user to use MediGuard Safety Check or speak with a qualified healthcare professional.
- Never claim that a medication is completely safe.

Style:
- Be brief, direct, and conversational.
- Usually 2-5 sentences.
- Maximum 100 words unless the user explicitly asks for more detail.
- Do not repeat the question.
- Do not restate the full patient profile.
- Do not dump unrelated medical information.
- Do not use headings for simple questions.
- Avoid long disclaimers.
- Explain medical terms in plain language.
`;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = await requireUser(req, res);
  if (!user) return;

  try {
    const question = String(req.body?.message ?? '').trim();

    if (!question) {
      return res.status(400).json({ error: 'A message is required' });
    }

    if (question.length > 2000) {
      return res.status(400).json({ error: 'Message is too long' });
    }

    const patient = await getOwnedPatientContext(user.id);
    const userContext = compactContext(patient || {});

    const completion = await getClient().chat.completions.create({
      model: MODEL,
      temperature: 0.2,
      max_tokens: 180,
      messages: [
        { role: 'system', content: SYSTEM },
        {
          role: 'user',
          content: JSON.stringify({ question, userContext }),
        },
      ],
    });

    const answer = completion.choices?.[0]?.message?.content?.trim();
    if (!answer) throw new Error('The AI returned an empty answer');

    return res.status(200).json({ answer, model: MODEL });
  } catch (error) {
    console.error('MediGuard chat error:', error);
    return fail(res, error, 'AI help unavailable');
  }
}

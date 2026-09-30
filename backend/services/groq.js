import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

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
          'Extract medications from the prescription text. Return JSON only with a medications array. Each medication must contain name, dose, frequency, route, and duration. Do not infer medications not present in the text.',
      },
      { role: 'user', content: text },
    ],
  });

  return JSON.parse(completion.choices?.[0]?.message?.content || '{"medications":[]}');
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

  return JSON.parse(completion.choices?.[0]?.message?.content || '{"explanations":[]}');
}

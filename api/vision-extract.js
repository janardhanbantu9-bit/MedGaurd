import Groq from 'groq-sdk';
import { extractMedications } from '../backend/pipeline/analyzePrescription.js';
import { fail } from './_http.js';
import { requireUser } from './_auth.js';
import { checkRateLimit } from './_rateLimit.js';

// 3 MB binary image becomes ~4.0 MB base64, comfortably below Vercel's 4.5 MB body limit
const MAX_IMAGE_BYTES = 3 * 1024 * 1024;
const VISION_MODEL = process.env.GROQ_VISION_MODEL || 'llama-3.2-11b-vision-preview';
const OCR_PROMPT = 'Transcribe only the text that is visibly present in this prescription image. Preserve the wording, numbers, units, and line breaks as faithfully as possible. Do not infer, complete, interpret, or add any text. If a part is unreadable, mark it as [unreadable]. Do not identify medicines beyond what is legible. Return JSON only as {"text":"faithful transcription"}.';

function decodeImage(image) {
  if (typeof image !== 'string') throw new Error('An image data URL is required');
  const match = image.match(/^data:(image\/(?:png|jpe?g|webp|gif));base64,([A-Za-z0-9+/]+={0,2})$/i);
  if (!match) throw new Error('Provide a valid base64 PNG, JPEG, WEBP, or GIF image');
  const base64 = match[2];
  const bytes = Math.floor(base64.length * 3 / 4) - (base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0);
  if (bytes > MAX_IMAGE_BYTES) throw new Error('Image must be approximately 3 MB or smaller to process safely');
  return { mimeType: match[1].toLowerCase(), image };
}

function parseVisionJson(content) {
  const cleaned = String(content ?? '').replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
  try {
    const parsed = JSON.parse(cleaned);
    return typeof parsed.text === 'string' ? parsed.text.trim() : '';
  } catch {
    throw new Error('The vision model returned invalid transcription JSON');
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const user = await requireUser(req, res);
  if (!user) return;

  const rateCheck = checkRateLimit(`vision:${user.id}`, 15, 60000);
  if (!rateCheck.allowed) {
    return res.status(429).json({ error: `Too many image scan requests. Please wait ${rateCheck.retryAfterSeconds} seconds.` });
  }

  try {
    const image = decodeImage(req.body?.image);
    if (!process.env.GROQ_API_KEY) throw new Error('GROQ_API_KEY is not configured');
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY, timeout: 25000 });
    const completion = await groq.chat.completions.create({
      model: VISION_MODEL,
      temperature: 0,
      response_format: { type: 'json_object' },
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: OCR_PROMPT },
          { type: 'image_url', image_url: { url: image.image } },
        ],
      }],
    });
    const text = parseVisionJson(completion.choices?.[0]?.message?.content);
    if (!text) throw new Error('No readable text was found in the image. Please try a clearer picture or enter text manually.');
    const extraction = await extractMedications(text);
    return res.status(200).json({ text, ...extraction });
  } catch (error) {
    return fail(res, error, 'Image extraction failed');
  }
}

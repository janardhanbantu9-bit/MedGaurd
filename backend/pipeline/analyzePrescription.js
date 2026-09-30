import { extractPrescription } from '../services/groq.js';
import { normalizeDrug } from '../services/rxnorm.js';
import { getDrugLabel } from '../services/openfda.js';

export async function analyzePrescription({ patient = {}, prescription = '' }) {
  if (!prescription || typeof prescription !== 'string') {
    throw new Error('Prescription text is required');
  }

  const extracted = await extractPrescription(prescription);
  const medications = Array.isArray(extracted?.medications)
    ? extracted.medications
    : [];

  const normalized = await Promise.all(
    medications.map(async (med) => {
      const drug = await normalizeDrug(med.name);
      let label = null;

      try {
        label = await getDrugLabel(med.name);
      } catch (error) {
        console.warn(`openFDA lookup failed for ${med.name}:`, error.message);
      }

      return {
        ...med,
        ...drug,
        labelAvailable: Boolean(label),
      };
    })
  );

  return {
    patient,
    medications: normalized,
    findings: [],
    summary: {
      high: 0,
      review: 0,
      safe: 0,
    },
    status: 'extraction-and-normalization-complete',
  };
}

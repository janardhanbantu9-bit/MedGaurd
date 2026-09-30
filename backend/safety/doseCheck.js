import { doseToMg, dosesPerDay, sectionText } from '../utils/normalize.js';

const UNIT_TO_MG = { mg: 1, mcg: 0.001, g: 1000 };

/** Pulls "maximum ... N mg/day" style limits out of the dosage section. */
function maxDailyDosesMg(text) {
  const limits = [];
  const re = /(?:maximum|max\.?|not\s+(?:to\s+)?exceed|should\s+not\s+exceed|exceed)[^.;]{0,100}?(\d[\d,]*(?:\.\d+)?)\s*(mg|mcg|g)\b([^.;]{0,50})/gi;
  let m;
  while ((m = re.exec(text))) {
    const perDay = /\/\s*day|per\s+day|daily|a\s+day|24\s*hours?/i.test(m[3]) || /daily|per day/i.test(m[0]);
    if (!perDay) continue;
    limits.push(Number(m[1].replace(/,/g, '')) * UNIT_TO_MG[m[2].toLowerCase()]);
  }
  return limits;
}

export async function checkDose({ newMeds }) {
  const findings = [];

  for (const med of newMeds) {
    const perDose = doseToMg(med.dose);
    const perDay = dosesPerDay(med.frequency);
    if (!med.label || perDose == null || perDay == null) continue;

    const limits = maxDailyDosesMg(sectionText(med.label, 'dosage_and_administration'));
    if (limits.length === 0) continue;

    // Labels list different ceilings per indication; only flag when above the highest one found.
    const ceiling = Math.max(...limits);
    const total = perDose * perDay;
    if (total <= ceiling) continue;

    findings.push({
      category: 'Dose Check',
      severity: 'review',
      title: `${med.name} daily dose may exceed label maximum`,
      summary: `${med.dose} ${med.frequency} totals about ${Math.round(total)} mg/day, above the ${Math.round(ceiling)} mg/day maximum mentioned in the FDA label.`,
      affectedMeds: [`${med.name} (New)`],
      evidenceSource: 'openFDA drug label – Dosage and Administration section',
      evidence: [{ source: `${med.name} FDA label`, snippet: `Maximum daily dose found in label text: ${Math.round(ceiling)} mg.` }],
      action: 'Verify the dose and frequency with the prescriber.',
    });
  }
  return findings;
}

import { doseToMg, dosesPerDay, sectionText } from '../utils/normalize.js';

const UNIT_TO_MG = { mg: 1, mcg: 0.001, μg: 0.001, ug: 0.001, g: 1000 };

/** Pulls "maximum ... N mg/day" style limits out of the dosage section. */
function maxDailyDosesMg(text) {
  const limits = [];
  const re = /(?:maximum|max\.?|not\s+(?:to\s+)?exceed|should\s+not\s+exceed|exceed)[^.;]{0,100}?(\d[\d,]*(?:\.\d+)?)\s*(mg|mcg|μg|ug|g)\b([^.;]{0,50})/gi;
  let m;
  while ((m = re.exec(text))) {
    const perDay = /\/\s*day|per\s+day|daily|a\s+day|24\s*hours?/i.test(m[3]) || /daily|per day/i.test(m[0]);
    if (!perDay) continue;
    const cleanNum = m[1].replace(/,/g, '');
    const unitMultiplier = UNIT_TO_MG[m[2].toLowerCase()] ?? 1;
    const val = Number(cleanNum) * unitMultiplier;
    if (Number.isFinite(val) && val > 0 && val <= 100000) {
      limits.push(val);
    }
  }
  return limits;
}

export async function checkDose({ newMeds }) {
  const findings = [];

  for (const med of newMeds) {
    // If dose or frequency is completely missing
    if (!med.dose || !med.frequency) {
      findings.push({
        category: 'Dose Check',
        severity: 'review',
        title: `Dose details incomplete for ${med.name}`,
        summary: `Prescription does not specify a complete dose or frequency. Automated dose checking could not run.`,
        affectedMeds: [`${med.name} (New)`],
        evidenceSource: 'Prescription text',
        evidence: [],
        action: 'Confirm the exact dose and schedule with the prescriber.',
      });
      continue;
    }

    const perDose = doseToMg(med.dose);
    const perDay = dosesPerDay(med.frequency);

    // If dose could not be parsed, or if schedule is weekly/monthly/PRN
    if (perDose == null || perDay == null) {
      findings.push({
        category: 'Dose Check',
        severity: 'review',
        title: `Schedule requires verification: ${med.name}`,
        summary: `The prescribed schedule "${med.dose} ${med.frequency}" contains non-daily, PRN, or ambiguous dosing that cannot be verified by daily limits.`,
        affectedMeds: [`${med.name} (New)`],
        evidenceSource: 'Prescription details',
        evidence: [],
        action: 'Verify dosing interval and maximum daily intake manually.',
      });
      continue;
    }

    if (!med.label) {
      // When label is missing, pipeline data coverage check handles it
      continue;
    }

    const limits = maxDailyDosesMg(sectionText(med.label, 'dosage_and_administration'));
    if (limits.length === 0) {
      // The FDA label does not have a single numerical max ceiling in text
      findings.push({
        category: 'Dose Check',
        severity: 'review',
        title: `Could not verify dose ceiling for ${med.name}`,
        summary: `The FDA label for ${med.name} does not state a numerical daily maximum limit. Calculated daily dose is ${med.dose} ${med.frequency} (approx. ${Math.round(perDose * perDay)} mg/day).`,
        affectedMeds: [`${med.name} (New)`],
        evidenceSource: 'openFDA drug label – Dosage and Administration',
        evidence: [{ source: `${med.name} FDA label`, snippet: 'No explicit daily maximum ceiling found in text.' }],
        action: 'Verify indication-specific dosing guidelines in standard clinical references.',
      });
      continue;
    }

    const ceiling = Math.max(...limits);
    const total = perDose * perDay;
    if (total > ceiling) {
      findings.push({
        category: 'Dose Check',
        severity: 'high',
        title: `${med.name} daily dose may exceed label maximum`,
        summary: `${med.dose} ${med.frequency} totals about ${Math.round(total)} mg/day, exceeding the ${Math.round(ceiling)} mg/day maximum mentioned in the FDA label.`,
        affectedMeds: [`${med.name} (New)`],
        evidenceSource: 'openFDA drug label – Dosage and Administration section',
        evidence: [{ source: `${med.name} FDA label`, snippet: `Maximum daily dose found in label text: ${Math.round(ceiling)} mg.` }],
        action: 'Verify the dose and frequency with the prescriber before dispensing.',
      });
    }
  }

  return findings;
}

const SEVERE_KEYWORDS = /contraindicat|avoid|serious|fatal|life-threatening|severe|major|bleed|hemorrhag|toxicity|black\s*box/i;

export function normalizeText(value = '') {
  return String(value ?? '').toLowerCase().replace(/\s+/g, ' ').trim();
}

export function cleanDrugName(value = '') {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

export function termRegex(term) {
  const escaped = String(term ?? '').trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return escaped ? new RegExp(`\\b${escaped}\\b`, 'i') : /(?!) /;
}

/**
 * Searches text for any matching terms.
 * Prioritizes snippets that contain severe clinical contraindications or warnings,
 * so a benign mention early in the label does not hide a severe contraindication later.
 */
export function findSnippet(text, terms = []) {
  const source = String(text ?? '').replace(/\s+/g, ' ').trim();
  if (!source || !terms.length) return null;

  let bestSnippet = null;
  let foundSevere = false;

  for (const term of terms) {
    const re = new RegExp(`\\b${String(term).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    let match;
    while ((match = re.exec(source)) !== null) {
      const start = Math.max(0, match.index - 100);
      const end = Math.min(source.length, match.index + match[0].length + 180);
      const snippet = `${start ? '…' : ''}${source.slice(start, end)}${end < source.length ? '…' : ''}`;

      if (SEVERE_KEYWORDS.test(snippet)) {
        return snippet; // Immediate return on severe contraindication/warning match
      }

      if (!bestSnippet) {
        bestSnippet = snippet;
      }
    }
  }

  return bestSnippet;
}

/**
 * Parses dosage string into milligrams (mg).
 * Accurately handles:
 * - "1,000 mg" -> 1000 mg (thousands separator)
 * - "0,5 mg" -> 0.5 mg (decimal comma)
 * Rejects ambiguous, zero, negative, or absurd doses.
 */
export function doseToMg(value) {
  if (value == null) return null;
  let str = String(value).trim();
  if (!str) return null;

  // Reject negative numbers
  if (/-\s*\d/.test(str)) return null;

  // Check for comma usage
  const commaCount = (str.match(/,/g) || []).length;
  if (commaCount > 0) {
    const isValidThousands = /^\d{1,3}(?:,\d{3})+(?:\.\d+)?\s*(mcg|μg|ug|mg|g)\b/i.test(str);
    const isSingleDecimalComma = commaCount === 1 && /^\d+,\d+\s*(mcg|μg|ug|mg|g)\b/i.test(str);
    if (!isValidThousands && !isSingleDecimalComma) {
      return null;
    }

    if (isValidThousands) {
      str = str.replace(/,/g, '');
    } else if (isSingleDecimalComma) {
      str = str.replace(',', '.');
    }
  }

  const match = str.match(/(\d+(?:\.\d+)?)\s*(mcg|μg|ug|mg|g)\b/i);
  if (!match) return null;

  const amount = Number(match[1]);
  if (!Number.isFinite(amount) || amount <= 0 || amount > 100000) return null;

  const unit = match[2].toLowerCase();
  return amount * (unit === 'g' ? 1000 : ['mcg', 'μg', 'ug'].includes(unit) ? 0.001 : 1);
}

/**
 * Parses frequency into daily multiplier.
 * Rejects weekly, monthly, PRN, or ambiguous non-daily schedules explicitly
 * so the dose check does not falsely multiply weekly doses by 7.
 */
export function dosesPerDay(value) {
  if (value == null) return null;
  const text = normalizeText(value);
<<<<<<< HEAD
  if (!text) return null;

  // Explicitly reject non-daily schedules from being counted as daily
  if (/\b(weekly|week|monthly|month|every\s+(?:other\s+)?week|prn|as\s+needed|when\s+needed)\b/i.test(text)) {
    return null;
  }

  const explicit = text.match(/\b(\d+(?:\.\d+)?)\s*(?:times|doses?)\s*(?:per|a|\/)?\s*day\b/);
  if (explicit) {
    const n = Number(explicit[1]);
    return n > 0 && n <= 24 ? n : null;
  }

  const every = text.match(/\bevery\s+(\d+(?:\.\d+)?)\s*(hours?|hrs?|h)\b/);
  if (every && Number(every[1]) > 0) {
    const hours = Number(every[1]);
    return hours >= 1 && hours <= 24 ? 24 / hours : null;
  }

  const standard = {
    'once daily': 1,
    'once a day': 1,
    '1 time daily': 1,
    '1 time a day': 1,
    'daily': 1,
    'qd': 1,
    'q.d.': 1,
    'qhs': 1,
    'q.h.s.': 1,
    'at bedtime': 1,
    'twice daily': 2,
    'twice a day': 2,
    '2 times daily': 2,
    '2 times a day': 2,
    'bid': 2,
    'b.i.d.': 2,
    'three times daily': 3,
    'three times a day': 3,
    '3 times daily': 3,
    '3 times a day': 3,
    'tid': 3,
    't.i.d.': 3,
    'four times daily': 4,
    'four times a day': 4,
    '4 times daily': 4,
    '4 times a day': 4,
    'qid': 4,
    'q.i.d.': 4,
  };

  if (standard[text] != null) return standard[text];
=======
  const explicit = text.match(/\b(\d+(?:\.\d+)?)\s*(?:times|doses?)\s*(?:per|a|\/)?\s*(?:day|daily)\b/);
  if (explicit) return Number(explicit[1]);
  const every = text.match(/\b(?:every\s+|q)(\d+(?:\.\d+)?)\s*(?:hours?|hrs?|h)\b/);
  if (every && Number(every[1]) > 0) return 24 / Number(every[1]);
  const common = [
    [/\b(?:four\s+times(?:\s+(?:(?:a\s+)?day|daily))?|qid)\b/, 4],
    [/\b(?:three\s+times(?:\s+(?:(?:a\s+)?day|daily))?|tid)\b/, 3],
    [/\b(?:twice(?:\s+(?:(?:a\s+)?day|daily))?|bid)\b/, 2],
    [/\b(?:once(?:\s+(?:(?:a\s+)?day|daily))?|daily)\b/, 1],
  ];
  const matched = common.find(([pattern]) => pattern.test(text));
  if (matched) return matched[1];
>>>>>>> main
  return null;
}

/** True when wording expressly says the apparent risk is absent. */
export function hasNegatedSafetyLanguage(text) {
  const normalized = normalizeText(text);
  return /\b(?:not|no|without|never)\b(?:\W+\w+){0,4}\W+(?:contraindicat(?:ed|ion)?|avoid(?:ed|ance)?|recommend(?:ed|ation)?|serious|fatal|life[- ]threatening|severe)\b/i.test(normalized);
}

/**
 * High severity requires direct, non-negated contraindication-level wording.
 * Generic warning language remains a review finding.
 */
export function hasDefinitiveSafetyLanguage(text) {
  if (hasNegatedSafetyLanguage(text)) return false;
  return /\b(?:contraindicat(?:ed|ion)?|fatal|life[- ]threatening)\b/i.test(String(text ?? ''));
}

export function sectionText(label, ...sections) {
  if (!label || typeof label !== 'object') return '';
  return sections.flatMap((section) => {
    const value = label[section];
    return Array.isArray(value) ? value : value == null ? [] : [value];
  }).map((value) => String(value ?? '')).filter(Boolean).join('\n');
}

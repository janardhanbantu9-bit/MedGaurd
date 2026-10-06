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

export function findSnippet(text, terms = []) {
  const source = String(text ?? '').replace(/\s+/g, ' ').trim();
  for (const term of terms) {
    const match = termRegex(term).exec(source);
    if (match) {
      const start = Math.max(0, match.index - 100);
      const end = Math.min(source.length, match.index + match[0].length + 180);
      return `${start ? '…' : ''}${source.slice(start, end)}${end < source.length ? '…' : ''}`;
    }
  }
  return null;
}

export function doseToMg(value) {
  const match = String(value ?? '').match(/(\d+(?:\.\d+)?)\s*(mcg|μg|ug|mg|g)\b/i);
  if (!match) return null;
  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();
  return amount * (unit === 'g' ? 1000 : ['mcg', 'μg', 'ug'].includes(unit) ? 0.001 : 1);
}

export function dosesPerDay(value) {
  const text = normalizeText(value);
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

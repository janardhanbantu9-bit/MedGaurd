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
  const explicit = text.match(/\b(\d+(?:\.\d+)?)\s*(?:times|doses?)\s*(?:per|a|\/)?\s*day\b/);
  if (explicit) return Number(explicit[1]);
  const every = text.match(/\bevery\s+(\d+(?:\.\d+)?)\s*(hours?|hrs?|h)\b/);
  if (every && Number(every[1]) > 0) return 24 / Number(every[1]);
  const common = { once: 1, daily: 1, 'once daily': 1, bid: 2, 'twice daily': 2, tid: 3, 'three times daily': 3, qid: 4, 'four times daily': 4 };
  if (common[text] != null) return common[text];
  return null;
}

export function sectionText(label, ...sections) {
  if (!label || typeof label !== 'object') return '';
  return sections.flatMap((section) => {
    const value = label[section];
    return Array.isArray(value) ? value : value == null ? [] : [value];
  }).map((value) => String(value ?? '')).filter(Boolean).join('\n');
}

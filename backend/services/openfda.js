const ENDPOINT = 'https://api.fda.gov/drug/label.json';
const MAX_CANDIDATES = 100;

function normalized(value) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/[®™]/g, '')
    .replace(/\b\d+(?:\.\d+)?\s*(?:mcg|μg|ug|mg|g|ml|%|units?)\b/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function values(label, field) {
  const value = label?.[field] ?? label?.openfda?.[field];
  return (Array.isArray(value) ? value : value == null ? [] : [value])
    .map((item) => String(item ?? '').trim())
    .filter(Boolean);
}

function matchesName(label, name, fields) {
  const target = normalized(name);
  return Boolean(target) && fields.some((field) => values(label, field).some((value) => normalized(value) === target));
}

function activeIngredientMatches(label, ingredient) {
  const target = normalized(ingredient);
  return Boolean(target) && values(label, 'active_ingredient').some((value) => normalized(value) === target);
}

function hasRoute(label, route) {
  const target = normalized(route);
  return Boolean(target) && values(label, 'route').some((value) => normalized(value) === target);
}

function isHumanPrescription(label) {
  return values(label, 'product_type').some((value) => normalized(value) === 'human prescription drug');
}

function clinicalFingerprint(label) {
  // These are fields supplied by the label, not a heuristic score. Distinct
  // fingerprints may have materially different dosage or safety evidence.
  const ingredients = values(label, 'active_ingredient').map(normalized).sort().join('|');
  const forms = values(label, 'dosage_form').map(normalized).sort().join('|');
  const routes = values(label, 'route').map(normalized).sort().join('|');
  const productType = values(label, 'product_type').map(normalized).sort().join('|');
  return `${ingredients}::${forms}::${routes}::${productType}`;
}

function labelId(label) {
  return String(label?.set_id ?? label?.id ?? '');
}

function latestLabel(labels) {
  return [...labels].sort((a, b) => {
    const byEffectiveTime = String(b?.effective_time ?? '').localeCompare(String(a?.effective_time ?? ''));
    return byEffectiveTime || labelId(a).localeCompare(labelId(b));
  })[0];
}

async function query(search) {
  const params = [`search=${encodeURIComponent(search)}`, `limit=${MAX_CANDIDATES}`];
  if (process.env.OPENFDA_API_KEY) params.push(`api_key=${encodeURIComponent(process.env.OPENFDA_API_KEY)}`);

  const response = await fetch(`${ENDPOINT}?${params.join('&')}`, { signal: AbortSignal.timeout(8000) });
  // openFDA answers 404 when nothing matches; that is coverage unavailable, not an error.
  if (response.status === 404) return [];
  if (!response.ok) throw new Error(`openFDA request failed: ${response.status}`);
  const data = await response.json();
  return Array.isArray(data?.results) ? data.results : [];
}

function identityFrom(input) {
  if (typeof input === 'string' || Array.isArray(input)) {
    const names = [...new Set([].concat(input).map((name) => String(name || '').trim().replace(/"/g, '')).filter(Boolean))];
    return { ingredientName: names[0] ?? '', inputName: names[1] ?? names[0] ?? '', route: '', dose: '' };
  }
  return {
    ingredientName: String(input?.ingredientName ?? '').trim().replace(/"/g, ''),
    inputName: String(input?.inputName ?? input?.name ?? '').trim().replace(/"/g, ''),
    route: String(input?.route ?? '').trim(),
    dose: String(input?.dose ?? '').trim(),
  };
}

function selectionUnavailable(reason, candidates = []) {
  return {
    status: 'unavailable',
    label: null,
    reason,
    candidates: candidates.map((label) => ({
      setId: labelId(label) || null,
      effectiveTime: label?.effective_time ?? null,
      genericName: values(label, 'generic_name'),
      brandName: values(label, 'brand_name'),
      activeIngredient: values(label, 'active_ingredient'),
      dosageForm: values(label, 'dosage_form'),
      route: values(label, 'route'),
      productType: values(label, 'product_type'),
    })),
  };
}

/**
 * Deterministically select evidence for a known medication identity. This returns
 * coverage metadata; use getDrugLabel() when only the legacy label-or-null shape
 * is needed.
 */
export async function getDrugLabelEvidence(input) {
  const identity = identityFrom(input);
  if (!identity.ingredientName && !identity.inputName) throw new Error('Drug name is required');

  const searchNames = [...new Set([identity.ingredientName, identity.inputName].filter(Boolean))];
  const results = await Promise.all(searchNames.flatMap((name) => [
    query(`openfda.generic_name:"${name}"`),
    query(`openfda.substance_name:"${name}"`),
    query(`active_ingredient:"${name}"`),
    ...(name === identity.inputName ? [query(`openfda.brand_name:"${name}"`)] : []),
  ]));
  const candidates = [...new Map(results.flat().map((label) => [labelId(label) || JSON.stringify(label), label])).values()];
  if (candidates.length === 0) return selectionUnavailable('No openFDA labels were returned for the normalized medication identity.');

  const identityMatches = candidates.filter((label) =>
    matchesName(label, identity.ingredientName, ['generic_name', 'substance_name'])
    || activeIngredientMatches(label, identity.ingredientName)
    || matchesName(label, identity.inputName, ['generic_name', 'brand_name'])
  );
  if (identityMatches.length === 0) {
    return selectionUnavailable('None of the returned openFDA labels exactly matched the normalized medication identity.', candidates);
  }

  // When a route was supplied and labels disclose it, retain only route-matching
  // evidence. If no label discloses the requested route, do not claim a match.
  let matches = identityMatches;
  if (identity.route) {
    const routeMatches = matches.filter((label) => hasRoute(label, identity.route));
    if (routeMatches.length === 0) {
      return selectionUnavailable(`No identity-matched label disclosed the requested route (${identity.route}).`, matches);
    }
    matches = routeMatches;
  }

  // A human prescription label is the deterministic preferred evidence when the
  // same medication identity has both prescription and non-prescription records.
  const prescriptionMatches = matches.filter(isHumanPrescription);
  if (prescriptionMatches.length > 0) matches = prescriptionMatches;

  const fingerprints = new Map();
  for (const label of matches) {
    const fingerprint = clinicalFingerprint(label);
    const group = fingerprints.get(fingerprint) ?? [];
    group.push(label);
    fingerprints.set(fingerprint, group);
  }
  if (fingerprints.size !== 1) {
    return selectionUnavailable('More than one materially distinct openFDA label matched this medication; no label was selected.', matches);
  }

  const selected = latestLabel(matches);
  return {
    status: 'resolved',
    label: selected,
    reason: null,
    selection: {
      method: 'exact_identity_then_clinical_fingerprint',
      setId: labelId(selected) || null,
      effectiveTime: selected?.effective_time ?? null,
      candidateCount: matches.length,
    },
  };
}

/** Legacy label-or-null API. Prefer getDrugLabelEvidence for coverage details. */
export async function getDrugLabel(names) {
  const result = await getDrugLabelEvidence(names);
  return result.label;
}

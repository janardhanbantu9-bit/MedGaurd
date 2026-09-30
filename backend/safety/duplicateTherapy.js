function atcIds(med) {
  return (med.classes ?? [])
    .filter((c) => c.classType?.startsWith('ATC') && c.classId?.length >= 4)
    .map((c) => ({ id: c.classId, name: c.className }));
}

export async function checkDuplicateTherapy({ newMeds, currentMeds }) {
  const findings = [];

  newMeds.forEach((med, i) => {
    const others = [
      ...currentMeds.map((m) => ({ med: m, tag: 'Current' })),
      ...newMeds.slice(i + 1).map((m) => ({ med: m, tag: 'New' })),
    ];

    for (const { med: other, tag } of others) {
      const sameIngredient =
        (med.ingredientRxCui && med.ingredientRxCui === other.ingredientRxCui) ||
        med.ingredientName?.toLowerCase() === other.ingredientName?.toLowerCase();

      if (sameIngredient) {
        findings.push({
          category: 'Duplicate Therapy',
          severity: 'high',
          title: `Duplicate ingredient: ${med.name} and ${other.name}`,
          summary: `${med.name} and ${other.name} contain the same active ingredient (${med.ingredientName}).`,
          affectedMeds: [`${med.name} (New)`, `${other.name} (${tag})`],
          evidenceSource: 'RxNorm ingredient match',
          evidence: [{ source: 'RxNorm', snippet: `Both resolve to ingredient "${med.ingredientName}".` }],
          action: 'Verify whether both prescriptions are intended.',
        });
        continue;
      }

      // Longest shared ATC code (level 3 = 4 chars, level 4 = 5 chars).
      const otherIds = atcIds(other);
      const shared = atcIds(med)
        .flatMap((a) => otherIds.filter((b) => b.id === a.id).map(() => a))
        .sort((a, b) => b.id.length - a.id.length)[0];
      if (!shared) continue;

      findings.push({
        category: 'Duplicate Therapy',
        severity: 'review',
        title: `Overlapping therapy: ${med.name} and ${other.name}`,
        summary: `${med.name} and ${other.name} share the therapeutic class "${shared.name}" (ATC ${shared.id}). This may be intentional combination therapy or unintended duplication.`,
        affectedMeds: [`${med.name} (New)`, `${other.name} (${tag})`],
        evidenceSource: 'RxClass – WHO ATC classification',
        evidence: [{ source: 'RxClass (ATC)', snippet: `Shared class: ${shared.name} (${shared.id})` }],
        action: 'Verify the intent of combining these therapies.',
      });
    }
  });

  return findings;
}

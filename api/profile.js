import { getSupabase } from '../backend/services/supabase.js';
import { requireUser } from './_auth.js';
import { getOwnedPatient, getOwnedPatientContext } from './_patient.js';

function fallbackName(user) {
  const metadataName = String(user.user_metadata?.full_name ?? '').trim();
  if (metadataName) return metadataName.slice(0, 100);

  const emailName = String(user.email ?? '').split('@')[0].trim();
  return (emailName || 'MediGuard user').slice(0, 100);
}

function asString(value) {
  return String(value ?? '').trim();
}

function asStringArray(value) {
  if (!Array.isArray(value)) return null;
  return value
    .map((item) => {
      if (typeof item === 'string') return item.trim();
      if (item && typeof item === 'object') {
        const name = item.name ?? item.allergen ?? item.diagnosis ?? item.condition ?? '';
        return String(name ?? '').trim();
      }
      return '';
    })
    .filter(Boolean);
}

function parsePositiveNumber(value) {
  if (value === '' || value === null || value === undefined) return null;
  const num = typeof value === 'number' ? value : Number(String(value).trim());
  if (!Number.isFinite(num) || num <= 0) return null;
  return num;
}

function validateOnboarding(body) {
  const errors = [];

  const rawAge = body?.age;
  const age = typeof rawAge === 'number' ? rawAge : Number(String(rawAge ?? '').trim());
  if (!Number.isInteger(age) || age < 1 || age > 130) {
    errors.push('Age must be a whole number between 1 and 130.');
  }

  const weight = parsePositiveNumber(body?.weight ?? body?.weight_kg);
  if (weight === null || weight > 1000) errors.push('Weight must be a positive number in kg.');

  const height = parsePositiveNumber(body?.height ?? body?.height_cm);
  if (height === null || height > 300) errors.push('Height must be a positive number in cm.');

  const medications = Array.isArray(body?.medications) ? body.medications : null;
  const currentConditions = asStringArray(body?.currentConditions ?? body?.current_conditions);
  const previousConditions = asStringArray(body?.previousConditions ?? body?.previous_conditions);
  const allergies = Array.isArray(body?.allergies) ? body.allergies : null;

  if (medications === null) errors.push('medications must be an array.');
  if (currentConditions === null) errors.push('currentConditions must be an array.');
  if (previousConditions === null) errors.push('previousConditions must be an array.');
  if (allergies === null) errors.push('allergies must be an array.');

  const cleanMeds = [];
  if (medications !== null) {
    for (const item of medications) {
      const obj = typeof item === 'string' ? { name: item } : item;
      const name = asString(obj?.name);
      if (!name) continue;
      if (name.length > 200) {
        errors.push('Medication names must be 200 characters or fewer.');
        break;
      }
      cleanMeds.push({
        name,
        dose: asString(obj?.dose).slice(0, 100) || null,
        frequency: asString(obj?.frequency ?? obj?.freq).slice(0, 100) || null,
        route: asString(obj?.route).slice(0, 100) || null,
      });
    }
  }

  const cleanAllergies = [];
  if (allergies !== null) {
    for (const item of allergies) {
      const obj = typeof item === 'string' ? { name: item } : item;
      const name = asString(obj?.name ?? obj?.allergen);
      if (!name) continue;
      if (name.length > 200) {
        errors.push('Allergy names must be 200 characters or fewer.');
        break;
      }
      cleanAllergies.push({
        name,
        severity: asString(obj?.severity).slice(0, 50) || null,
        reaction: asString(obj?.reaction).slice(0, 200) || null,
      });
    }
  }

  const tooLong = (list) => (list || []).some((name) => name.length > 200);
  if (currentConditions !== null && tooLong(currentConditions)) {
    errors.push('Condition names must be 200 characters or fewer.');
  }
  if (previousConditions !== null && tooLong(previousConditions)) {
    errors.push('Condition names must be 200 characters or fewer.');
  }

  if (errors.length > 0) return { errors };

  return {
    age,
    weight_kg: weight,
    height_cm: height,
    medications: cleanMeds,
    currentConditions: (currentConditions || []).slice(0, 100),
    previousConditions: (previousConditions || []).slice(0, 100),
    allergies: cleanAllergies.slice(0, 100),
  };
}

async function handleGet(user, res) {
  try {
    const profile = await getOwnedPatientContext(user.id);
    if (!profile) {
      return res.status(404).json({ profile: null, error: 'No health profile found for this account.' });
    }
    return res.status(200).json({ profile });
  } catch (error) {
    console.error('MediGuard profile fetch error:', error);
    return res.status(500).json({ error: error?.message || 'Could not load your profile' });
  }
}

async function handlePost(user, req, res) {
  const validated = validateOnboarding(req.body || {});
  if (validated.errors) {
    return res.status(400).json({ error: validated.errors.join(' ') });
  }

  try {
    const supabaseAdmin = getSupabase();

    // Idempotency: a completed profile is the source of truth. A repeated
    // Finish Up returns the existing profile without duplicating rows.
    const existing = await getOwnedPatient(user.id);
    if (existing && existing.onboarding_completed) {
      const profile = await getOwnedPatientContext(user.id);
      return res.status(200).json({ profile, created: false, duplicate: true });
    }

    let patientId = existing?.id ?? null;

    if (!patientId) {
      const name = fallbackName(user);
      const { data, error } = await supabaseAdmin
        .from('patients')
        .insert({
          user_id: user.id,
          mrn: `USER-${user.id}`,
          name,
          age: validated.age,
          weight_kg: validated.weight_kg,
          height_cm: validated.height_cm,
          onboarding_completed: true,
          updated_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (error) {
        if (error.code === '23505') {
          const winner = await getOwnedPatient(user.id);
          if (winner) {
            const profile = await getOwnedPatientContext(user.id);
            return res.status(200).json({ profile, created: false, duplicate: true });
          }
        }
        throw error;
      }
      patientId = data.id;
    } else {
      const { error } = await supabaseAdmin
        .from('patients')
        .update({
          age: validated.age,
          weight_kg: validated.weight_kg,
          height_cm: validated.height_cm,
          onboarding_completed: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', patientId)
        .eq('user_id', user.id);
      if (error) throw error;

      const cleared = await Promise.all([
        supabaseAdmin.from('medications').delete().eq('patient_id', patientId),
        supabaseAdmin.from('diagnoses').delete().eq('patient_id', patientId),
        supabaseAdmin.from('allergies').delete().eq('patient_id', patientId),
      ]);
      for (const r of cleared) if (r.error) throw r.error;
    }

    if (validated.medications.length > 0) {
      const { error } = await supabaseAdmin.from('medications').insert(
        validated.medications.map((m) => ({
          patient_id: patientId,
          name: m.name,
          dose: m.dose ?? null,
          frequency: m.frequency ?? null,
          route: m.route ?? null,
          status: 'Active',
        }))
      );
      if (error) throw error;
    }

    // Previous conditions reuse the existing diagnoses status structure with a
    // non-Active status, so the safety pipeline (Active-only) treats them as
    // history instead of current context.
    const diagnoses = [
      ...validated.currentConditions.map((name) => ({
        patient_id: patientId,
        diagnosis: name,
        status: 'Active',
      })),
      ...validated.previousConditions.map((name) => ({
        patient_id: patientId,
        diagnosis: name,
        status: 'Resolved',
      })),
    ];
    if (diagnoses.length > 0) {
      const { error } = await supabaseAdmin.from('diagnoses').insert(diagnoses);
      if (error) throw error;
    }

    if (validated.allergies.length > 0) {
      const { error } = await supabaseAdmin.from('allergies').insert(
        validated.allergies.map((a) => ({
          patient_id: patientId,
          allergen: a.name,
          severity: a.severity ?? null,
          reaction: a.reaction ?? null,
        }))
      );
      if (error) throw error;
    }

    const profile = await getOwnedPatientContext(user.id);
    return res.status(existing ? 200 : 201).json({ profile, created: !existing });
  } catch (error) {
    console.error('MediGuard profile save error:', error);
    return res.status(500).json({ error: error?.message || 'Could not save your profile' });
  }
}

export default async function handler(req, res) {
  const user = await requireUser(req, res);
  if (!user) return;

  if (req.method === 'GET') return handleGet(user, res);
  if (req.method === 'POST') return handlePost(user, req, res);
  return res.status(405).json({ error: 'Method not allowed' });
}

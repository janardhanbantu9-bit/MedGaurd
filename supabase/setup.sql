create extension if not exists pgcrypto;

create table if not exists public.patients (
  id uuid primary key default gen_random_uuid(),
  mrn text not null unique,
  name text not null,
  age integer,
  sex text,
  weight_kg numeric,
  height_cm numeric,
  clinical_notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.allergies (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  allergen text not null,
  severity text,
  reaction text,
  created_at timestamptz not null default now()
);

create table if not exists public.diagnoses (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  diagnosis text not null,
  status text not null default 'Active',
  diagnosed_on date,
  created_at timestamptz not null default now()
);

create table if not exists public.medications (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  name text not null,
  rx_cui text,
  dose text,
  frequency text,
  route text,
  status text not null default 'Active',
  started_on date,
  created_at timestamptz not null default now()
);

create table if not exists public.analyses (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  prescription_text text not null,
  status text not null,
  extracted_medications jsonb not null default '[]'::jsonb,
  findings jsonb not null default '[]'::jsonb,
  summary jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists allergies_patient_id_idx on public.allergies(patient_id);
create index if not exists diagnoses_patient_id_idx on public.diagnoses(patient_id);
create index if not exists medications_patient_id_idx on public.medications(patient_id);
create index if not exists analyses_patient_id_idx on public.analyses(patient_id);

alter table public.patients enable row level security;
alter table public.allergies enable row level security;
alter table public.diagnoses enable row level security;
alter table public.medications enable row level security;
alter table public.analyses enable row level security;

grant usage on schema public to service_role;
grant all on public.patients, public.allergies, public.diagnoses, public.medications, public.analyses to service_role;

-- No anon/authenticated policies yet.
-- The prototype reads and writes through the Vercel backend using the Supabase secret key.
-- Add authenticated-user policies after Supabase Auth is introduced.

do $$
declare
  p_id uuid;
begin
  insert into public.patients (mrn, name, age, sex, weight_kg, height_cm, clinical_notes)
  values ('DEMO-001', 'Eleanor Vance', 68, 'Female', 64, 165, 'Demo patient for hackathon prototype only.')
  on conflict (mrn) do update set
    name = excluded.name,
    age = excluded.age,
    sex = excluded.sex,
    weight_kg = excluded.weight_kg,
    height_cm = excluded.height_cm,
    clinical_notes = excluded.clinical_notes
  returning id into p_id;

  delete from public.allergies where patient_id = p_id;
  delete from public.diagnoses where patient_id = p_id;
  delete from public.medications where patient_id = p_id;

  insert into public.allergies (patient_id, allergen, severity, reaction) values
    (p_id, 'Penicillin', 'Severe', 'Anaphylaxis'),
    (p_id, 'Sulfa Drugs', 'Moderate', 'Rash');

  insert into public.diagnoses (patient_id, diagnosis, status, diagnosed_on) values
    (p_id, 'Type 2 Diabetes Mellitus', 'Active', '2015-04-12'),
    (p_id, 'Atrial Fibrillation', 'Active', '2018-09-03'),
    (p_id, 'Hypertension', 'Active', '2010-11-20'),
    (p_id, 'Osteoarthritis', 'Active', '2020-01-15');

  insert into public.medications (patient_id, name, dose, frequency, route, status, started_on) values
    (p_id, 'Metformin', '500 mg', 'BID', 'Oral', 'Active', '2015-05-01'),
    (p_id, 'Warfarin', '5 mg', 'Daily', 'Oral', 'Active', '2018-09-10'),
    (p_id, 'Lisinopril', '10 mg', 'Daily', 'Oral', 'Active', '2010-11-25'),
    (p_id, 'Atorvastatin', '20 mg', 'Daily at bedtime', 'Oral', 'Active', '2019-02-14');
end $$;

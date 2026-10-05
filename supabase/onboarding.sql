-- MediGuard onboarding integration.
-- Adds first-time health-profile completion tracking and guarantees
-- at most one patient profile per authenticated user.
-- Safe to run multiple times against the existing prototype schema.

alter table public.patients
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

alter table public.patients
  add column if not exists onboarding_completed boolean not null default false;

alter table public.patients
  add column if not exists updated_at timestamptz not null default now();

-- One profile per authenticated user (NULL user_ids, e.g. DEMO-001, are unaffected).
create unique index if not exists patients_user_id_uidx
  on public.patients(user_id)
  where user_id is not null;

create index if not exists patients_updated_at_idx on public.patients(updated_at);

alter table public.patients enable row level security;
alter table public.allergies enable row level security;
alter table public.diagnoses enable row level security;
alter table public.medications enable row level security;
alter table public.analyses enable row level security;

grant select, insert, update on public.patients to authenticated;
grant select on public.allergies, public.diagnoses, public.medications, public.analyses to authenticated;

drop policy if exists patients_select_own on public.patients;
create policy patients_select_own
on public.patients
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists patients_insert_own on public.patients;
create policy patients_insert_own
on public.patients
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists patients_update_own on public.patients;
create policy patients_update_own
on public.patients
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists allergies_select_own on public.allergies;
create policy allergies_select_own
on public.allergies
for select
to authenticated
using (
  exists (
    select 1 from public.patients p
    where p.id = allergies.patient_id
      and p.user_id = auth.uid()
  )
);

drop policy if exists diagnoses_select_own on public.diagnoses;
create policy diagnoses_select_own
on public.diagnoses
for select
to authenticated
using (
  exists (
    select 1 from public.patients p
    where p.id = diagnoses.patient_id
      and p.user_id = auth.uid()
  )
);

drop policy if exists medications_select_own on public.medications;
create policy medications_select_own
on public.medications
for select
to authenticated
using (
  exists (
    select 1 from public.patients p
    where p.id = medications.patient_id
      and p.user_id = auth.uid()
  )
);

drop policy if exists analyses_select_own on public.analyses;
create policy analyses_select_own
on public.analyses
for select
to authenticated
using (
  exists (
    select 1 from public.patients p
    where p.id = analyses.patient_id
      and p.user_id = auth.uid()
  )
);

-- Existing DEMO-001 stays unowned (user_id = NULL), so it can never leak
-- into an authenticated user's profile. Never assign it to a real user.

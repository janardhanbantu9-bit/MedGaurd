# MediGuard scaffold

This scaffold restructures the supplied single-file React/TSX prototype into a frontend plus backend/API layout.

## What was moved

- `frontend/src/data/mockData.ts` contains the demo patient, extracted medication and finding data.
- `frontend/src/components/` contains reusable UI/layout components.
- `frontend/src/screens/` contains the dashboard, prescription flow, analysis flow and finding detail UI.
- `frontend/src/services/` contains frontend API adapters.
- `backend/` contains service, safety-rule, pipeline and utility placeholders.
- `api/` contains serverless endpoint placeholders.
- `shared/types.ts` contains initial cross-layer data shapes.

## Backend implementation order

1. `backend/services/groq.js`
2. `backend/services/rxnorm.js`
3. `backend/services/rxclass.js`
4. `backend/services/openfda.js` / `dailymed.js`
5. `backend/safety/*`
6. `backend/pipeline/analyzePrescription.js`
7. `api/analyze.js`
8. Connect `frontend/src/services/api.ts`
9. Add Supabase persistence after the analysis pipeline works end-to-end.

## Important

The current UI uses demo medical content. The hard-coded finding explanations are scaffolding only and should be replaced by evidence-backed backend results before a real clinical claim is made.

# RAWI

RAWI is a human-guided marketing campaign MVP for small businesses. It turns a business name, a product and a **required brand identity file** into one suggested creative direction and three scenarios, with recorded review gates before production and scheduling.

## Current workflow

1. **Onboarding:** business name, product and a PDF/PNG/JPEG/UTF-8 text identity file (maximum 5 MB).
2. **Initial screening:** internal RAWI rules and, when configured, Gemini risk classification. A human must record rights, consent, claims and applicable-permission evidence. Rejected briefs cannot proceed.
3. **Ideas:** Gemini reads the identity file and suggests **one creative direction and exactly three scenarios**. These are not verified live trends. There is no X/Twitter connection or scraping.
4. **Scenario screening and coordinator review:** inspect each report, record owner feedback, revise and re-screen, then approve one scenario. A rejected scenario cannot be approved.
5. **Production:** generate the approved scenario's script, caption and visual brief. **No AI image or video generation is connected.** The production team supplies final media via an HTTPS link.
6. **Final audit:** automated text triage plus a required human inspection of actual media, product fidelity, rights, claims, disclosures and permissions. The system does not fetch or analyze the linked video.
7. **Owner approval:** record approval of the audited version. Changing the draft or media link invalidates its audit, owner approval and schedule.
8. **Scheduling:** open a prefilled Google Calendar event and manually confirm it was saved. This does not publish content or import performance metrics.

Click **Start creating** to create or resume a workflow. The Campaigns page retains the old example campaigns; their old approval shortcuts are disabled.

## Run locally (PowerShell)

Use Node.js and an installed Python 3.10+ interpreter. Run these in two terminals from the repository root:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m uvicorn main:app --host 127.0.0.1 --port 8000
```

```powershell
cd frontend
npm.cmd install
npm.cmd run dev
```

Open http://localhost:5173. Keep both terminals running. If an old `.venv` points to a deleted interpreter, recreate it using your installed Python.

## Enable the LLM agents

Copy `backend/.env.example` to `backend/.env`, set `GEMINI_API_KEY`, and restart FastAPI. Never commit the actual key. `GEMINI_MODEL` optionally overrides the default `gemini-2.5-flash`.

Without a key, the interface explicitly shows **Demo**. Demo mode uses deterministic templates and limited text rules; it does not visually interpret the uploaded identity. With a key, identity files are sent to Google Gemini for screening, ideas, revision and production. Provider availability, quota and model access must be checked with your own key. Failed calls retain the previous workflow stage rather than granting approval.

## Persistence and access

Workflows, identity files, audit evidence and revision history are stored in `backend/.data/workflow.sqlite3`, excluded from Git. `RAWI_DB_PATH` can select another persistent SQLite path. Each workflow has an opaque access token; only its hash is stored on the backend. The browser stores the access token locally to resume it. Clearing browser storage loses that access. Do not put confidential production material into this prototype.

This is a **single-process local MVP**. Coordinator/owner actions are declarations by the person operating the browser, not authenticated or independently verified roles. Before multi-user deployment, add authentication, role permissions, durable hosted storage, retention/deletion controls, file scanning, rate limiting and transactional concurrency across workers. Media links can change externally: review a versioned, immutable media asset in a production system.

The workflow deliberately returns a storage-configuration error on Vercel when no `RAWI_DB_PATH` is configured. Vercel's temporary filesystem is not durable storage; do not point this database at `/tmp` and claim persistence. A hosted database/storage adapter is needed before publishing this new workflow there. Existing Vercel frontend build settings remain in place.

## Policy limits

`rawi-internal-2026-11-17` is an **internal product policy**, not legal clearance or a claim that every rule is statutory. Automated checks are fallible and cannot establish copyright ownership, consent or compliance. No claim is made that the regulatory statements in the design reference have been legally verified. A reviewer records supporting document references and applicable requirements; checkboxes alone do not establish rights.

Demo rejection checks include unsupported cure claims, fake testimonials and explicitly unauthorized use. LLM mode adds risk triage. Final media is always a human review. AI disclosure does not make prohibited content acceptable.

## Code map

- `backend/main.py`: FastAPI setup, health endpoint and retired legacy endpoints.
- `backend/workflow.py`: prompts, schemas, screening rules, SQLite persistence and gated transitions.
- `backend/test_workflow.py`: workflow and bypass regression tests.
- `frontend/src/Creator.jsx`: onboarding, scenarios, review, production and audit workspace.
- `frontend/src/CinematicHome.jsx`: cinematic landing page.

## Validation

```powershell
cd backend
.\.venv\Scripts\python.exe -m unittest test_workflow -v
```

```powershell
cd frontend
npm.cmd run build
```

Tests cover successful progression, rejection, missing evidence/media, invalid uploads, stale revisions, cross-session access and legacy endpoint bypass prevention. Live Gemini generation requires a configured key and is separate from demo/mocked validation.

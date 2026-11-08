# RAWI

**Every campaign. A story worth telling.**

RAWI is an AI-assisted marketing campaign platform built for the Tanmiyathon hackathon. It helps small businesses turn a product idea into a structured campaign they can review, approve, and plan for launch.

Instead of starting with a blank page, a business owner provides a brief and receives a campaign concept, a short-form storyboard, social copy, and a posting plan in one workspace.

## From idea to campaign

1. **Write a brief.** Enter your brand, product, audience, platform, campaign goal, and any extra context.
2. **Choose a creative direction.** Select a sample trend such as Nostalgia, POV, or Unboxing.
3. **Generate a campaign.** RAWI produces a concept, scene-by-scene script with visual and voiceover directions, caption, hashtags, and posting plan.
4. **Review and save.** Inspect the proposal and save it to your campaign library.
5. **Approve and schedule.** Approve the campaign, choose a future launch time, and open a prefilled Google Calendar event. Save the event in Google Calendar, then confirm it in RAWI.

For example, a coffee shop can describe a new iced latte, choose TikTok and a nostalgia theme, and receive a short video concept and supporting social copy. The business still creates the actual media and publishes the campaign.

## What is included in the MVP?

| Area | Current functionality |
| --- | --- |
| Landing page | Responsive cinematic video, scroll animations, and reduced-motion support |
| Dashboard | Three labeled sample campaigns to explore the workflow |
| Campaign creation | Brief form and structured campaign generation |
| Campaign library | Saved campaigns, campaign details, approval, and status management |
| Media previews | Empty photo/video placeholders for planned content |
| AI backend | FastAPI with Gemini integration and a template-based demo mode |
| Trends | Curated samples; no scraping or live popularity claims |
| Scheduling | Prefilled Google Calendar event links with manual save confirmation |

### AI and demo modes

With `GEMINI_API_KEY` configured, the backend sends the brief to **Gemini 2.5 Flash** and validates the returned campaign structure. Without a key, it returns a deterministic demo campaign so the workflow can be explored without an AI account.

The current implementation uses **one generation prompt**, not separate autonomous agents. The prompt is inside `generate()` in [`backend/main.py`](backend/main.py).

### Current boundaries

- Campaigns and statuses are stored in **browser localStorage**. They are not shared across browsers or devices, and clearing site data removes them.
- There are no user accounts or shared database yet.
- RAWI generates text and creative directions, not images or videos.
- Calendar scheduling opens an event draft; RAWI does not verify the saved event through the Google Calendar API.
- Publishing to social platforms and performance analytics are not implemented.

## Technology

- **Frontend:** React, Vite, Tailwind CSS, custom CSS, and Lucide icons
- **Backend:** Python, FastAPI, Pydantic, and Uvicorn
- **AI:** Google Gen AI SDK
- **MVP storage:** Browser localStorage

```text
rawi/
  frontend/
    src/App.jsx             Campaign forms, dashboard, and workflow
    src/CinematicHome.jsx   Landing page and video behavior
    src/index.css           Shared styling and animations
    public/media/           Hero video variants and poster
  backend/
    main.py                 API routes, generation prompt, and demo generator
    requirements.txt        Python dependencies
    .env.example            Environment variable template
```

## Run locally

Install Node.js with npm and Python 3.10 or newer. Run the following commands from the repository root using two terminals. These instructions use PowerShell.

### 1. Start the backend

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m uvicorn main:app --reload --port 8000
```

The backend runs at http://127.0.0.1:8000. Interactive API documentation is available at http://127.0.0.1:8000/docs.

### 2. Start the frontend

Open a second terminal at the repository root:

```powershell
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173**. Keep both terminals running. Vite forwards `/api` requests to the backend on port 8000.

### 3. Enable Gemini (optional)

In the `backend` directory, copy the template if you do not already have a `.env` file:

```powershell
Copy-Item .env.example .env
```

Set your key in `backend/.env`, then restart the backend:

```dotenv
GEMINI_API_KEY=your_key_here
```

The `.env` file is excluded from Git. Keep the real key in the backend environment, never in frontend code.

## Quick demo and checks

1. Visit the dashboard and open a sample campaign.
2. Create a campaign using your own brand and product brief.
3. Check the concept, storyboard, caption, and posting plan, then save it.
4. Refresh the page and confirm the saved campaign remains in the library.
5. Approve it, choose a future launch time, save the Google Calendar draft, and confirm the save in RAWI.

Check the API from PowerShell:

```powershell
Invoke-RestMethod http://127.0.0.1:8000/api/health
Invoke-RestMethod http://127.0.0.1:8000/api/trends
```

The health response reports `demo` or `gemini` based on whether a key is configured. It does not validate the key; generate a campaign to test a live Gemini request.

To check the frontend production build, run inside `frontend`:

```powershell
npm run build
```

### Troubleshooting

- **Site cannot be reached:** Start the frontend and open the URL printed by Vite. Keep its terminal running.
- **Generation fails:** Check that the backend is running on port 8000. In Gemini mode, also check the API key and provider access.
- **`node` or `npm` is not recognized:** Install Node.js, then fully restart VS Code so its terminal receives the updated PATH.
- **Port 5173 is busy:** Stop the existing frontend process before restarting; Vite is configured to keep this port.

## Next milestones

Planned extensions include dedicated strategy, copywriting, and review agents; user accounts and database storage; direct Google Calendar integration; and media production and publishing integrations. These are future work, not current MVP features.

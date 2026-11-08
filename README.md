# RAWI — رَوِيّ

A hackathon MVP for generating, reviewing, and scheduling small-business marketing campaigns.

## Features
- Cinematic responsive landing page
- Dashboard with 3 clearly labeled sample campaigns
- Empty photo/video placeholders (no fake media)
- Campaign detail pages with concepts, storyboards, captions, posting plans
- Approval status workflow and localStorage persistence
- Campaign generation through FastAPI + Gemini (optional key) or transparent demo mode
- Google Calendar prefilled event links (user confirms the event; no OAuth required)

## Requirements
- Node.js 18+ (Node 20+ recommended)
- Python 3.10+

## Start the backend (PowerShell)
```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
To enable real Gemini generation, copy `.env.example` to `.env` and set `GEMINI_API_KEY`. Without it, generation uses a clearly marked deterministic demo response.

## Start the frontend (second terminal)
```powershell
cd frontend
npm install
npm run dev
```
Open http://localhost:5173.

## Demo walkthrough
1. Open Dashboard and inspect the 3 sample campaigns.
2. Open The Perfect Gift and click Approve.
3. Choose a future launch time, open Google Calendar, save the prefilled event, and click Confirm event saved in RAWI.
4. Open Create Campaign, fill in a product, choose a sample trend, and generate a campaign.
5. Save the campaign and see it in the Campaigns library.

## Notes
- The campaign library uses browser localStorage for the MVP, not Supabase. Data is per-browser, not shared between devices.
- The sample trends are curated and do not represent live platform analytics.
- The calendar link opens an event draft, not a direct calendar API write.
- No video generation or social posting is implemented.
- For production, add user authentication, a real database, OAuth calendar sync, secure hosting, and tests.


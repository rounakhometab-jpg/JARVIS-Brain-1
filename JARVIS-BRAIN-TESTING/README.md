# J.A.R.V.I.S. INFO1 — Enhanced Python-free AI command center

A multi-page, Iron Man-inspired personal assistant starter built with HTML, CSS, browser JavaScript, Node.js, Express, and the OpenAI Responses API. No Python is used by the application.

## Included pages
- **Dashboard** — server/API status and module navigation
- **AI Assistant** — 30 selectable AI modes, multi-turn chat, voice input where browser-supported, spoken replies, quick prompts, and text/code document attachment
- **Camera Center** — permission-based camera start, front/back flip, and stop
- **Settings** — response language, speech output, and reduced-motion preferences

## 30 AI capabilities wired into the assistant
Conversational brain; natural-language and intent understanding; context-aware multi-turn conversation; reasoning and complex problem solving; step-by-step planning; task decomposition; command classification; follow-up understanding and ambiguity clarification; JARVIS persona; Hindi/English/Hinglish; translation; grammar correction; summarization; text-document analysis; math; coding; code explanation; error diagnosis; idea generation; creative writing; research assistance; fact-checking mode; and structured responses.

These are implemented as AI instructions/modes sent through the Responses API. The quality and availability depend on the selected model and your API account. The assistant does not have unrestricted device control or guaranteed factual correctness.

## 1. API key setup
1. Open `.env` in the project root.
2. Replace `PASTE_YOUR_OPENAI_API_KEY_HERE` with your own **new/valid** API key.
3. Keep `.env` private. Never put an API key in `public/` JavaScript or upload `.env` to GitHub.
4. The ZIP's `.env` intentionally contains a placeholder only.

**Security:** if a real API key was ever pasted into a chat, ZIP, screenshot, or public repository, revoke it in the OpenAI platform and create a replacement.

## 2. Run locally
Use Node.js 20 or newer:
```bash
npm install
npm start
```
Then open `http://localhost:3000`.

SPCK Editor is suitable for editing the frontend. The backend is easiest to run on Render or another Node.js host.

## 3. Deploy frontend and backend together on Render
This project serves the frontend and API from one Express service.
1. Push project files to GitHub but exclude `.env`.
2. Create a Render **Web Service** connected to the repository.
3. Build command: `npm install`
4. Start command: `npm start`
5. In Render → Environment, add `OPENAI_API_KEY` and `OPENAI_MODEL` (use a model available to your API project).
6. Optional: add `ENABLE_WEB_SEARCH=true` only if the selected model/API project supports the Responses API `web_search_preview` tool. Otherwise leave it `false`.
7. Deploy and open the Render service URL.

## 4. Buttons and browser permissions
- Feature cards change the assistant mode; quick prompts load text into the composer; Send submits; Enter sends and Shift+Enter adds a line; Clear resets the conversation; microphone uses browser speech recognition; document attachment reads text-based files; Settings saves to browser local storage.
- Camera needs HTTPS or localhost and explicit permission. Flip requests the other camera; some devices/browsers may not support both cameras.
- Speech recognition varies by browser. If unsupported, the mic button is disabled.
- Document attachment supports text-based formats only (TXT, MD, CSV, JSON, HTML, JS, CSS, XML, logs), max 200 KB. PDFs and image OCR are not implemented in this starter.
- Research/fact-check modes use live web search only when `ENABLE_WEB_SEARCH=true` and your API setup supports it. With it off, the model must be transparent about limits.

## 5. Troubleshooting
- **API setup required**: set `OPENAI_API_KEY` in Render Environment Variables, then redeploy/restart.
- **401**: key invalid/revoked or wrong API project.
- **429**: API quota/billing/rate limit.
- **Model error**: set `OPENAI_MODEL` to a model available to your project.
- **Camera blocked**: use HTTPS and allow camera permission in browser settings.
- **Do not expose secrets**: `.gitignore` excludes `.env`.


## Frontend/backend file connections

- `public/index.html` -> `/css/style.css` + `/js/app.js` -> `GET /api/health`
- `public/assistant.html` -> `/css/style.css` + `/js/assistant.js` -> `POST /api/chat`
- `public/settings.html` -> `/css/style.css` + `/js/settings.js` -> saves browser preferences in `localStorage`
- `public/camera.html` -> `/css/style.css` + `/js/camera.js` -> browser camera permission/API
- `server.js` serves `public/`, maps `/`, `/assistant`, `/settings`, `/camera`, and exposes `/api/health` and `/api/chat`.
- All pages share the same navigation links: Dashboard `/`, AI Assistant `/assistant`, Camera Center `/camera`, Settings `/settings`.
- `OPENAI_API_KEY` stays in the server-side `.env` (local) or Render Environment Variables (deployment); never place it in frontend JavaScript.


The assistant screen includes 30 individually selectable modules, searchable by name. Each button sends its selected mode to the backend, where a matching instruction guides the OpenAI Responses API. This is a prompt-based mode system, not 30 separate models or autonomous device permissions.

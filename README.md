# Internet Guardian AI

An AI-powered website analysis tool built with Cloudflare Workers AI.

Analyse any website to get insights on:
-  Security
-  Performance
-  SEO

---

##  Live Demo

https://cf-ai-internet-guardian.pages.dev

---

##  Features

- Analyse any website URL
- AI-generated insights using Llama 3 (Workers AI)
- Structured JSON output for reliability
- Risk scoring system (1–10)
- Clean UI with real-time results
- Recent scan history (persistent via localStorage)
- Deployed globally with Cloudflare Pages

---

##  How It Works

1. User enters a website URL in the frontend
2. Request is sent to a Cloudflare Worker
3. Worker:
   - fetches the website HTML
   - extracts key signals (title, meta, H1s)
   - sends structured prompt to Workers AI
4. AI returns strict JSON analysis
5. Frontend displays results in a clean dashboard

---

## 🧱 Tech Stack

### Frontend
- React (Vite)
- CSS

### Backend
- Cloudflare Workers
- Workers AI (Llama 3)

### Deployment
- Cloudflare Pages

---

##  Architecture

Frontend (React)
→ Cloudflare Worker (API + orchestration)
→ Workers AI (LLM analysis)
→ JSON response → UI rendering

---

##  Prompt Engineering

The system uses a carefully engineered prompt to behave as a **deterministic AI-powered API**, not a conversational model.

Key features:
- Strict JSON-only output
- Grounded analysis (no hallucinations)
- Defensive rules for consistency
- Reliable parsing in frontend

See `PROMPTS.md` for full details.

---

##  Memory / State

The app includes persistent state via:
- Recent scan history stored in `localStorage`

This allows:
- state across page refreshes
- quick re-analysis of previous URLs

---

##  Example Output

```json
{
  "url": "https://example.com",
  "riskScore": 4,
  "security": ["No major vulnerabilities detected"],
  "performance": ["Minimal JavaScript usage"],
  "seo": ["Missing meta description"],
  "summary": "Well-structured site with minor SEO improvements needed."
}

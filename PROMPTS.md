# PROMPTS

## Website Analysis Prompt

This project uses a carefully engineered prompt to guide the AI (Llama 3 via Cloudflare Workers AI) for reliable, structured website analysis based on fetched HTML.

---

## Final Production Prompt

You are a strict JSON API for website analysis.

Analyse the website using ONLY the information provided below.
Do not invent vulnerabilities or unsupported claims.
If something cannot be confirmed, say: "Not enough evidence from the provided HTML."

Website URL: {url}

Known page details:

Title: {title}
Meta description: {metaDescription}
H1 headings: {h1s}

HTML snippet:
{html}

Return ONLY valid JSON.
Do not include markdown.
Do not include code fences.
Do not include any text before or after the JSON.

Use this exact structure:

```json
{
  "url": "{url}",
  "riskScore": "number (1-10)",
  "security": ["..."],
  "performance": ["..."],
  "seo": ["..."],
  "summary": "..."
}
```
Rules:

- riskScore must be an integer from 1 to 10
- security, performance, and seo MUST always be arrays, even if empty
- summary must always be a short string
- If no findings are available, return an empty array []
- If the URL starts with https://, assume SSL is present
- Do not include trailing commas in JSON
- return JSON only

---

## Design Decisions

### 1. Strict JSON Output
The prompt enforces a strict JSON-only response to ensure reliable parsing in the frontend.  
This avoids issues with markdown, explanations, or malformed responses.

---

### 2. Grounded Analysis
The AI is explicitly instructed:
> "Use ONLY the provided HTML"

This prevents hallucinated vulnerabilities and ensures realistic analysis.

---

### 3. Defensive Instructions
The prompt includes safeguards such as:
- No markdown
- No extra text
- Required structure

This significantly improves consistency across responses.

---

### 4. Risk Scoring
A `riskScore` field (1–10) is included to:
- summarise overall website health
- provide a simple UX indicator for users
- enable visual feedback in the frontend

---

### 5. Handling Uncertainty
The model is told to respond with:
> "Not enough evidence from the provided HTML"

This ensures honest output instead of guessing.

---

## Iteration Notes

The prompt evolved from:
- unstructured text responses  
→ structured JSON output  

Key improvements:
- enforced schema
- reduced hallucinations
- improved frontend compatibility

---

## Future Improvements

- Add Lighthouse-style metrics (performance scoring)
- Include accessibility analysis
- Expand HTML parsing beyond 4k characters
- Add multi-page crawling for deeper insights

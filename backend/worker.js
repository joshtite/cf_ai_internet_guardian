export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const target = url.searchParams.get("url") || "";

    if (!target.trim()) {
      return jsonResponse(
        { error: "Please provide a URL like ?url=example.com" },
        400
      );
    }

    let cleanedUrl = target.trim();
    if (
      !cleanedUrl.startsWith("http://") &&
      !cleanedUrl.startsWith("https://")
    ) {
      cleanedUrl = `https://${cleanedUrl}`;
    }

    try {
      const siteResponse = await fetch(cleanedUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; CloudflareInternProject/1.0)"
        }
      });

      if (!siteResponse.ok) {
        return jsonResponse(
          {
            error: "Could not fetch the target website",
            status: siteResponse.status,
            statusText: siteResponse.statusText
          },
          400
        );
      }

      const html = await siteResponse.text();

      const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
      const metaDescriptionMatch = html.match(
        /<meta[^>]+name=["']description["'][^>]+content=["'](.*?)["']/i
      );
      const h1Matches = [...html.matchAll(/<h1[^>]*>(.*?)<\/h1>/gi)].map(
        (match) => stripHtml(match[1]).trim()
      );

      const trimmedHtml = html.replace(/\s+/g, " ").slice(0, 2500);

      const prompt = `
You are a strict JSON API for website analysis.

Analyse the website using ONLY the information provided below.
Do not invent vulnerabilities or unsupported claims.
If something cannot be confirmed, say: "Not enough evidence from the provided HTML."

Website URL: ${cleanedUrl}

Known page details:
- Title: ${titleMatch ? stripHtml(titleMatch[1]) : "Not found"}
- Meta description: ${metaDescriptionMatch ? metaDescriptionMatch[1] : "Not found"}
- H1 headings: ${h1Matches.length ? h1Matches.join(" | ") : "None found"}

HTML snippet:
${trimmedHtml}

Return ONLY valid JSON.
Do not include markdown.
Do not include code fences.
Do not include any text before or after the JSON.

Use this exact structure:
{
  "url": "${cleanedUrl}",
  "riskScore": 1,
  "security": ["item 1", "item 2"],
  "performance": ["item 1", "item 2"],
  "seo": ["item 1", "item 2"],
  "summary": "short overall summary"
}

Rules:
- riskScore must be an integer from 1 to 10
- security, performance, and seo must always be arrays
- summary must always be a short string
- If the URL starts with "https://", do NOT say SSL is missing.
- return JSON only
`;

      const aiResponse = await env.AI.run("@cf/meta/llama-3-8b-instruct", {
        messages: [
          {
            role: "user",
            content: prompt
          }
        ]
      });

      const rawText = aiResponse.response || "";

      let parsed;
      try {
        parsed = extractJson(rawText);

        parsed = {
          url: parsed.url || cleanedUrl,
          riskScore: normalizeRiskScore(parsed.riskScore),
          security: Array.isArray(parsed.security) ? parsed.security : [],
          performance: Array.isArray(parsed.performance) ? parsed.performance : [],
          seo: Array.isArray(parsed.seo) ? parsed.seo : [],
          summary:
            typeof parsed.summary === "string" && parsed.summary.trim()
              ? parsed.summary.trim()
              : "No summary returned."
        };
      } catch {
        parsed = {
          url: cleanedUrl,
          riskScore: 5,
          security: ["AI response could not be cleanly parsed yet."],
          performance: [],
          seo: [],
          summary: rawText || "No summary returned."
        };
      }

      return jsonResponse({
        success: true,
        fetchedUrl: cleanedUrl,
        pageInfo: {
          title: titleMatch ? stripHtml(titleMatch[1]) : null,
          metaDescription: metaDescriptionMatch ? metaDescriptionMatch[1] : null,
          h1s: h1Matches
        },
        analysis: parsed
      });
    } catch (error) {
      return jsonResponse(
        {
          error: "Analysis failed",
          details: error.message
        },
        500
      );
    }
  }
};

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    }
  });
}

function stripHtml(text) {
  return text.replace(/<[^>]*>/g, "");
}

function extractJson(text) {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    throw new Error("No JSON object found in AI response");
  }

  return JSON.parse(text.slice(start, end + 1));
}

function normalizeRiskScore(score) {
  const num = Number(score);
  if (!Number.isFinite(num)) return 5;
  return Math.min(10, Math.max(1, Math.round(num)));
}
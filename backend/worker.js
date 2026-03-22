export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const target = url.searchParams.get("url") || "";

    if (!target.trim()) {
      return jsonResponse(
        {
          error: "Please provide a URL like ?url=example.com"
        },
        400
      );
    }

    let cleanedUrl = target.trim();
    if (!cleanedUrl.startsWith("http://") && !cleanedUrl.startsWith("https://")) {
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
      const h1Matches = [...html.matchAll(/<h1[^>]*>(.*?)<\/h1>/gi)].map(match =>
        stripHtml(match[1]).trim()
      );

      const trimmedHtml = html
        .replace(/\s+/g, " ")
        .slice(0, 4000);

      const prompt = `
You are a careful website performance, security, and SEO reviewer.

Analyse the following website using ONLY the information provided.
Do not invent vulnerabilities or claims you cannot support.
If something cannot be confirmed, say "Not enough evidence from the provided HTML."

Website URL: ${cleanedUrl}

Known page details:
- Title: ${titleMatch ? stripHtml(titleMatch[1]) : "Not found"}
- Meta description: ${metaDescriptionMatch ? metaDescriptionMatch[1] : "Not found"}
- H1 headings: ${h1Matches.length ? h1Matches.join(" | ") : "None found"}

HTML snippet:
${trimmedHtml}

Return valid JSON in exactly this format:
{
  "url": "${cleanedUrl}",
  "security": [
    "item 1",
    "item 2"
  ],
  "performance": [
    "item 1",
    "item 2"
  ],
  "seo": [
    "item 1",
    "item 2"
  ],
  "summary": "short overall summary"
}
`;

      const aiResponse = await env.AI.run("@cf/meta/llama-3-8b-instruct", {
        messages: [
          {
            role: "user",
            content: prompt
          }
        ]
      });

      let parsed;
      try {
        const rawText = aiResponse.response || "";
        parsed = extractJson(rawText);
      } catch {
        parsed = {
          url: cleanedUrl,
          security: ["AI response could not be cleanly parsed yet."],
          performance: [],
          seo: [],
          summary: aiResponse.response || "No summary returned."
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

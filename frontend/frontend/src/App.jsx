import { useEffect, useState } from "react";
import "./App.css";

const API_BASE = "https://small-grass-aec4.joshua-tite.workers.dev";
const HISTORY_STORAGE_KEY = "internet_guardian_recent_scans";

function App() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [history, setHistory] = useState([]);

  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem(HISTORY_STORAGE_KEY);
      if (savedHistory) {
        const parsedHistory = JSON.parse(savedHistory);
        if (Array.isArray(parsedHistory)) {
          setHistory(parsedHistory);
        }
      }
    } catch (err) {
      console.error("Failed to load scan history:", err);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
    } catch (err) {
      console.error("Failed to save scan history:", err);
    }
  }, [history]);

  const handleAnalyse = async (customUrl = null) => {
    const urlToUse = (customUrl || url).trim();

    if (!urlToUse) {
      setError("Please enter a website URL.");
      setResult(null);
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch(
        `${API_BASE}/?url=${encodeURIComponent(urlToUse)}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong.");
      }

      setResult(data);
      setUrl(urlToUse);

      setHistory((prev) => {
        const updated = [
          urlToUse,
          ...prev.filter((item) => item !== urlToUse),
        ];
        return updated.slice(0, 5);
      });
    } catch (err) {
      setError(err.message || "Failed to analyse website.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleAnalyse();
  };

  const analysis = result?.analysis;
  const riskScore = analysis?.riskScore;

  return (
    <div className="app">
      <div className="container">
        <header className="hero">
          <h1>Internet Guardian AI</h1>
          <p>
            AI-powered website analysis for security, performance, and SEO using
            Cloudflare Workers AI.
          </p>
        </header>

        <form className="analyse-form" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Enter a website like example.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <button type="submit" disabled={loading}>
            {loading ? "Analysing..." : "Analyse"}
          </button>
        </form>

        {history.length > 0 && (
          <div className="history">
            <p className="history-title">Recent scans</p>
            <div className="history-list">
              {history.map((item, i) => (
                <button
                  key={i}
                  type="button"
                  className="history-button"
                  onClick={() => {
                    setUrl(item);
                    handleAnalyse(item);
                  }}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        )}

        {error && <div className="error-box">{error}</div>}

        {result && (
          <section className="results">
            <div className="summary-card">
              <h2>Overview</h2>
              <p>
                <strong>Fetched URL:</strong> {result.fetchedUrl}
              </p>
              <p>
                <strong>Risk Level:</strong>{" "}
                {riskScore <= 3
                  ? "🟢 Low"
                  : riskScore <= 6
                  ? "🟡 Medium"
                  : "🔴 High"}{" "}
                ({riskScore}/10)
              </p>
              <p>
                <strong>Title:</strong> {result.pageInfo?.title || "Not found"}
              </p>
              <p>
                <strong>Meta description:</strong>{" "}
                {result.pageInfo?.metaDescription || "Not found"}
              </p>
              <p>
                <strong>H1s:</strong>
              </p>
              <ul>
                {result.pageInfo?.h1s?.length ? (
                  result.pageInfo.h1s.map((h1, index) => (
                    <li key={index}>{h1}</li>
                  ))
                ) : (
                  <li>None found</li>
                )}
              </ul>
              <p>
                <strong>Summary:</strong>{" "}
                {analysis?.summary || "No summary returned."}
              </p>
            </div>

            <div className="grid">
              <div className="card">
                <h3>Security</h3>
                <ul>
                  {analysis?.security?.length ? (
                    analysis.security.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))
                  ) : (
                    <li>No security insights returned.</li>
                  )}
                </ul>
              </div>

              <div className="card">
                <h3>Performance</h3>
                <ul>
                  {analysis?.performance?.length ? (
                    analysis.performance.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))
                  ) : (
                    <li>No performance insights returned.</li>
                  )}
                </ul>
              </div>

              <div className="card">
                <h3>SEO</h3>
                <ul>
                  {analysis?.seo?.length ? (
                    analysis.seo.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))
                  ) : (
                    <li>No SEO insights returned.</li>
                  )}
                </ul>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

export default App;
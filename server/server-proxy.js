// Simple Express proxy to keep API key on the server
// - Stores your LLM API key in an environment variable (LLM_API_KEY)
// - Forwards client prompt to the third-party LLM endpoint and returns the JSON response
// - IMPORTANT: Harden this in production (auth, rate-limiting, input validation, logging, etc.)

const express = require("express");
const fetch = require("node-fetch"); // or native fetch in Node 18+
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;
const LLM_API_KEY = process.env.LLM_API_KEY; // set this in your environment

if (!LLM_API_KEY) {
  console.error("LLM_API_KEY not set in environment. Exiting.");
  process.exit(1);
}

app.use(cors()); // refine origin in production
app.use(bodyParser.json());

app.post("/api/chat", async (req, res) => {
  const { prompt } = req.body;
  if (typeof prompt !== "string" || prompt.trim().length === 0) {
    return res.status(400).json({ error: "Invalid prompt" });
  }

  try {
    // Example remote URL: adapt to the service you use.
    // The original example used a 'pk' query param; here we append LLM_API_KEY.
    const remoteUrl = `https://backend.buildpicoapps.com/aero/run/llm-api?pk=${encodeURIComponent(LLM_API_KEY)}`;

    const r = await fetch(remoteUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt })
    });

    const data = await r.json();
    // Optionally inspect, normalize, and rate-limit responses here.
    res.status(r.status).json(data);
  } catch (err) {
    console.error("Proxy error:", err);
    res.status(502).json({ error: "Bad gateway" });
  }
});

app.listen(PORT, () => {
  console.log(`Proxy listening on http://localhost:${PORT}`);
});

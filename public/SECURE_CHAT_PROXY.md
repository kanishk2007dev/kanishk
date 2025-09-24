```markdown
# Secure Chat Proxy — quick start

This document describes the minimal steps to run the server proxy locally and wire the client to it.

Files added
- public/js/chat.js — client script (posts to /api/chat)
- public/example-chat.html — minimal HTML example using the client script
- server/server-proxy.js — minimal Express proxy that forwards prompts to the LLM backend
  (reads LLM_API_KEY from environment)

Local run (development)
1. Place files in the repository:
   - public/js/chat.js
   - public/example-chat.html
   - server/server-proxy.js

2. Install dependencies (example):
   ```
   npm init -y
   npm install express node-fetch cors body-parser
   ```

   - If you're on Node 18+ you may use the built-in fetch and skip node-fetch.

3. Set your environment variable (do NOT commit the key):
   - macOS / Linux:
     ```
     export LLM_API_KEY="your_key_here"
     node server/server-proxy.js
     ```
   - Windows (PowerShell):
     ```
     $env:LLM_API_KEY="your_key_here"
     node server/server-proxy.js
     ```

4. Serve `public/` (your static site) so the example page is reachable (e.g., using a static file server).
   - If you're using the same Express app to host static assets, mount express.static('public') and serve the HTML.
   - The client code expects the proxy endpoint at `/api/chat` (relative path). If your proxy path differs, update `API_ENDPOINT` in `public/js/chat.js`.

Production notes and recommendations
- Never store API keys in client-side code or in source control.
- Harden the proxy before production:
  - Restrict CORS to known origins.
  - Add authentication between your frontend and the proxy (API key or user session).
  - Add rate limiting and request size limits.
  - Use helmet and secure headers.
  - Add input validation and logging; consider rejecting very large prompts.
  - Consider implementing streaming responses if supported by your LLM backend.
- Use HTTPS in production and rotate keys periodically.

If you want, I can:
- Open a pull request with these files in this repository.
- Add basic rate-limiting and helmet to the proxy.
- Create a small Express static-server integration so one process serves both the proxy and the static site.

Tell me which of those you'd like next and I will prepare the PR or show the exact git commands to add these files locally.
```

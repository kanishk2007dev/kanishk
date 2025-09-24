// Improved client-side chat script
// - Avoids embedding API key on the client (call your server proxy instead)
// - Adds typing indicator, timeout, form disabling, scrolling, and timestamps
// Usage: ensure your server proxy endpoint is set in API_ENDPOINT variable.

(() => {
  const chatContent = document.getElementById("chat-content");
  const chatForm = document.getElementById("chat-form");
  const userInput = document.getElementById("user-input");
  const submitButton = chatForm.querySelector('button[type="submit"]') || null;

  // Replace with your server-side proxy endpoint (no API key in client)
  const API_ENDPOINT = "/api/chat"; // e.g., "/api/chat"

  function createMessageElement(message, fromUser) {
    const wrapper = document.createElement("div");
    wrapper.classList.add("max-w-md", "break-words", "px-4", "py-2", "rounded-full", "my-2");
    wrapper.setAttribute("role", "article");
    wrapper.setAttribute("aria-live", fromUser ? "polite" : "polite");

    if (fromUser) {
      wrapper.classList.add("bg-blue-500", "text-white", "ml-auto");
    } else {
      wrapper.classList.add("bg-white", "text-gray-800", "mr-auto", "shadow");
    }

    // message text
    const text = document.createElement("div");
    // Use textContent to avoid injecting HTML and prevent XSS
    text.textContent = message;
    wrapper.appendChild(text);

    // timestamp
    const ts = document.createElement("div");
    ts.classList.add("text-xs", "text-gray-400", "mt-1");
    const now = new Date();
    ts.textContent = now.toLocaleTimeString();
    wrapper.appendChild(ts);

    return wrapper;
  }

  function createTypingIndicator() {
    const el = document.createElement("div");
    el.classList.add("max-w-md", "px-4", "py-2", "rounded-full", "bg-white", "text-gray-800", "mr-auto", "my-2", "opacity-80");
    el.setAttribute("aria-live", "polite");
    el.textContent = "⋯"; // simple typing indicator; you can animate via CSS
    return el;
  }

  function scrollToBottom() {
    chatContent.scrollTo({ top: chatContent.scrollHeight, behavior: "smooth" });
  }

  async function fetchResponse(userMessage, { timeout = 15000 } = {}) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    try {
      const res = await fetch(API_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({ prompt: userMessage })
      });

      clearTimeout(timer);

      if (!res.ok) {
        // Try to extract JSON error if present
        let errText = `${res.status} ${res.statusText}`;
        try {
          const j = await res.json();
          if (j && j.error) errText = j.error;
        } catch (_) {}
        throw new Error(`Server error: ${errText}`);
      }

      const data = await res.json();

      // Expecting JSON { status: "success", text: "..." } or similar; adapt as needed
      if (data && data.status === "success" && typeof data.text === "string") {
        return data.text;
      } else if (data && typeof data.text === "string") {
        return data.text;
      } else {
        // Fallback: try to stringify the response for debugging
        return JSON.stringify(data);
      }
    } catch (err) {
      if (err.name === "AbortError") {
        throw new Error("Request timed out. Try again.");
      }
      throw err;
    }
  }

  chatForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const userMessage = userInput.value.trim();
    if (!userMessage) return;

    // append user message
    const userEl = createMessageElement(userMessage, true);
    chatContent.appendChild(userEl);
    scrollToBottom();

    // reset input
    userInput.value = "";

    // disable while awaiting
    if (submitButton) submitButton.disabled = true;
    userInput.disabled = true;

    // typing indicator
    const typingEl = createTypingIndicator();
    chatContent.appendChild(typingEl);
    scrollToBottom();

    try {
      const botText = await fetchResponse(userMessage);
      // remove typing indicator
      typingEl.remove();

      const botEl = createMessageElement(botText, false);
      chatContent.appendChild(botEl);
      scrollToBottom();
    } catch (err) {
      typingEl.remove();
      const errEl = createMessageElement("Error: " + (err.message || "Something went wrong."), false);
      chatContent.appendChild(errEl);
      scrollToBottom();
      console.error(err);
    } finally {
      if (submitButton) submitButton.disabled = false;
      userInput.disabled = false;
      userInput.focus();
    }
  });
})();

"use strict";

(() => {
  /* =========================================
     1. HELPERS
  ========================================= */

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];

  const state = {
    page: "dashboard",
    mode: "chat",
    modeLabel: "AI Conversational Brain",
    history: [],
    cameraStream: null,
    facingMode: "environment",
    voiceEnabled: true,
    sending: false
  };

  const MODULES = [
    ["chat", "AI Conversational Brain", "Conversational AI"],
    ["nlu", "Natural Language Understanding", "Understand user intent"],
    ["context", "Context-Aware Answers", "Use conversation context"],
    ["multiturn", "Multi-Turn Conversations", "Continue conversations"],
    ["reasoning", "Logical Reasoning", "Analyze logic and options"],
    ["problem_solving", "Complex Problem Solving", "Solve difficult problems"],
    ["plan", "Step-by-Step Planning", "Create ordered plans"],
    ["task_decompose", "Task Decomposition", "Break goals into tasks"],
    ["intent", "Intent Detection", "Identify user goals"],
    ["classify", "Command Classification", "Classify instructions"],
    ["followup", "Follow-Up Understanding", "Understand references"],
    ["clarify", "Ambiguity Clarification", "Ask when unclear"],
    ["personality", "Personal Assistant Personality", "Professional JARVIS tone"],
    ["identity", "Custom JARVIS Identity", "Maintain assistant identity"],
    ["hindi", "Hindi Language Support", "Hindi responses"],
    ["english", "English Language Support", "English responses"],
    ["hinglish", "Hinglish Language Support", "Roman Hindi and English"],
    ["translate", "Multilingual Translation", "Translate text"],
    ["grammar", "Grammar Correction", "Improve grammar"],
    ["summarize", "Text Summarization", "Summarize content"],
    ["document", "Document Understanding", "Analyze pasted documents"],
    ["math", "Mathematical Problem Solving", "Solve equations"],
    ["coding", "Coding Assistance", "Generate code"],
    ["explain_code", "Code Explanation", "Explain code"],
    ["debug", "Error Diagnosis", "Find likely bugs"],
    ["ideas", "Idea Generation", "Generate useful ideas"],
    ["creative", "Creative Writing", "Create written content"],
    ["research", "Research Assistance", "Organize research"],
    ["fact_check", "Fact-Checking Assistance", "Check claims carefully"],
    ["structured", "Structured Response Generation", "Organize responses"]
  ];

  function requiredElement(selector) {
    const element = $(selector);

    if (!element) {
      console.error("JARVIS: Missing HTML element:", selector);
    }

    return element;
  }

  function toast(message) {
    const element = $("#toast");

    if (!element) {
      console.log("JARVIS:", message);
      return;
    }

    element.textContent = message;
    element.classList.add("show");

    clearTimeout(toast.timer);

    toast.timer = setTimeout(() => {
      element.classList.remove("show");
    }, 3500);
  }

  function setText(selector, value) {
    const element = $(selector);

    if (element) {
      element.textContent = value;
    }
  }

  /* =========================================
     2. NAVIGATION
  ========================================= */

  function navigate(page) {
    const validPages = [
      "dashboard",
      "assistant",
      "camera",
      "settings"
    ];

    if (!validPages.includes(page)) {
      page = "dashboard";
    }

    if (state.page === "camera" && page !== "camera") {
      stopCamera(false);
    }

    state.page = page;

    $$(".page").forEach((section) => {
      section.classList.toggle("active", section.id === page);
    });

    $$("nav [data-page]").forEach((button) => {
      button.classList.toggle(
        "active",
        button.dataset.page === page
      );
    });

    if (window.location.hash !== "#" + page) {
      window.history.replaceState(null, "", "#" + page);
    }

    window.scrollTo(0, 0);
  }

  document.addEventListener("click", (event) => {
    const target = event.target;

    if (!(target instanceof Element)) {
      return;
    }

    const pageButton = target.closest("[data-page]");
    const goButton = target.closest("[data-go]");

    if (pageButton) {
      navigate(pageButton.dataset.page);
    }

    if (goButton) {
      navigate(goButton.dataset.go);
    }
  });

  window.addEventListener("hashchange", () => {
    const page = window.location.hash.slice(1);

    if (page !== state.page) {
      navigate(page);
    }
  });

  /* =========================================
     3. 30 AI MODULES
  ========================================= */

  function renderModules(query = "") {
    const list = $("#moduleList");

    if (!list) {
      console.error("JARVIS: #moduleList not found.");
      return;
    }

    list.replaceChildren();

    const searchText = query.trim().toLowerCase();

    const filteredModules = MODULES.filter((module) => {
      return module.join(" ").toLowerCase().includes(searchText);
    });

    filteredModules.forEach(([mode, label, description]) => {
      const button = document.createElement("button");

      button.type = "button";
      button.className =
        "module" + (state.mode === mode ? " selected" : "");

      const title = document.createElement("span");
      const number = MODULES.findIndex(
        (module) => module[0] === mode
      ) + 1;

      title.textContent =
        String(number).padStart(2, "0") + ". " + label;

      const detail = document.createElement("small");
      detail.textContent = description;

      button.append(title, detail);

      button.addEventListener("click", () => {
        state.mode = mode;
        state.modeLabel = label;

        renderModules($("#moduleSearch")?.value || "");

        setText("#moduleStatus", "Selected: " + label);

        const input = $("#chatInput");

        if (input) {
          input.focus();
        }

        toast("Module selected: " + label);
      });

      list.append(button);
    });

    if (filteredModules.length === 0) {
      const empty = document.createElement("p");

      empty.className = "muted";
      empty.textContent =
        "No modules found. Try another search.";

      list.append(empty);
    }
  }

  $("#moduleSearch")?.addEventListener("input", (event) => {
    renderModules(event.target.value);
  });

  /* =========================================
     4. CHAT MESSAGES
  ========================================= */

  function addMessage(role, text) {
    const container = $("#messages");

    if (!container) {
      console.error("JARVIS: #messages element not found.");
      return;
    }

    const message = document.createElement("div");

    // The existing CSS uses .message.ai and .message.user.
    message.className =
      "message " + (role === "user" ? "user" : "ai");

    const heading = document.createElement("b");

    heading.textContent =
      role === "user" ? "COMMANDER" : "J.A.R.V.I.S.";

    const content = document.createElement("div");

    // textContent avoids interpreting model output as HTML.
    content.textContent = String(text);

    message.append(heading, content);
    container.append(message);

    container.scrollTop = container.scrollHeight;
  }

  /* =========================================
     5. LANGUAGE AND VOICE
  ========================================= */

  function getLanguageCode() {
    const language = $("#languageSelect")?.value || "auto";

    if (language === "hi") {
      return "hi";
    }

    if (language === "en") {
      return "en";
    }

    if (language === "hinglish") {
      return "hinglish";
    }

    return "auto";
  }

  function getSpeechLanguage() {
    const language = getLanguageCode();

    if (language === "hi") {
      return "hi-IN";
    }

    if (language === "en") {
      return "en-US";
    }

    return "en-IN";
  }

  function speak(text) {
    if (
      !state.voiceEnabled ||
      !("speechSynthesis" in window)
    ) {
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(
      String(text).slice(0, 3500)
    );

    utterance.lang = getSpeechLanguage();
    utterance.rate = 1;
    utterance.pitch = 1;

    window.speechSynthesis.speak(utterance);
  }

  function updateVoiceButton() {
    const button = $("#voiceButton");
    const checkbox = $("#speakReplies");

    if (button) {
      button.textContent = state.voiceEnabled
        ? "🔊 Voice ON"
        : "🔇 Voice OFF";
    }

    if (checkbox) {
      checkbox.checked = state.voiceEnabled;
    }
  }

  $("#voiceButton")?.addEventListener("click", () => {
    state.voiceEnabled = !state.voiceEnabled;

    updateVoiceButton();

    if (
      !state.voiceEnabled &&
      "speechSynthesis" in window
    ) {
      window.speechSynthesis.cancel();
    }

    toast(
      state.voiceEnabled
        ? "Voice replies enabled."
        : "Voice replies disabled."
    );
  });

  /* =========================================
     6. OPENAI CHAT API
     The API key stays on the server.
  ========================================= */

  async function sendMessage(rawMessage) {
    const message = String(rawMessage || "").trim();

    if (!message) {
      toast("Please enter a message first.");
      return;
    }

    if (state.sending) {
      toast("JARVIS is processing your previous message.");
      return;
    }

    const sendButton = $("#sendButton");
    const input = $("#chatInput");

    state.sending = true;

    if (sendButton) {
      sendButton.disabled = true;
      sendButton.textContent = "Thinking...";
    }

    if (input) {
      input.disabled = true;
    }

    addMessage("user", message);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },

        body: JSON.stringify({
          message: message,
          mode: state.mode,
          modeLabel: state.modeLabel,
          language: getLanguageCode(),
          history: state.history.slice(-12)
        })
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.error || "Server returned HTTP " + response.status
        );
      }

      const reply =
        data.reply ||
        data.response ||
        data.output_text ||
        data.message;

      if (typeof reply !== "string" || !reply.trim()) {
        throw new Error(
          "The server did not return an AI reply."
        );
      }

      addMessage("ai", reply);

      state.history.push(
        {
          role: "user",
          content: message
        },
        {
          role: "assistant",
          content: reply
        }
      );

      // Keep only the latest 12 history entries.
      state.history = state.history.slice(-12);

      speak(reply);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Unknown connection error";

      console.error("JARVIS chat error:", error);

      addMessage(
        "ai",
        "Connection error: " + errorMessage +
        "\n\nPlease check /api/health, server.js, and your OpenAI API configuration."
      );

      toast("AI request failed. Check the server configuration.");
    } finally {
      state.sending = false;

      if (sendButton) {
        sendButton.disabled = false;
        sendButton.textContent = "Send ↑";
      }

      if (input) {
        input.disabled = false;
        input.focus();
      }
    }
  }

  $("#chatForm")?.addEventListener("submit", (event) => {
    event.preventDefault();

    const input = $("#chatInput");

    if (!input) {
      return;
    }

    const message = input.value;

    if (!message.trim()) {
      toast("Please type a message.");
      return;
    }

    input.value = "";

    sendMessage(message);
  });

  $("#chatInput")?.addEventListener("keydown", (event) => {
    if (
      event.key === "Enter" &&
      !event.shiftKey &&
      !event.isComposing
    ) {
      event.preventDefault();

      const form = $("#chatForm");

      if (form && typeof form.requestSubmit === "function") {
        form.requestSubmit();
      }
    }
  });

  $("#clearChat")?.addEventListener("click", () => {
    if (state.sending) {
      toast("Wait until the current reply finishes.");
      return;
    }

    state.history = [];

    const messages = $("#messages");

    if (messages) {
      messages.replaceChildren();
    }

    addMessage(
      "ai",
      "Conversation cleared, Commander. How may I assist?"
    );

    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  });

  /* =========================================
     7. VOICE INPUT / MICROPHONE
  ========================================= */

  $("#micButton")?.addEventListener("click", () => {
    const Recognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!Recognition) {
      toast(
        "Voice input is not supported in this browser. Type your message instead."
      );
      return;
    }

    const recognition = new Recognition();

    recognition.lang = getSpeechLanguage();
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    const micButton = $("#micButton");

    if (micButton) {
      micButton.disabled = true;
      micButton.textContent = "🎙 Listening...";
    }

    recognition.onresult = (event) => {
      const transcript =
        event.results?.[0]?.[0]?.transcript;

      if (transcript && $("#chatInput")) {
        $("#chatInput").value = transcript;
        $("#chatInput").focus();

        toast("Voice captured. Press Send to submit.");
      }
    };

    recognition.onerror = (event) => {
      console.warn("Speech recognition error:", event.error);

      if (event.error === "not-allowed") {
        toast("Allow microphone permission in your browser.");
      } else {
        toast("Microphone error: " + event.error);
      }
    };

    recognition.onend = () => {
      if (micButton) {
        micButton.disabled = false;
        micButton.textContent = "🎙 Voice Input";
      }
    };

    try {
      recognition.start();
    } catch (error) {
      console.error(error);
      toast("Could not start voice input. Try again.");
    }
  });

  /* =========================================
     8. SERVER HEALTH CHECK
  ========================================= */

  async function checkServer(showToast = false) {
    setText("#aiStatus", "Checking...");

    try {
      const response = await fetch("/api/health", {
        method: "GET",
        headers: {
          "Accept": "application/json"
        },
        cache: "no-store"
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.error || "HTTP " + response.status
        );
      }

      if (data.configured) {
        setText("#aiStatus", "Online • API configured");
      } else {
        setText("#aiStatus", "Online • API key missing");
      }

      setText(
        "#voiceStatus",
        ("speechSynthesis" in window)
          ? "Available"
          : "Not supported"
      );

      if (showToast) {
        toast(
          data.configured
            ? "JARVIS server is online and API is configured."
            : "Server is online, but the OpenAI API key is not configured."
        );
      }

      console.log("JARVIS health:", data);

      return data;
    } catch (error) {
      console.error("JARVIS health check failed:", error);

      setText("#aiStatus", "Offline");

      if (showToast) {
        toast(
          "Server unavailable. Check your Render deployment."
        );
      }

      return null;
    }
  }

  $("#checkServer")?.addEventListener("click", () => {
    checkServer(true);
  });

  /* =========================================
     9. CAMERA CENTER
  ========================================= */

  const video = $("#cameraPreview");
  const placeholder = $("#cameraPlaceholder");

  async function startCamera() {
    if (!navigator.mediaDevices?.getUserMedia) {
      setText(
        "#cameraStatus",
        "Camera requires HTTPS or localhost."
      );

      toast("Open the website over HTTPS to use the camera.");
      return;
    }

    // Stop the previous stream before switching cameras.
    stopCamera(false);

    setText("#cameraStatus", "Requesting camera permission...");

    const startButton = $("#startCamera");

    if (startButton) {
      startButton.disabled = true;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,

        video: {
          facingMode: {
            ideal: state.facingMode
          }
        }
      });

      state.cameraStream = stream;

      if (video) {
        video.srcObject = stream;
        video.style.display = "block";

        await video.play().catch(() => {});
      }

      if (placeholder) {
        placeholder.style.display = "none";
      }

      const flipButton = $("#flipCamera");
      const stopButton = $("#stopCamera");

      if (startButton) {
        startButton.disabled = true;
      }

      if (flipButton) {
        flipButton.disabled = false;
      }

      if (stopButton) {
        stopButton.disabled = false;
      }

      setText(
        "#cameraStatus",
        "Camera running: " +
        (
          state.facingMode === "environment"
            ? "Back camera"
            : "Front camera"
        )
      );
    } catch (error) {
      console.error("Camera error:", error);

      stopCamera(false);

      let message = "Camera error: " + (error.message || "Unknown error");

      if (error.name === "NotAllowedError") {
        message = "Camera permission denied. Allow camera access.";
      } else if (error.name === "NotFoundError") {
        message = "No compatible camera was found on this device.";
      } else if (error.name === "NotReadableError") {
        message = "Camera is busy or being used by another app.";
      } else if (error.name === "OverconstrainedError") {
        message = "Requested camera mode is not available.";
      }

      setText("#cameraStatus", message);
      toast(message);
    }
  }

  function stopCamera(updateStatus = true) {
    if (state.cameraStream) {
      state.cameraStream.getTracks().forEach((track) => {
        track.stop();
      });

      state.cameraStream = null;
    }

    if (video) {
      video.srcObject = null;
      video.style.display = "none";
    }

    if (placeholder) {
      placeholder.style.display = "grid";
    }

    const startButton = $("#startCamera");
    const flipButton = $("#flipCamera");
    const stopButton = $("#stopCamera");

    if (startButton) {
      startButton.disabled = false;
    }

    if (flipButton) {
      flipButton.disabled = true;
    }

    if (stopButton) {
      stopButton.disabled = true;
    }

    if (updateStatus) {
      setText("#cameraStatus", "Camera is off.");
    }
  }

  $("#startCamera")?.addEventListener("click", startCamera);

  $("#stopCamera")?.addEventListener("click", () => {
    stopCamera(true);
  });

  $("#flipCamera")?.addEventListener("click", async () => {
    if (!state.cameraStream) {
      return;
    }

    state.facingMode =
      state.facingMode === "environment"
        ? "user"
        : "environment";

    await startCamera();
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden && state.cameraStream) {
      stopCamera(true);
    }
  });

  window.addEventListener("pagehide", () => {
    stopCamera(false);
  });

  /* =========================================
     10. SETTINGS
  ========================================= */

  function loadSettings() {
    try {
      const saved = JSON.parse(
        localStorage.getItem("jarvisSettings") || "{}"
      );

      const languageSelect = $("#languageSelect");

      const validLanguages = [
        "auto",
        "hi",
        "en",
        "hinglish"
      ];

      if (
        languageSelect &&
        validLanguages.includes(saved.language)
      ) {
        languageSelect.value = saved.language;
      }

      state.voiceEnabled = saved.voiceEnabled !== false;
    } catch (error) {
      console.warn("Could not load JARVIS settings:", error);

      state.voiceEnabled = true;
    }

    updateVoiceButton();
  }

  $("#saveSettings")?.addEventListener("click", () => {
    const languageSelect = $("#languageSelect");

    state.voiceEnabled = $("#speakReplies")?.checked !== false;

    try {
      localStorage.setItem(
        "jarvisSettings",
        JSON.stringify({
          language: languageSelect?.value || "auto",
          voiceEnabled: state.voiceEnabled
        })
      );

      updateVoiceButton();

      setText(
        "#settingsStatus",
        "Settings saved successfully."
      );

      toast("Preferences saved.");
    } catch (error) {
      console.error("Settings save error:", error);

      setText(
        "#settingsStatus",
        "Could not save settings in this browser."
      );

      toast("Settings could not be saved.");
    }
  });

  $("#speakReplies")?.addEventListener("change", (event) => {
    state.voiceEnabled = event.target.checked;

    updateVoiceButton();

    if (
      !state.voiceEnabled &&
      "speechSynthesis" in window
    ) {
      window.speechSynthesis.cancel();
    }
  });

  /* =========================================
     11. INITIALIZE JARVIS
  ========================================= */

  function initializeJarvis() {
    renderModules();

    loadSettings();

    const initialPage = window.location.hash.slice(1);

    navigate(initialPage || "dashboard");

    checkServer(false);

    setText(
      "#cameraStatus",
      "Camera is off."
    );

    console.log("J.A.R.V.I.S. frontend initialized.");
  }

  initializeJarvis();
})();
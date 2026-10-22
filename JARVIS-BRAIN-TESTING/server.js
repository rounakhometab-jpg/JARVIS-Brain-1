import "dotenv/config";
import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import OpenAI from "openai";
import path from "node:path";
import { fileURLToPath } from "node:url";

const app = express();

const PORT = Number(process.env.PORT) || 3000;
const MODEL = process.env.OPENAI_MODEL || "gpt-4.1-mini";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PUBLIC_DIR = path.join(__dirname, "public");
const INDEX_FILE = path.join(PUBLIC_DIR, "index.html");

// ================================
// SECURITY
// ================================

app.disable("x-powered-by");

// Your current HTML contains inline CSS and JavaScript.
app.use(helmet({ contentSecurityPolicy: false }));

app.use(express.json({ limit: "1mb" }));

// ================================
// OPENAI API CONFIGURATION
// ================================

const apiKey = process.env.OPENAI_API_KEY?.trim();

const invalidKeyPlaceholders = [
  "",
  "your_actual_openai_api_key",
  "paste_your_openai_api_key_here",
  "your_openai_api_key"
];

const hasValidKey =
  Boolean(apiKey) &&
  !invalidKeyPlaceholders.includes(apiKey.toLowerCase());

const openai = hasValidKey ? new OpenAI({ apiKey }) : null;

// ================================
// 30 JARVIS AI MODULES
// The modules use one configured AI model.
// ================================

const modes = {
  chat: "Have a natural, helpful conversation. Use the supplied conversation history.",
  nlu: "Understand the user's meaning, intent, tone, and requirements.",
  context: "Use available conversation context. Never invent personal information.",
  multiturn: "Understand follow-up messages using recent conversation history.",
  reasoning: "Solve logical problems carefully and explain important steps.",
  problem_solving: "Analyze complex problems and provide practical solutions.",
  plan: "Create a practical, prioritized, step-by-step plan.",
  task_decompose: "Break complicated tasks into smaller actionable tasks.",
  intent: "Identify the user's intent and desired outcome.",
  classify: "Classify the user's command and suggest an appropriate next action.",
  followup: "Interpret follow-up questions using recent conversation context.",
  clarify: "Ask a concise clarification question when a request is genuinely ambiguous.",
  personality: "Use a calm, intelligent, professional JARVIS personality.",
  identity: "Identify yourself as J.A.R.V.I.S., a personal AI assistant. Do not claim to be a real movie character.",
  hindi: "Reply in natural Hindi, preferably in Devanagari script.",
  english: "Reply in clear, natural English.",
  hinglish: "Reply in natural Hinglish using Roman script.",
  translate: "Translate accurately while preserving meaning. Ask for the target language if necessary.",
  grammar: "Correct grammar, spelling, punctuation, and sentence structure without changing the intended meaning.",
  summarize: "Summarize supplied content accurately and preserve important details.",
  document: "Analyze document text supplied by the user. Do not claim to have read files that were not provided.",
  math: "Solve mathematical problems carefully and show understandable steps.",
  coding: "Write maintainable code and explain how to integrate it.",
  explain_code: "Explain code, functions, inputs, outputs, and control flow.",
  debug: "Diagnose programming errors and suggest concrete, testable fixes.",
  ideas: "Generate useful, varied ideas and practical next steps.",
  creative: "Create original writing that matches the requested style.",
  research: "Research questions using web search when enabled and appropriate. Distinguish facts from uncertainty.",
  fact_check: "Evaluate claims carefully. Do not invent evidence or citations.",
  structured: "Organize responses with appropriate headings, numbered steps, lists, or tables."
};

const allowedModes = new Set(Object.keys(modes));
const allowedLanguages = new Set(["auto", "hi", "en", "hinglish"]);

// ================================
// RATE LIMIT
// ================================

const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 25,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    error: "Too many requests. Please wait one minute and try again."
  }
});

// ================================
// FRONTEND STATIC FILES
// public/index.html
// public/css/style.css (if used)
// ================================

app.use(express.static(PUBLIC_DIR, { index: false }));

function serveFrontend(_req, res) {
  res.sendFile(INDEX_FILE, error => {
    if (error && !res.headersSent) {
      console.error("Frontend file error:", error.message);

      res.status(500).send(
        "JARVIS frontend not found. Make sure public/index.html exists."
      );
    }
  });
}

// Dashboard
app.get("/", serveFrontend);

// Other JARVIS pages
app.get("/assistant", serveFrontend);
app.get("/camera", serveFrontend);
app.get("/settings", serveFrontend);

// ================================
// HEALTH CHECK
// GET /api/health
// ================================

app.get("/api/health", (_req, res) => {
  res.set("Cache-Control", "no-store");

  res.json({
    success: true,
    name: "J.A.R.V.I.S.",
    status: "online",
    message: "JARVIS server is running.",
    configured: Boolean(openai),
    model: MODEL,
    features: allowedModes.size,
    webSearchEnabled:
      process.env.ENABLE_WEB_SEARCH?.trim().toLowerCase() === "true"
  });
});

// ================================
// AI CHAT
// POST /api/chat
// ================================

app.post("/api/chat", chatLimiter, async (req, res) => {
  try {
    const body = req.body ?? {};

    const message = body.message;
    const history = body.history ?? [];
    const mode = body.mode ?? "chat";
    const language = body.language ?? "auto";

    // Validate message
    if (typeof message !== "string" || !message.trim()) {
      return res.status(400).json({
        error: "Please enter a message."
      });
    }

    if (message.length > 12000) {
      return res.status(413).json({
        error: "Message is too long. Maximum length is 12000 characters."
      });
    }

    // Validate history
    if (!Array.isArray(history) || history.length > 12) {
      return res.status(400).json({
        error: "Conversation history must contain at most 12 messages."
      });
    }

    // Validate module
    if (typeof mode !== "string" || !allowedModes.has(mode)) {
      return res.status(400).json({
        error: "Unknown JARVIS module."
      });
    }

    // Validate language
    if (
      typeof language !== "string" ||
      !allowedLanguages.has(language)
    ) {
      return res.status(400).json({
        error: "Unsupported language selection."
      });
    }

    // Check API key
    if (!openai) {
      return res.status(503).json({
        error: "OpenAI API key is missing. Set OPENAI_API_KEY in your server environment."
      });
    }

    // Sanitize conversation history
    const safeHistory = history
      .filter(item =>
        item &&
        typeof item === "object" &&
        ["user", "assistant"].includes(item.role) &&
        typeof item.content === "string"
      )
      .slice(-12)
      .map(item => ({
        role: item.role,
        content: item.content.slice(0, 12000)
      }));

    // Select response language
    let languageInstruction =
      "Reply in the same language as the user. Support Hindi, English, and Hinglish.";

    if (language === "hi" || mode === "hindi") {
      languageInstruction =
        "Reply in natural Hindi, preferably in Devanagari script.";
    } else if (language === "en" || mode === "english") {
      languageInstruction = "Reply in clear English.";
    } else if (language === "hinglish" || mode === "hinglish") {
      languageInstruction = "Reply in natural Hinglish using Roman script.";
    }

    // Prepare Responses API input
    const input = [
      ...safeHistory,
      {
        role: "user",
        content: message.trim()
      }
    ];

    // Optional web search
    const enableWebSearch =
      process.env.ENABLE_WEB_SEARCH?.trim().toLowerCase() === "true";

    const response = await openai.responses.create({
      model: MODEL,

      instructions: [
        "You are J.A.R.V.I.S., a helpful personal AI assistant.",
        "Be accurate, practical, respectful, and honest about your capabilities.",
        "Do not claim to control devices or access private information without authorized integrations.",
        "Never reveal API keys, secrets, or environment variables.",
        "Do not invent facts, sources, or citations.",
        languageInstruction,
        modes[mode]
      ].join("\n"),

      input,

      ...(enableWebSearch
        ? { tools: [{ type: "web_search" }] }
        : {}),

      max_output_tokens: 1800
    });

    const reply = response.output_text?.trim();

    if (!reply) {
      return res.status(502).json({
        error: "The AI returned an empty response. Please try again."
      });
    }

    return res.json({
      success: true,
      reply,
      mode,
      model: MODEL
    });

  } catch (error) {
    // Diagnostics stay on the server.
    console.error(
      "JARVIS API error:",
      error?.status || "",
      error?.message || "Unknown error"
    );

    if (error?.status === 401) {
      return res.status(502).json({
        error: "OpenAI rejected the API key. Check OPENAI_API_KEY."
      });
    }

    if (error?.status === 429) {
      return res.status(502).json({
        error: "OpenAI rate limit or API quota reached. Check your API usage and billing."
      });
    }

    if (error?.status === 400 || error?.status === 404) {
      return res.status(502).json({
        error: "OpenAI request failed. Check OPENAI_MODEL and API access."
      });
    }

    return res.status(502).json({
      error: "JARVIS could not get an AI response. Check the server logs."
    });
  }
});

// ================================
// UNKNOWN API ROUTES
// ================================

app.use("/api", (_req, res) => {
  res.status(404).json({
    error: "API endpoint not found."
  });
});

// ================================
// UNKNOWN PAGE ROUTES
// ================================

app.use((_req, res) => {
  res.status(404).send(
    "404 - Page not found. Return to the JARVIS dashboard."
  );
});

// ================================
// ERROR HANDLER
// ================================

app.use((error, _req, res, _next) => {
  console.error("Server error:", error?.message || "Unknown error");

  if (res.headersSent) return;

  if (error?.type === "entity.too.large") {
    return res.status(413).json({
      error: "Request is too large."
    });
  }

  if (error instanceof SyntaxError && "body" in error) {
    return res.status(400).json({
      error: "Invalid JSON request."
    });
  }

  return res.status(500).json({
    error: "Internal server error."
  });
});

// ================================
// START SERVER
// ================================

app.listen(PORT, "0.0.0.0", () => {
  console.log(`J.A.R.V.I.S. server running on port ${PORT}`);
  console.log(`Frontend path: ${INDEX_FILE}`);
  console.log(`AI model: ${MODEL}`);
  console.log(`OpenAI key configured: ${Boolean(openai)}`);
  console.log(
    `Web search enabled: ${process.env.ENABLE_WEB_SEARCH === "true"}`
  );
});
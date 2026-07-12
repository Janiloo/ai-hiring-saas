import Anthropic from "@anthropic-ai/sdk";

// ─────────────────────────────────────────────────────────────────────────────
// AI provider abstraction.
//
//   AI_PROVIDER=ollama     → free: local Ollama (http://localhost:11434) or
//                            Ollama Cloud (https://ollama.com + OLLAMA_API_KEY)
//   AI_PROVIDER=gemini     → Google Gemini API free tier (GEMINI_API_KEY from
//                            https://aistudio.google.com/apikey). Reads PDFs
//                            natively. Good default for hosted deployments.
//   AI_PROVIDER=anthropic  → Claude API (requires ANTHROPIC_API_KEY + credits)
//
// Ollama models can't read PDFs directly, so callers that have a PDF extract
// its text first (see extractPdfText) and pass plain text. Gemini and Claude
// accept the PDF directly.
// ─────────────────────────────────────────────────────────────────────────────

export type AIProvider = "ollama" | "gemini" | "anthropic";

export function activeProvider(): AIProvider {
  const p = process.env.AI_PROVIDER ?? "ollama";
  if (p === "anthropic") return "anthropic";
  if (p === "gemini") return "gemini";
  return "ollama";
}

export function providerConfigError(): string | null {
  if (activeProvider() === "anthropic") {
    return process.env.ANTHROPIC_API_KEY
      ? null
      : "ANTHROPIC_API_KEY is not configured on the server.";
  }
  if (activeProvider() === "gemini") {
    return process.env.GEMINI_API_KEY
      ? null
      : "GEMINI_API_KEY is not configured on the server.";
  }
  return null; // Ollama needs no key locally; cloud key is optional config
}

const OLLAMA_BASE  = () => (process.env.OLLAMA_BASE_URL ?? "http://localhost:11434").replace(/\/$/, "");
const OLLAMA_MODEL = () => process.env.OLLAMA_MODEL ?? "glm4";

interface OllamaChatOptions {
  system:  string;
  prompt:  string;
  /** JSON schema — when set, Ollama constrains output to valid matching JSON */
  format?: Record<string, unknown>;
}

async function ollamaChat({ system, prompt, format }: OllamaChatOptions): Promise<string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (process.env.OLLAMA_API_KEY) headers.Authorization = `Bearer ${process.env.OLLAMA_API_KEY}`;

  let res: Response;
  try {
    res = await fetch(`${OLLAMA_BASE()}/api/chat`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: OLLAMA_MODEL(),
        stream: false,
        ...(format ? { format } : {}),
        messages: [
          { role: "system", content: system },
          { role: "user", content: prompt },
        ],
      }),
    });
  } catch {
    throw new Error(
      `Could not reach Ollama at ${OLLAMA_BASE()}. Is the Ollama app running? (ollama serve)`
    );
  }

  if (res.status === 404) {
    throw new Error(
      `Ollama model "${OLLAMA_MODEL()}" not found. Run: ollama pull ${OLLAMA_MODEL()}`
    );
  }
  if (!res.ok) throw new Error(`Ollama request failed: ${res.status} ${await res.text()}`);

  const data = (await res.json()) as { message?: { content?: string } };
  const text = data.message?.content?.trim();
  if (!text) throw new Error("Ollama returned an empty response.");
  return text;
}

// ── Gemini (Google AI Studio, free tier) ─────────────────────────────────────

const GEMINI_MODEL = () => process.env.GEMINI_MODEL ?? "gemini-3.5-flash";

interface GeminiChatOptions {
  system:  string;
  prompt:  string;
  /** When true, forces application/json output (schema is embedded in prompt). */
  json?:   boolean;
  /** Optional PDF — Gemini reads PDFs natively via inline_data. */
  pdfBase64?: string;
}

async function geminiChat({ system, prompt, json, pdfBase64 }: GeminiChatOptions): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured on the server.");

  const parts: Record<string, unknown>[] = [];
  if (pdfBase64) {
    parts.push({ inline_data: { mime_type: "application/pdf", data: pdfBase64 } });
  }
  parts.push({ text: prompt });

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL()}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: "user", parts }],
        generationConfig: {
          // Generous budget: flash models spend output tokens on internal
          // reasoning; too low a cap truncates JSON mid-object.
          maxOutputTokens: 16384,
          ...(json ? { responseMimeType: "application/json" } : {}),
        },
      }),
    }
  );

  if (res.status === 429) {
    throw new Error("Gemini rate limit reached (free tier). The queue will retry on the next run.");
  }
  if (!res.ok) throw new Error(`Gemini request failed: ${res.status} ${await res.text()}`);

  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] }; finishReason?: string }[];
  };
  const text = (data.candidates?.[0]?.content?.parts ?? [])
    .map((p) => p.text ?? "")
    .join("")
    .trim();
  if (!text) {
    const reason = data.candidates?.[0]?.finishReason;
    throw new Error(`Gemini returned an empty response${reason ? ` (${reason})` : ""}.`);
  }
  return text;
}

/** Strips markdown code fences some models wrap around JSON output. */
function parseModelJSON<T>(text: string): T {
  const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
  return JSON.parse(cleaned) as T;
}

/** Free-form text generation on the active provider. */
export async function generateText(system: string, prompt: string): Promise<string> {
  if (activeProvider() === "ollama") {
    return ollamaChat({ system, prompt });
  }
  if (activeProvider() === "gemini") {
    return geminiChat({ system, prompt });
  }

  const client = new Anthropic();
  const response = await client.messages.create({
    model: "claude-opus-4-8",
    max_tokens: 4096,
    thinking: { type: "adaptive" },
    system,
    messages: [{ role: "user", content: prompt }],
  });
  if (response.stop_reason === "refusal") throw new Error("The AI declined this request.");
  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();
  if (!text) throw new Error("The AI returned an empty response.");
  return text;
}

/** Schema-constrained JSON generation on the active provider. */
export async function generateJSON<T>(
  system: string,
  prompt: string,
  schema: Record<string, unknown>,
  /** Optional PDF for Anthropic/Gemini (native document input). Ollama callers
   *  must extract text themselves and include it in `prompt`. */
  pdfBase64?: string
): Promise<T> {
  if (activeProvider() === "ollama") {
    const text = await ollamaChat({ system, prompt, format: schema });
    return JSON.parse(text) as T;
  }

  if (activeProvider() === "gemini") {
    // Gemini's responseSchema doesn't support union types (["string","null"]),
    // so we force JSON output mode and embed the schema in the prompt instead.
    const geminiPrompt = `${prompt}\n\nRespond ONLY with a JSON object matching this exact schema (no markdown, no commentary):\n${JSON.stringify(schema, null, 2)}`;
    let lastError: unknown;
    for (let attempt = 0; attempt < 2; attempt++) {
      const text = await geminiChat({ system, prompt: geminiPrompt, json: true, pdfBase64 });
      try {
        return parseModelJSON<T>(text);
      } catch (err) {
        // Truncated/malformed JSON — retry once before failing the job.
        lastError = err;
      }
    }
    throw new Error(
      `Gemini returned invalid JSON: ${lastError instanceof Error ? lastError.message : "parse error"}`
    );
  }

  const client = new Anthropic();
  const content: Anthropic.ContentBlockParam[] = [];
  if (pdfBase64) {
    content.push({
      type: "document",
      source: { type: "base64", media_type: "application/pdf", data: pdfBase64 },
    });
  }
  content.push({ type: "text", text: prompt });

  const response = await client.messages.create({
    model: "claude-opus-4-8",
    max_tokens: 4096,
    thinking: { type: "adaptive" },
    system,
    output_config: { format: { type: "json_schema", schema } },
    messages: [{ role: "user", content }],
  });
  if (response.stop_reason === "refusal") throw new Error("The AI declined this request.");
  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");
  return JSON.parse(text) as T;
}

/** Extracts plain text from a base64 PDF (for providers without PDF input). */
export async function extractPdfText(pdfBase64: string): Promise<string> {
  // pdf-parse's index.js runs debug code when imported directly — import the
  // core lib instead.
  const { default: pdfParse } = await import("pdf-parse/lib/pdf-parse.js");
  const buffer = Buffer.from(pdfBase64, "base64");
  const result = await pdfParse(buffer);
  const text = (result.text ?? "").trim();
  if (!text) {
    throw new Error("Could not extract text from the PDF (it may be a scanned image).");
  }
  // Keep well within small-model context windows
  return text.slice(0, 20000);
}

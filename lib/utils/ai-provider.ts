import Anthropic from "@anthropic-ai/sdk";

// ─────────────────────────────────────────────────────────────────────────────
// AI provider abstraction.
//
//   AI_PROVIDER=ollama     → free: local Ollama (http://localhost:11434) or
//                            Ollama Cloud (https://ollama.com + OLLAMA_API_KEY)
//   AI_PROVIDER=anthropic  → Claude API (requires ANTHROPIC_API_KEY + credits)
//
// Ollama models can't read PDFs directly, so callers that have a PDF extract
// its text first (see extractPdfText) and pass plain text.
// ─────────────────────────────────────────────────────────────────────────────

export type AIProvider = "ollama" | "anthropic";

export function activeProvider(): AIProvider {
  return (process.env.AI_PROVIDER ?? "ollama") === "anthropic" ? "anthropic" : "ollama";
}

export function providerConfigError(): string | null {
  if (activeProvider() === "anthropic") {
    return process.env.ANTHROPIC_API_KEY
      ? null
      : "ANTHROPIC_API_KEY is not configured on the server.";
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

/** Free-form text generation on the active provider. */
export async function generateText(system: string, prompt: string): Promise<string> {
  if (activeProvider() === "ollama") {
    return ollamaChat({ system, prompt });
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
  /** Optional PDF for Anthropic (native document input). Ollama callers must
   *  extract text themselves and include it in `prompt`. */
  pdfBase64?: string
): Promise<T> {
  if (activeProvider() === "ollama") {
    const text = await ollamaChat({ system, prompt, format: schema });
    return JSON.parse(text) as T;
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

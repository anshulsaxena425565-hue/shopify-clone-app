import type { IncomingMessage, ServerResponse } from "node:http";
import { extractJsonLd, extractMetadataProduct } from "./_lib/jsonld";

type VercelRequest = IncomingMessage & {
  body?: unknown;
};

type VercelResponse = ServerResponse & {
  status: (code: number) => VercelResponse;
  json: (body: unknown) => void;
};

function send(res: VercelResponse, status: number, body: unknown) {
  res.status(status).json(body);
}

async function readBody(req: VercelRequest): Promise<unknown> {
  if (req.body !== undefined) return req.body;

  let raw = "";
  for await (const chunk of req) raw += chunk;

  if (!raw.trim()) return {};
  try {
    return JSON.parse(raw);
  } catch {
    throw new Error("Request body must be valid JSON.");
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "GET") {
    return send(res, 200, { ok: true, service: "product-extractor" });
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return send(res, 405, { error: "Method not allowed." });
  }

  try {
    const body = await readBody(req);
    const url = body && typeof body === "object" && "url" in body
      ? (body as { url?: unknown }).url
      : undefined;

    if (typeof url !== "string") {
      return send(res, 400, { error: "A product URL is required." });
    }

    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return send(res, 400, { error: "Only HTTP(S) URLs are supported." });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20_000);

    let response: Response;
    try {
      response = await fetch(parsed.toString(), {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; ProductCloneBot/1.0)",
          "Accept": "text/html,application/xhtml+xml"
        },
        redirect: "follow",
        signal: controller.signal
      });
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      return send(res, 502, { error: `Source returned HTTP ${response.status}.` });
    }

    const html = await response.text();
    const product =
      extractJsonLd(html, parsed.toString()) ||
      extractMetadataProduct(html, parsed.toString());

    if (!product) {
      return send(res, 422, {
        error: "No product data was found. This source may require JavaScript rendering or a platform-specific adapter."
      });
    }

    return send(res, 200, {
      product: {
        id: crypto.randomUUID(),
        sourceUrl: parsed.toString(),
        sourcePlatform: parsed.hostname.includes("myshopify.com") ? "Shopify" : "Generic",
        status: "draft",
        ...product
      },
      warnings: [
        "Extraction uses Product JSON-LD first, then OpenGraph/meta fallbacks. JavaScript-only or protected pages may still require browser rendering or a platform-specific adapter."
      ]
    });
  } catch (error) {
    console.error("[extract] error:", error);
    const message = error instanceof Error
      ? (error.name === "AbortError" ? "The source took too long to respond." : error.message)
      : "Extraction failed.";
    return send(res, 500, { error: message });
  }
}

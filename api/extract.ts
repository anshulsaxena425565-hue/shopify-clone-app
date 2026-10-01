import { extractJsonLd, extractMetadataProduct } from "./_lib/jsonld";

export const runtime = "nodejs";
export const maxDuration = 30;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }
  });
}

export function GET() {
  return json({ ok: true, service: "product-extractor" });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const url = body && typeof body === "object" && "url" in body ? body.url : undefined;
    if (typeof url !== "string") return json({ error: "A product URL is required." }, 400);

    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return json({ error: "Only HTTP(S) URLs are supported." }, 400);
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20_000);

    let response: Response;
    try {
      response = await fetch(parsed.toString(), {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; ProductCloneBot/1.0; +https://example.com/bot)",
          "Accept": "text/html,application/xhtml+xml"
        },
        redirect: "follow",
        signal: controller.signal
      });
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) return json({ error: `Source returned HTTP ${response.status}.` }, 502);

    const html = await response.text();
    const product =
      extractJsonLd(html, parsed.toString()) ||
      extractMetadataProduct(html, parsed.toString());

    if (!product) {
      return json({
        error: "No product data was found. This source may require JavaScript rendering or a platform-specific adapter."
      }, 422);
    }

    return json({
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
    const message = error instanceof Error
      ? (error.name === "AbortError" ? "The source took too long to respond." : error.message)
      : "Extraction failed.";
    console.error("[extract] error:", error);
    return json({ error: message }, 500);
  }
}

import { extractJsonLd, extractMetadataProduct } from "./_lib/jsonld";

function json(body: unknown, status=200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  try {
    const { url } = await request.json();
    if (typeof url !== "string") return json({ error: "A product URL is required." }, 400);
    const parsed = new URL(url);
    if (!["http:","https:"].includes(parsed.protocol)) return json({ error: "Only HTTP(S) URLs are supported." }, 400);

    const response = await fetch(parsed.toString(), {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; ProductCloneBot/1.0; +https://example.com/bot)" },
      redirect: "follow"
    });
    if (!response.ok) return json({ error: `Source returned HTTP ${response.status}.` }, 502);

    const html = await response.text();
    const product = extractJsonLd(html, parsed.toString()) || extractMetadataProduct(html, parsed.toString());
    if (!product) return json({ error: "No Product JSON-LD was found. This source may require a platform-specific adapter or browser rendering." }, 422);

    return json({
      product: { id: crypto.randomUUID(), sourceUrl: parsed.toString(), sourcePlatform: parsed.hostname.includes("myshopify.com") ? "Shopify" : "Generic", status:"draft", ...product },
      warnings: ["Extraction uses Product JSON-LD first, then OpenGraph/meta fallbacks. JavaScript-only or protected pages may still require browser rendering or a platform-specific adapter."]
    });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Extraction failed." }, 500);
  }
}
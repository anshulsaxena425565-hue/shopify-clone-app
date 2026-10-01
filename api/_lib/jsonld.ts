export interface ExtractedProduct {
  title: string;
  description: string;
  vendor: string;
  productType: string;
  price: number;
  compareAtPrice?: number;
  currency: string;
  images: { id: string; src: string; alt: string }[];
  variants: { id: string; title: string; sku: string; price: number; compareAtPrice?: number; inventory: number; options: Record<string,string> }[];
  tags: string[];
  handle: string;
}

function first<T>(value: T | T[] | undefined): T | undefined { return Array.isArray(value) ? value[0] : value; }
function asNumber(value: unknown) { const n = Number(value); return Number.isFinite(n) ? n : 0; }

export function extractJsonLd(html: string, sourceUrl: string): ExtractedProduct | null {
  const blocks = [...html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)].map(m => m[1].trim());
  const objects: any[] = [];
  for (const block of blocks) {
    try { const parsed = JSON.parse(block); if (Array.isArray(parsed)) objects.push(...parsed); else if (parsed["@graph"]) objects.push(...parsed["@graph"]); else objects.push(parsed); } catch {}
  }
  const item = objects.find(o => {
    const type = first(o?.["@type"]);
    return type === "Product" || type === "ProductGroup";
  });
  if (!item) return null;

  const offers = first(item.offers);
  const imageValues = Array.isArray(item.image) ? item.image : item.image ? [item.image] : [];
  const images = imageValues.map((src: any, i: number) => ({
    id: `img-${i}`, src: typeof src === "string" ? src : src?.url, alt: item.name || "Product image"
  })).filter((x: any) => x.src);

  const variants = Array.isArray(item.hasVariant) ? item.hasVariant.map((v: any, i: number) => {
    const offer = first(v.offers);
    return {
      id: `variant-${i}`, title: v.name || "Default", sku: v.sku || "",
      price: asNumber(offer?.price), compareAtPrice: undefined, inventory: 0,
      options: Object.fromEntries((v.variesBy || []).map((key: string, j: number) => [key, String(v[key] || v.name || `Option ${j+1}`)]))
    };
  }) : [];

  const price = asNumber(offers?.price ?? item.price);
  const currency = String(offers?.priceCurrency ?? item.priceCurrency ?? "INR").toUpperCase();
  const handle = new URL(sourceUrl).pathname.split("/").filter(Boolean).pop() || item.name?.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");

  return {
    title: item.name || "", description: typeof item.description === "string" ? item.description.replace(/<[^>]*>/g, " ").replace(/\s+/g," ").trim() : "",
    vendor: item.brand?.name || "", productType: first(item.category) || "", price, currency,
    images, variants: variants.length ? variants : [{ id:"default", title:"Default", sku:item.sku || "", price, inventory:0, options:{} }],
    tags: [], handle
  };
}
export function extractMetadataProduct(html: string, sourceUrl: string): ExtractedProduct | null {
  const meta = (name: string) => {
    const escaped = name.replace(/[.*+?^{}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`<meta[^>]+(?:property|name)=[\"']${escaped}[\"'][^>]+content=[\"']([^\"']*)[\"'][^>]*>`, "i");
    const alt = new RegExp(`<meta[^>]+content=[\"']([^\"']*)[\"'][^>]+(?:property|name)=[\"']${escaped}[\"'][^>]*>`, "i");
    return re.exec(html)?.[1] || alt.exec(html)?.[1] || "";
  };
  const title = meta("og:title") || meta("twitter:title") || /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1]?.trim() || "";
  const description = meta("og:description") || meta("description");
  const image = meta("og:image") || meta("twitter:image");
  const currency = (meta("product:price:currency") || "INR").toUpperCase();
  const priceMatch = (meta("product:price:amount") || html.match(/(?:₹|INR|USD|\$)\s*([0-9][0-9,]*(?:\.[0-9]+)?)/i)?.[1] || "").replace(/,/g, "");
  const price = asNumber(priceMatch);
  if (!title && !description && !image && !price) return null;
  const handle = new URL(sourceUrl).pathname.split("/").filter(Boolean).pop() || title.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
  return {
    title,
    description: description || "",
    vendor: "",
    productType: "",
    price,
    currency,
    images: image ? [{ id: "meta-image", src: image, alt: title || "Product image" }] : [],
    variants: [{ id: "default", title: "Default", sku: "", price, inventory: 0, options: {} }],
    tags: [],
    handle
  };
}

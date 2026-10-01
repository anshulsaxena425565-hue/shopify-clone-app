import type { ExtractionResult, Product } from "../../types/product";

function detectPlatform(url: string): Product["sourcePlatform"] {
  const host = new URL(url).hostname.toLowerCase();
  if (host.includes("shopify") || host.includes("myshopify")) return "Shopify";
  if (host.includes("woocommerce") || host.includes("wordpress")) return "WooCommerce";
  return "Generic";
}

export async function demoProductFromUrl(url: string): Promise<ExtractionResult> {
  await new Promise((resolve) => setTimeout(resolve, 900));

  const sourcePlatform = detectPlatform(url);
  const product: Product = {
    id: crypto.randomUUID(),
    sourceUrl: url,
    sourcePlatform,
    title: "Essential Cotton Oversized Shirt",
    description: "A relaxed everyday shirt with a clean silhouette, soft cotton construction and an easy oversized fit. Designed for versatile styling.",
    vendor: "Demo Source Store",
    productType: "Shirts",
    status: "draft",
    price: 1499,
    compareAtPrice: 1899,
    currency: "INR",
    handle: "essential-cotton-oversized-shirt",
    inventory: 42,
    tags: ["shirt", "cotton", "oversized", "everyday"],
    options: ["Color", "Size"],
    images: [
      { id: "img-1", src: "https://images.unsplash.com/photo-1603252110481-7ba873bf42ab?auto=format&fit=crop&w=900&q=85", alt: "White cotton shirt" },
      { id: "img-2", src: "https://images.unsplash.com/photo-1596755389378-c31d21fd1273?auto=format&fit=crop&w=900&q=85", alt: "Cotton shirt detail" },
      { id: "img-3", src: "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=900&q=85", alt: "Shirt styling" }
    ],
    variants: [
      { id: "v1", title: "White / S", sku: "ECS-WHT-S", price: 1499, compareAtPrice: 1899, inventory: 12, options: { Color: "White", Size: "S" } },
      { id: "v2", title: "White / M", sku: "ECS-WHT-M", price: 1499, compareAtPrice: 1899, inventory: 16, options: { Color: "White", Size: "M" } },
      { id: "v3", title: "White / L", sku: "ECS-WHT-L", price: 1499, compareAtPrice: 1899, inventory: 14, options: { Color: "White", Size: "L" } }
    ]
  };

  return {
    product,
    warnings: sourcePlatform === "Generic"
      ? ["Generic extraction is simulated in Phase 1. A server-side parser will be required for real stores."]
      : ["Product data is simulated for Phase 1. Real extraction will be connected in Phase 2."]
  };
}
import type { Product } from "../../types/product";

export interface ShopifyCloneResult {
  success: boolean;
  productId?: string;
  title?: string;
  handle?: string;
  adminUrl?: string;
  inventoryNote?: string;
}

export async function cloneProductToShopify(product: Product): Promise<ShopifyCloneResult> {
  const response = await fetch("/api/shopify/clone", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ product })
  });
  const text = await response.text();
  let data: any = {};
  try { data = text ? JSON.parse(text) : {}; } catch {
    throw new Error(response.ok ? "Shopify returned an unexpected response." : `Shopify service error (${response.status}): ${text.slice(0, 240)}`);
  }
  if (!response.ok || !data.success) {
    const detail = Array.isArray(data.details)
      ? data.details.map((item: { message?: string }) => item.message).filter(Boolean).join(" ")
      : "";
    throw new Error([data.error, detail].filter(Boolean).join(" ") || `Clone failed (HTTP ${response.status}).`);
  }
  return data as ShopifyCloneResult;
}
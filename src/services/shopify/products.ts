import type { Product } from "../../types/product";

export interface ShopifyCloneResult {
  success: boolean;
  productId?: string;
  adminUrl?: string;
}

export async function cloneProductToShopify(product: Product): Promise<ShopifyCloneResult> {
  await new Promise((resolve) => setTimeout(resolve, 1100));
  return { success: true, productId: `phase1-${product.id.slice(0, 8)}`, adminUrl: "#" };
}
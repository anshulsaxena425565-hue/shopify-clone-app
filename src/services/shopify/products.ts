import type { Product } from "../../types/product";

export interface ShopifyCloneResult {
  success: boolean;
  productId?: string;
  adminUrl?: string;
}

export async function cloneProductToShopify(product: Product): Promise<ShopifyCloneResult> {
  const shop = window.prompt("Enter your connected Shopify store domain (example.myshopify.com):")?.trim();
  const token = window.prompt("Development access token:")?.trim();
  if (!shop || !token) throw new Error("Shopify store and access token are required.");
  const response = await fetch("/api/shopify/clone", {
    method:"POST",
    headers:{"Content-Type":"application/json","Authorization":`Bearer ${token}`},
    body:JSON.stringify({shop,product})
  });
  const data=await response.json();
  if (!response.ok || !data.success) throw new Error(data.error || "Shopify clone failed.");
  return {success:true,productId:data.productId};
}
import type { Product } from "../../types/product";

export interface ShopifyCloneResult { success:boolean; productId?:string; adminUrl?:string; }

export async function cloneProductToShopify(product:Product):Promise<ShopifyCloneResult>{
  const response=await fetch("/api/shopify/clone",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({product})});
  const data=await response.json();
  if(!response.ok||!data.success) throw new Error(data.error||"Shopify clone failed.");
  return data;
}
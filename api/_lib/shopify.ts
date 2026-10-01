const SHOPIFY_API_VERSION = process.env.SHOPIFY_API_VERSION || "2026-07";

export function getShopDomain(raw: string) {
  const shop = raw.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/$/, "");
  if (!/^[a-z0-9][a-z0-9-]*\.myshopify\.com$/.test(shop)) throw new Error("Invalid Shopify shop domain.");
  return shop;
}

export async function shopifyGraphql<T>(shop: string, accessToken: string, query: string, variables?: Record<string, unknown>) {
  const response = await fetch(`https://${getShopDomain(shop)}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": accessToken },
    body: JSON.stringify({ query, variables })
  });
  const json = await response.json();
  if (!response.ok) throw new Error(json?.errors?.[0]?.message || `Shopify API returned ${response.status}.`);
  if (json.errors?.length) throw new Error(json.errors.map((e: {message:string}) => e.message).join("; "));
  return json.data as T;
}

export function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing server environment variable: ${name}`);
  return value;
}
import { getShopDomain, requireEnv } from "../_lib/shopify";
import { cookie, seal } from "../_lib/session";

export default async function handler(request: Request) {
  try {
    const url = new URL(request.url);
    const shop = getShopDomain(url.searchParams.get("shop") || "");
    const clientId = requireEnv("SHOPIFY_CLIENT_ID");
    const redirectUri = `${url.origin}/api/shopify/callback`;
    const scopes = (process.env.SHOPIFY_SCOPES || "write_products,read_products")
      .split(",")
      .map(scope => scope.trim())
      .filter(Boolean)
      .join(",");

    const state = crypto.randomUUID();
    const auth = new URL(`https://${shop}/admin/oauth/authorize`);
    auth.searchParams.set("client_id", clientId);
    auth.searchParams.set("scope", scopes);
    auth.searchParams.set("redirect_uri", redirectUri);
    auth.searchParams.set("state", state);

    const stateCookie = await seal({ state, shop, createdAt: Date.now() });
    return new Response(null, {
      status: 302,
      headers: {
        Location: auth.toString(),
        "Set-Cookie": cookie("shopify_oauth_state", stateCookie, 600, url.protocol === "https:")
      }
    });
  } catch (error) {
    return new Response(
      error instanceof Error ? error.message : "Shopify install failed.",
      { status: 400 }
    );
  }
}

import { requireEnv } from "../_lib/shopify";
import { cookie, seal } from "../_lib/session";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const shop = url.searchParams.get("shop");
    if (!shop) return new Response("Missing ?shop=your-store.myshopify.com", { status: 400 });
    const clientId = requireEnv("SHOPIFY_CLIENT_ID");
    const redirectUri = `${url.origin}/api/shopify/callback`;
    const scopes = process.env.SHOPIFY_SCOPES || "write_products,read_products";
    const state = crypto.randomUUID();
    const auth = new URL(`https://${shop}/admin/oauth/authorize`);
    auth.searchParams.set("client_id", clientId);
    auth.searchParams.set("scope", scopes);
    auth.searchParams.set("redirect_uri", redirectUri);
    auth.searchParams.set("state", state);
    const stateCookie=await seal({state,shop,createdAt:Date.now()});
    return new Response(null,{status:302,headers:{
      Location:auth.toString(),
      "Set-Cookie":cookie("shopify_oauth_state",stateCookie,600)
    }});
  } catch (error) {
    return new Response(error instanceof Error ? error.message : "Shopify install failed.", { status: 500 });
  }
}
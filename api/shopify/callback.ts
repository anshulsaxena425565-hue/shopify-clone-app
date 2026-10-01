import { getShopDomain, requireEnv } from "../_lib/shopify";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const shop = getShopDomain(url.searchParams.get("shop") || "");
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    if (!code || !state) return new Response("Missing Shopify OAuth parameters.", { status: 400 });

    // Production hardening: persist the state in a signed, short-lived cookie/session
    // before redirecting to Shopify, then compare it here to prevent CSRF.
    const clientId = requireEnv("SHOPIFY_CLIENT_ID");
    const clientSecret = requireEnv("SHOPIFY_CLIENT_SECRET");
    const tokenResponse = await fetch(`https://${shop}/admin/oauth/access_token`, {
      method:"POST", headers:{"Content-Type":"application/json"},
      body:JSON.stringify({client_id:clientId,client_secret:clientSecret,code})
    });
    const token = await tokenResponse.json();
    if (!tokenResponse.ok || !token.access_token) return new Response("Shopify token exchange failed.", { status: 502 });

    // Do not put the access token in the URL or browser storage.
    // Connect this result to a server-side encrypted session/database in the next step.
    return new Response(`Shopify connected for ${shop}. Store the token server-side before enabling cloning.`, {
      status:200, headers:{"Content-Type":"text/plain","Cache-Control":"no-store"}
    });
  } catch (error) { return new Response(error instanceof Error ? error.message : "Shopify callback failed.", { status:500 }); }
}
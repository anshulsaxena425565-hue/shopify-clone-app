import { getShopDomain, requireEnv } from "../_lib/shopify";
import { cookie, readCookie, seal, unseal } from "../_lib/session";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const shop = getShopDomain(url.searchParams.get("shop") || "");
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const stored = await unseal<{state:string;shop:string;createdAt:number}>(readCookie(request,"shopify_oauth_state")||"");
    if (!code || !state || !stored || stored.state !== state || stored.shop !== shop || Date.now()-stored.createdAt>10*60*1000) {
      return new Response("Invalid or expired Shopify OAuth state.", { status: 400 });
    }

    const clientId = requireEnv("SHOPIFY_CLIENT_ID");
    const clientSecret = requireEnv("SHOPIFY_CLIENT_SECRET");
    const tokenResponse = await fetch(`https://${shop}/admin/oauth/access_token`, {
      method:"POST", headers:{"Content-Type":"application/json"},
      body:JSON.stringify({client_id:clientId,client_secret:clientSecret,code})
    });
    const token = await tokenResponse.json();
    if (!tokenResponse.ok || !token.access_token) return new Response("Shopify token exchange failed.", { status: 502 });

    const session=await seal({shop,accessToken:token.access_token});
    const appOrigin=url.origin;
    return new Response(null,{status:302,headers:{
      Location:`${appOrigin}/?shopify=connected`,
      "Set-Cookie":[`shopify_session=${session}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000`,"shopify_oauth_state=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0"].join(", ")
    }});
  } catch (error) { return new Response(error instanceof Error ? error.message : "Shopify callback failed.", { status:500 }); }
}
import { readCookie, unseal } from "../_lib/session";

export async function GET(request: Request) {
  const session=await unseal<{shop:string;accessToken:string}>(readCookie(request,"shopify_session")||"");
  return new Response(JSON.stringify({connected:!!session,shop:session?.shop||null}),{
    headers:{"Content-Type":"application/json","Cache-Control":"no-store"}
  });
}
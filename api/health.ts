function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }
  });
}

export const runtime = "nodejs";
export const maxDuration = 10;

export function GET() {
  return json({
    ok: true,
    service: "product-clone-api",
    runtime: "nodejs"
  });
}

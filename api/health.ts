import type { IncomingMessage, ServerResponse } from "node:http";

type VercelResponse = ServerResponse & {
  status: (code: number) => VercelResponse;
  json: (body: unknown) => void;
};

export default function handler(_req: IncomingMessage, res: VercelResponse) {
  return res.status(200).json({
    ok: true,
    service: "product-clone-api",
    runtime: process.version
  });
}

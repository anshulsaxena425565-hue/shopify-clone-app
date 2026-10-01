const enc = new TextEncoder();
const dec = new TextDecoder();

function b64(bytes: Uint8Array) {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function bytes(value: string) {
  const s = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = s + "=".repeat((4 - (s.length % 4)) % 4);
  const raw = atob(padded);
  return Uint8Array.from(raw, c => c.charCodeAt(0));
}

async function key() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET must be at least 32 characters.");
  }
  const digest = await crypto.subtle.digest("SHA-256", enc.encode(secret));
  return crypto.subtle.importKey("raw", digest, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
}

export async function seal(value: unknown) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    await key(),
    enc.encode(JSON.stringify(value))
  );
  return `${b64(iv)}.${b64(new Uint8Array(ciphertext))}`;
}

export async function unseal<T>(value: string): Promise<T | null> {
  try {
    const [iv, ciphertext] = value.split(".");
    if (!iv || !ciphertext) return null;
    const plain = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: bytes(iv) },
      await key(),
      bytes(ciphertext)
    );
    return JSON.parse(dec.decode(plain)) as T;
  } catch {
    return null;
  }
}

export function cookie(name: string, value: string, maxAge: number, secure = true) {
  return [
    `${name}=${value}`,
    "Path=/",
    "HttpOnly",
    secure ? "Secure" : "",
    "SameSite=Lax",
    `Max-Age=${maxAge}`
  ].filter(Boolean).join("; ");
}

export function readCookie(request: Request, name: string) {
  const header = request.headers.get("cookie") || "";
  return header
    .split(";")
    .map(v => v.trim())
    .find(v => v.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

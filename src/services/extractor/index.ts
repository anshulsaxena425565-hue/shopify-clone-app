import type { ExtractionResult } from "../../types/product";
import { demoProductFromUrl } from "./mockExtractor";

function errorMessage(value: unknown, fallback: string): string {
  if (typeof value === "string" && value.trim()) return value;
  if (value && typeof value === "object") {
    const candidate = value as Record<string, unknown>;
    if (typeof candidate.message === "string" && candidate.message.trim()) return candidate.message;
    if (typeof candidate.error === "string" && candidate.error.trim()) return candidate.error;
    try {
      const serialized = JSON.stringify(value);
      if (serialized && serialized !== "{}") return serialized;
    } catch {}
  }
  return fallback;
}

async function readApiResponse(response: Response): Promise<Record<string, any>> {
  const text = await response.text();
  if (!text.trim()) return {};
  try {
    const data = JSON.parse(text);
    return data && typeof data === "object" ? data : {};
  } catch {
    throw new Error(
      response.ok
        ? "The extraction service returned an unexpected response."
        : `Extraction service error (${response.status}): ${text.slice(0, 240)}`
    );
  }
}

export interface ProductExtractor { extract(url: string): Promise<ExtractionResult>; }

export const extractor: ProductExtractor = {
  async extract(url) {
    try {
      const response = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ url })
      });
      const data = await readApiResponse(response);
      if (!response.ok) {
        throw new Error(errorMessage(data.error, `Extraction failed (HTTP ${response.status}).`));
      }
      if (!data.product) throw new Error("The extraction service returned no product data.");
      return data as ExtractionResult;
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn("Backend extractor unavailable; using demo extractor.", error);
        return demoProductFromUrl(url);
      }
      throw error;
    }
  }
};
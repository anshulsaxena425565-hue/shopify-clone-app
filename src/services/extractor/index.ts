import type { ExtractionResult } from "../../types/product";
import { demoProductFromUrl } from "./mockExtractor";

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
      if (!response.ok) throw new Error(data.error || `Extraction failed (HTTP ${response.status}).`);
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
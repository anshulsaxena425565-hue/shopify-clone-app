import type { ExtractionResult } from "../../types/product";
import { demoProductFromUrl } from "./mockExtractor";

export interface ProductExtractor { extract(url: string): Promise<ExtractionResult>; }

export const extractor: ProductExtractor = {
  async extract(url) {
    try {
      const response = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Extraction failed.");
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
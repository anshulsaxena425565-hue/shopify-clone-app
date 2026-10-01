import type { ExtractionResult } from "../../types/product";
import { demoProductFromUrl } from "./mockExtractor";

export interface ProductExtractor {
  extract(url: string): Promise<ExtractionResult>;
}

export const extractor: ProductExtractor = {
  async extract(url) {
    return demoProductFromUrl(url);
  }
};
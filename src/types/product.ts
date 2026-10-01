export type ProductStatus = "draft" | "active";

export interface ProductImage {
  id: string;
  src: string;
  alt: string;
}

export interface ProductVariant {
  id: string;
  title: string;
  sku: string;
  price: number;
  compareAtPrice?: number;
  inventory: number;
  options: Record<string, string>;
}

export interface Product {
  id: string;
  sourceUrl: string;
  sourcePlatform: "Shopify" | "WooCommerce" | "Generic";
  title: string;
  description: string;
  vendor: string;
  productType: string;
  status: ProductStatus;
  price: number;
  compareAtPrice?: number;
  currency: string;
  images: ProductImage[];
  options: string[];
  variants: ProductVariant[];
  tags: string[];
  handle: string;
  inventory: number;
}

export interface ExtractionResult {
  product: Product;
  warnings: string[];
}
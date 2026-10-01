import { shopifyGraphql } from "../_lib/shopify";
import { readCookie, unseal } from "../_lib/session";

const PRODUCT_SET = `#graphql
mutation ProductSet($input: ProductSetInput!, $synchronous: Boolean!) {
  productSet(input: $input, synchronous: $synchronous) {
    product { id title handle }
    userErrors { field message }
  }
}`;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }
  });
}

function cleanString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export default async function handler(request: Request) {
  try {
    const session = await unseal<{ shop: string; accessToken: string }>(
      readCookie(request, "shopify_session") || ""
    );
    const body = await request.json();
    const product = body?.product;
    const shop = session?.shop;
    const token = session?.accessToken;

    if (!token || !shop) return json({ error: "Connect a Shopify store before cloning." }, 401);
    if (!product || typeof product !== "object") return json({ error: "A product payload is required." }, 400);

    const sourceVariants = Array.isArray(product.variants) && product.variants.length
      ? product.variants
      : [{
          price: product.price,
          compareAtPrice: product.compareAtPrice,
          sku: "",
          title: "Default",
          options: {}
        }];

    const variants = sourceVariants.map((variant: any) => {
      const optionValues = Object.entries(variant.options || {})
        .filter(([optionName, value]) => cleanString(optionName) && cleanString(value))
        .map(([optionName, value]) => ({
          optionName: cleanString(optionName),
          name: cleanString(value)
        }));

      return {
        optionValues: optionValues.length
          ? optionValues
          : [{ optionName: "Title", name: cleanString(variant.title) || "Default Title" }],
        price: String(Number(variant.price) || 0),
        compareAtPrice: variant.compareAtPrice == null ? null : String(Number(variant.compareAtPrice) || 0),
        sku: cleanString(variant.sku) || undefined
      };
    });

    const productOptions = Object.entries(
      sourceVariants.reduce((acc: Record<string, Set<string>>, variant: any) => {
        for (const [name, value] of Object.entries(variant.options || {})) {
          const optionName = cleanString(name);
          const optionValue = cleanString(value);
          if (!optionName || !optionValue) continue;
          acc[optionName] ||= new Set<string>();
          acc[optionName].add(optionValue);
        }
        return acc;
      }, {})
    ).map(([name, values]) => ({
      name,
      values: [...values].map(value => ({ name: value }))
    }));

    const tags = Array.isArray(product.tags)
      ? product.tags.map(cleanString).filter(Boolean)
      : [];

    const files = Array.isArray(product.images)
      ? product.images
          .filter((image: any) => cleanString(image?.src))
          .map((image: any) => ({
            originalSource: cleanString(image.src),
            alt: cleanString(image.alt) || cleanString(product.title) || "Product image",
            contentType: "IMAGE"
          }))
      : [];

    const input: Record<string, unknown> = {
      title: cleanString(product.title),
      descriptionHtml: cleanString(product.description),
      vendor: cleanString(product.vendor) || undefined,
      productType: cleanString(product.productType) || undefined,
      handle: cleanString(product.handle) || undefined,
      status: "DRAFT",
      tags: tags.length ? tags : undefined,
      productOptions: productOptions.length ? productOptions : undefined,
      variants,
      files: files.length ? files : undefined
    };

    const result = await shopifyGraphql<any>(shop, token, PRODUCT_SET, {
      input,
      synchronous: true
    });
    const payload = result.productSet;

    if (payload.userErrors?.length) {
      return json({
        error: "Shopify rejected the product.",
        details: payload.userErrors
      }, 422);
    }

    if (!payload.product?.id) {
      return json({ error: "Shopify did not return a product ID." }, 502);
    }

    return json({
      success: true,
      productId: payload.product.id,
      title: payload.product.title,
      handle: payload.product.handle,
      adminUrl: `https://${shop}/admin/products/${payload.product.id.split("/").pop()}`,
      inventoryNote: "Inventory quantities are not written because Shopify inventory requires a destination location ID."
    });
  } catch (error) {
    return json({
      error: error instanceof Error ? error.message : "Shopify clone failed."
    }, 500);
  }
}

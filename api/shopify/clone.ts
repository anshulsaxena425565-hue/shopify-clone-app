import { shopifyGraphql } from "../_lib/shopify";

const PRODUCT_SET = `#graphql
mutation ProductSet($input: ProductSetInput!, $synchronous: Boolean!) {
  productSet(input: $input, synchronous: $synchronous) {
    product { id title }
    userErrors { field message }
  }
}`;

function json(body: unknown, status=200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  try {
    const auth = request.headers.get("authorization") || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
    const { shop, product } = await request.json();
    if (!token || !shop || !product) return json({ error:"Missing Shopify credentials or product." }, 401);

    const variants = (product.variants?.length ? product.variants : [{
      price: product.price, compareAtPrice: product.compareAtPrice, options: {}
    }]).map((v:any) => ({
      optionValues: Object.entries(v.options || {}).map(([optionName, name]) => ({ optionName, name: String(name) })),
      price: String(v.price),
      compareAtPrice: v.compareAtPrice == null ? null : String(v.compareAtPrice)
    }));

    const productOptions = Object.entries(
      (product.variants || []).reduce((acc:any, v:any) => {
        for (const [name,value] of Object.entries(v.options || {})) {
          acc[name] ||= new Set<string>();
          acc[name].add(String(value));
        }
        return acc;
      }, {})
    ).map(([name, values]:any) => ({ name, values: [...values].map((value:string) => ({ name:value })) }));

    const media = (product.images || []).filter((x:any)=>x.src).map((x:any)=>({
      originalSource:x.src, alt:x.alt || product.title, mediaContentType:"IMAGE"
    }));

    const input:any = {
      title:product.title,
      descriptionHtml:product.description,
      vendor:product.vendor,
      productType:product.productType,
      handle:product.handle || undefined,
      status:"DRAFT",
      productOptions: productOptions.length ? productOptions : undefined,
      variants,
      files: media.map((m:any)=>({ originalSource:m.originalSource, alt:m.alt, contentType:"IMAGE" }))
    };

    const result=await shopifyGraphql<any>(shop,token,PRODUCT_SET,{input,synchronous:true});
    const payload=result.productSet;
    if (payload.userErrors?.length) return json({error:payload.userErrors},422);
    if (!payload.product?.id) return json({error:"Shopify did not return a product ID."},502);

    return json({
      success:true,
      productId:payload.product.id,
      title:payload.product.title,
      adminUrl:`https://${shop}/admin/products/${payload.product.id.split("/").pop()}`
    });
  } catch(error) {
    return json({error:error instanceof Error ? error.message : "Shopify clone failed."},500);
  }
}
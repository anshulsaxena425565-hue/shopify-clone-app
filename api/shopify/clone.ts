import { shopifyGraphql } from "../_lib/shopify";

const PRODUCT_CREATE = `#graphql
mutation ProductCreate($product: ProductCreateInput!, $media: [CreateMediaInput!]) {
  productCreate(product: $product, media: $media) {
    product { id title }
    userErrors { field message }
  }
}`;

const VARIANTS_BULK_CREATE = `#graphql
mutation ProductVariantsBulkCreate($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
  productVariantsBulkCreate(productId: $productId, variants: $variants) {
    productVariants { id title }
    userErrors { field message }
  }
}`;

function json(body: unknown, status=200) { return new Response(JSON.stringify(body), {status,headers:{"Content-Type":"application/json","Cache-Control":"no-store"}}); }

export async function POST(request: Request) {
  try {
    const auth = request.headers.get("authorization") || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
    const { shop, product } = await request.json();
    if (!token || !shop || !product) return json({error:"Missing Shopify credentials or product."},401);

    const media = (product.images || []).filter((x:any)=>x.src).map((x:any)=>({originalSource:x.src,alt:x.alt || product.title,mediaContentType:"IMAGE"}));
    const created = await shopifyGraphql<any>(shop, token, PRODUCT_CREATE, {
      product: { title:product.title, descriptionHtml:product.description, vendor:product.vendor, productType:product.productType, status:"DRAFT", productOptions:[] },
      media
    });
    const payload = created.productCreate;
    if (payload.userErrors?.length) return json({error:payload.userErrors},422);
    if (!payload.product?.id) return json({error:"Shopify did not return a product ID."},502);

    const variants = (product.variants || []).map((v:any)=>({
      price:String(v.price),
      inventoryQuantities:[],
      optionValues: Object.entries(v.options || {}).map(([name,value])=>({optionName:name,name:String(value)}))
    })).filter((v:any)=>v.optionValues.length);

    let variantResult=null;
    if (variants.length) {
      const result=await shopifyGraphql<any>(shop,token,VARIANTS_BULK_CREATE,{productId:payload.product.id,variants});
      variantResult=result.productVariantsBulkCreate;
      if (variantResult.userErrors?.length) return json({error:variantResult.userErrors,productId:payload.product.id},422);
    }

    return json({success:true,productId:payload.product.id,title:payload.product.title,variants:variantResult?.productVariants?.length || 0});
  } catch(error) { return json({error:error instanceof Error?error.message:"Shopify clone failed."},500); }
}
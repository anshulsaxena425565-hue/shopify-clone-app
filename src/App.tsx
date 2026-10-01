import { useMemo, useState } from "react";
import { ArrowLeft, Check, ChevronRight, ClipboardPaste, ExternalLink, Image as ImageIcon, Link2, LoaderCircle, Package, Plus, Search, ShoppingBag, Sparkles, Store, Tag, Trash2, Upload, X } from "lucide-react";
import type { Product, ProductImage, ProductVariant } from "./types/product";
import { extractor } from "./services/extractor";
import { cloneProductToShopify } from "./services/shopify/products";

type Step = "import" | "review" | "done";
const demoUrl = "https://demo-store.com/products/essential-cotton-oversized-shirt";

export default function App() {
  const [step, setStep] = useState<Step>("import");
  const [url, setUrl] = useState("");
  const [product, setProduct] = useState<Product | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [cloning, setCloning] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const showToast = (message: string) => { setToast(message); window.setTimeout(() => setToast(""), 2800); };

  const importProduct = async () => {
    setError("");
    let normalized = url.trim();
    if (!normalized) return setError("Paste a product URL to continue.");
    if (!/^https?:\/\/.+/i.test(normalized)) { normalized = `https://${normalized}`; setUrl(normalized); }
    try { new URL(normalized); } catch { return setError("That doesn't look like a valid product URL."); }
    setLoading(true);
    try { const result = await extractor.extract(normalized); setProduct(result.product); setWarnings(result.warnings); setStep("review"); }
    catch { setError("We couldn't extract this product. Please check the URL and try again."); }
    finally { setLoading(false); }
  };

  const updateProduct = (patch: Partial<Product>) => setProduct((current) => current ? { ...current, ...patch } : current);
  const updateVariant = (id: string, patch: Partial<ProductVariant>) => setProduct((current) => current ? { ...current, variants: current.variants.map(v => v.id === id ? { ...v, ...patch } : v) } : current);
  const validation = useMemo(() => {
    if (!product) return [];
    const issues: string[] = [];
    if (!product.title.trim()) issues.push("Product title is required.");
    if (!product.description.trim()) issues.push("Description is empty.");
    if (product.price <= 0) issues.push("Price must be greater than 0.");
    if (!product.images.length) issues.push("Add at least one product image.");
    if (!product.variants.length) issues.push("Add at least one variant.");
    return issues;
  }, [product]);

  const clone = async () => {
    if (!product || validation.length) return;
    setCloning(true);
    try { const result = await cloneProductToShopify(product); if (result.success) { setStep("done"); showToast("Product cloned successfully."); } }
    catch (error) { setError(error instanceof Error ? error.message : "Clone failed."); }
    finally { setCloning(false); }
  };
  const reset = () => { setStep("import"); setProduct(null); setWarnings([]); setError(""); setUrl(""); };

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark"><ShoppingBag size={19} /></div><div><strong>Product Clone</strong><span>Phase 1</span></div></div>
      <nav><div className="nav-label">Workspace</div><button className="nav-item active"><Plus size={17} /> Clone product</button><button className="nav-item muted"><Package size={17} /> Clone history</button></nav>
      <div className="sidebar-bottom"><div className="connection-card"><div className="connection-icon"><Store size={17} /></div><div><span>Destination store</span><strong>Not connected</strong></div><ChevronRight size={15} /></div><p>Shopify connection comes in Phase 2.</p></div>
    </aside>
    <main className="main">
      <header className="topbar"><div><div className="eyebrow">PRODUCT CLONER</div><h1>{step === "import" ? "Clone a product" : step === "review" ? "Review product" : "Product cloned"}</h1></div>{step !== "import" && <button className="secondary-btn" onClick={reset}><ArrowLeft size={16} /> New clone</button>}</header>
      <div className="content">
        {step === "import" && <ImportScreen url={url} setUrl={setUrl} loading={loading} error={error} onImport={importProduct} onDemo={() => setUrl(demoUrl)} />}
        {step === "review" && product && <ReviewScreen product={product} warnings={warnings} validation={validation} cloning={cloning} updateProduct={updateProduct} updateVariant={updateVariant} onClone={clone} />}
        {step === "done" && product && <DoneScreen product={product} onReset={reset} />}
      </div>
    </main>
    {toast && <div className="toast"><Check size={17} /> {toast}</div>}
  </div>;
}

function ImportScreen({url,setUrl,loading,error,onImport,onDemo}:{url:string;setUrl:(v:string)=>void;loading:boolean;error:string;onImport:()=>void;onDemo:()=>void}) {
  return <section className="import-wrap">
    <div className="hero-icon"><Sparkles size={25}/></div><div className="hero-copy"><h2>Bring a product into your store</h2><p>Paste a public product link. We'll extract the product details and prepare them for review.</p></div>
    <div className="import-card"><label>Product URL</label><div className={`url-input ${error ? "invalid":""}`}><Link2 size={18}/><input value={url} onChange={e=>setUrl(e.target.value)} onKeyDown={e=>e.key==="Enter"&&onImport()} placeholder="https://example.com/products/product-name"/>{url&&<button className="clear-input" onClick={()=>setUrl("")}><X size={15}/></button>}</div>{error&&<div className="field-error">{error}</div>}<button className="primary-btn import-btn" onClick={onImport} disabled={loading}>{loading?<><LoaderCircle className="spin" size={17}/> Extracting product…</>:<><Search size={17}/> Extract product</>}</button><button className="demo-link" onClick={onDemo}>Use a demo product</button></div>
    <div className="how-card"><How n="1" title="Paste" sub="Public product URL"/><ChevronRight className="how-arrow" size={16}/><How n="2" title="Review" sub="Edit before cloning"/><ChevronRight className="how-arrow" size={16}/><How n="3" title="Clone" sub="Send to your store"/></div>
    <div className="notice"><ClipboardPaste size={17}/><div><strong>Phase 1 demo</strong><p>The extractor is simulated so the whole UI can be tested now. Real server-side extraction comes next.</p></div></div>
  </section>;
}
function How({n,title,sub}:{n:string;title:string;sub:string}) { return <div className="how-step"><span>{n}</span><div><strong>{title}</strong><small>{sub}</small></div></div>; }

function ReviewScreen({product,warnings,validation,cloning,updateProduct,updateVariant,onClone}:{product:Product;warnings:string[];validation:string[];cloning:boolean;updateProduct:(p:Partial<Product>)=>void;updateVariant:(id:string,p:Partial<ProductVariant>)=>void;onClone:()=>void}) {
  const addImage=()=>{const src=window.prompt("Paste an image URL");if(src) updateProduct({images:[...product.images,{id:crypto.randomUUID(),src,alt:product.title}]});};
  const removeImage=(id:string)=>updateProduct({images:product.images.filter(i=>i.id!==id)});
  const addVariant=()=>updateProduct({variants:[...product.variants,{id:crypto.randomUUID(),title:"New variant",sku:"",price:product.price,compareAtPrice:product.compareAtPrice,inventory:0,options:{}}]});
  const removeVariant=(id:string)=>updateProduct({variants:product.variants.filter(v=>v.id!==id)});
  return <>
    <div className="source-strip"><div className="source-left"><span className="source-dot"/><span>Imported from</span><strong>{product.sourcePlatform}</strong></div><a href={product.sourceUrl} target="_blank" rel="noreferrer">View source <ExternalLink size={13}/></a></div>
    {warnings.map(w=><div className="warning" key={w}><Sparkles size={16}/>{w}</div>)}
    <div className="review-grid">
      <section className="panel"><div className="panel-head"><div><h3>Product information</h3><p>Review the content before cloning.</p></div></div><div className="form-grid">
        <Field label="Title" value={product.title} onChange={v=>updateProduct({title:v})} wide/><Field label="Vendor" value={product.vendor} onChange={v=>updateProduct({vendor:v})}/><Field label="Product type" value={product.productType} onChange={v=>updateProduct({productType:v})}/><Field label="Handle" value={product.handle} onChange={v=>updateProduct({handle:v})}/>
        <div className="field wide"><label>Description</label><textarea value={product.description} onChange={e=>updateProduct({description:e.target.value})} rows={7}/></div>
        <Field label="Tags" value={product.tags.join(", ")} onChange={v=>updateProduct({tags:v.split(",").map(t=>t.trim()).filter(Boolean)})} wide hint="Separate tags with commas."/>
      </div></section>
      <section className="panel"><div className="panel-head"><div><h3>Pricing</h3><p>Base product pricing for the clone.</p></div></div><div className="form-grid"><NumberField label="Price" value={product.price} onChange={v=>updateProduct({price:v})}/><NumberField label="Compare-at price" value={product.compareAtPrice??0} onChange={v=>updateProduct({compareAtPrice:v||undefined})}/><Field label="Currency" value={product.currency} onChange={v=>updateProduct({currency:v.toUpperCase()})}/><NumberField label="Inventory" value={product.inventory} onChange={v=>updateProduct({inventory:v})}/></div></section>
      <section className="panel wide-panel"><div className="panel-head"><div><h3>Product media</h3><p>Images that will be copied into the destination product.</p></div><button className="secondary-btn small" onClick={addImage}><Upload size={15}/> Add image</button></div><div className="image-grid">{product.images.map(image=><div className="image-card" key={image.id}><img src={image.src} alt={image.alt}/><button onClick={()=>removeImage(image.id)} aria-label="Remove image"><Trash2 size={15}/></button></div>)}{!product.images.length&&<div className="empty-media"><ImageIcon size={22}/><span>No images added</span></div>}</div></section>
      <section className="panel wide-panel"><div className="panel-head"><div><h3>Variants</h3><p>{product.variants.length} variant{product.variants.length===1?"":"s"} detected.</p></div><button className="secondary-btn small" onClick={addVariant}><Plus size={15}/> Add variant</button></div><div className="variant-table-wrap"><table><thead><tr><th>Variant</th><th>SKU</th><th>Price</th><th>Compare-at</th><th>Inventory</th><th/></tr></thead><tbody>{product.variants.map(v=><tr key={v.id}><td><input value={v.title} onChange={e=>updateVariant(v.id,{title:e.target.value})}/></td><td><input value={v.sku} onChange={e=>updateVariant(v.id,{sku:e.target.value})}/></td><td><input type="number" min="0" value={v.price} onChange={e=>updateVariant(v.id,{price:Number(e.target.value)})}/></td><td><input type="number" min="0" value={v.compareAtPrice??""} onChange={e=>updateVariant(v.id,{compareAtPrice:Number(e.target.value)||undefined})}/></td><td><input type="number" min="0" value={v.inventory} onChange={e=>updateVariant(v.id,{inventory:Number(e.target.value)})}/></td><td><button className="icon-btn danger" onClick={()=>removeVariant(v.id)}><Trash2 size={15}/></button></td></tr>)}</tbody></table></div></section>
    </div>
    <div className="clone-bar"><div>{validation.length?<><strong className="danger-text">Needs attention</strong><span>{validation.join(" ")}</span></>:<><strong>Ready to clone</strong><span>Product data has passed the basic Phase 1 checks.</span></>}</div><button className="primary-btn clone-btn" disabled={!!validation.length||cloning} onClick={onClone}>{cloning?<><LoaderCircle className="spin" size={17}/> Cloning…</>:<><Sparkles size={17}/> Clone product</>}</button></div>
  </>;
}

function DoneScreen({product,onReset}:{product:Product;onReset:()=>void}) {
  return <section className="done-wrap"><div className="success-icon"><Check size={29}/></div><h2>Product ready to be cloned</h2><p><strong>{product.title}</strong> passed the Phase 1 clone flow.</p><div className="done-card"><div><Package size={20}/><span>Destination</span><strong>Shopify store connection — Phase 2</strong></div><div><Tag size={20}/><span>Variants</span><strong>{product.variants.length}</strong></div><div><ImageIcon size={20}/><span>Images</span><strong>{product.images.length}</strong></div></div><div className="phase2-note"><Sparkles size={17}/><div><strong>Next: Shopify Partner integration</strong><p>We'll replace the simulated clone service with Shopify OAuth and the Admin GraphQL API.</p></div></div><button className="primary-btn" onClick={onReset}><Plus size={17}/> Clone another product</button></section>;
}
function Field({label,value,onChange,wide=false,hint}:{label:string;value:string;onChange:(v:string)=>void;wide?:boolean;hint?:string}) { return <div className={`field ${wide?"wide":""}`}><label>{label}</label><input value={value} onChange={e=>onChange(e.target.value)}/>{hint&&<small>{hint}</small>}</div>; }
function NumberField({label,value,onChange}:{label:string;value:number;onChange:(v:number)=>void}) { return <div className="field"><label>{label}</label><input type="number" min="0" value={value} onChange={e=>onChange(Number(e.target.value))}/></div>; }
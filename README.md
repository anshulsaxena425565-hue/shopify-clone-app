# Product Clone App

A React + TypeScript Phase 1 prototype for importing public product-page data, reviewing/editing it, and preparing it for cloning into a Shopify store.

## Phase 1

- Paste a product URL
- Detect source platform (demo detector)
- Fetch product using a replaceable extractor service
- Product preview and editor
- Images
- Variants/options
- Pricing
- Inventory
- Tags
- Product validation
- Clone workflow simulation
- Toasts and loading/error states
- Responsive admin-style UI
- Clean service/types separation for later Shopify Partner integration

## Run locally

```bash
npm install
npm run dev
```

## Important

Phase 1 uses a simulated extractor and Shopify clone service. Phase 2 will replace these with a secure server-side extractor and Shopify OAuth + Admin GraphQL API integration.

## Phase 2 — real integration

Phase 2 adds:
- Server-side Product JSON-LD extraction at `/api/extract`
- Shopify OAuth authorization-code flow
- Encrypted HttpOnly Shopify session cookie
- Shopify connection status
- Shopify Admin GraphQL `productSet` cloning for product data, options, variants, and media
- Server-side Shopify access-token handling

### Environment

Copy `.env.example` to your deployment environment and set:

- `SHOPIFY_CLIENT_ID`
- `SHOPIFY_CLIENT_SECRET`
- `SHOPIFY_SCOPES` (default: `write_products,read_products`)
- `SHOPIFY_API_VERSION` (default: `2026-07`)
- `SESSION_SECRET` — a long random secret

Configure the Shopify app redirect URL as:
`https://YOUR_DOMAIN/api/shopify/callback`

The current extractor intentionally handles schema.org Product JSON-LD first. Some JavaScript-rendered, protected, or platform-specific stores will require dedicated adapters or a browser-rendering worker.

For local Vite development, the extractor falls back to the Phase 1 demo extractor when `/api/extract` is unavailable. Deploy the `api/` functions on a serverless platform such as Vercel for the real Phase 2 flow.

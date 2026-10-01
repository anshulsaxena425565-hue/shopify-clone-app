# Product Clone App

A React + TypeScript product-cloning app that imports public product-page data, lets you review/edit it, and clones the approved product into a connected Shopify store.

## Phase 1 — UI foundation

- Product URL input and validation
- Product preview/editor
- Images, variants, pricing, inventory and tags
- Responsive admin-style UI
- Demo extractor and clone workflow

## Phase 2 — real integration

- Server-side Product JSON-LD extraction at `/api/extract`
- Shopify authorization-code OAuth flow
- Encrypted HttpOnly Shopify session cookie
- Shopify connection status
- Shopify Admin GraphQL `productSet` cloning

## Phase 3 — production hardening

- Validated Shopify `myshopify.com` domains before OAuth
- Environment-aware Secure cookies for local HTTPS/HTTP development
- Separate `Set-Cookie` headers on OAuth callback
- Stronger `SESSION_SECRET` requirement
- Shopify variant SKU, options, compare-at pricing and tags mapping
- Real clone success screen with Shopify Admin link
- Human-readable Shopify GraphQL errors
- Explicit inventory limitation when no destination location ID is configured
- Updated production-oriented documentation

## Run locally

```bash
npm install
npm run dev
```

## Environment

Set these server-side environment variables:

- `SHOPIFY_CLIENT_ID`
- `SHOPIFY_CLIENT_SECRET`
- `SHOPIFY_SCOPES` (default: `write_products,read_products`)
- `SHOPIFY_API_VERSION` (default: `2026-07`)
- `SESSION_SECRET` — use a random value of at least 32 characters

Copy `.env.example` as the starting point for local configuration. Never expose the Shopify client secret or session secret in frontend code.

Configure the Shopify app redirect URL as:

`https://YOUR_DOMAIN/api/shopify/callback`

For local HTTP development, the OAuth session cookie is intentionally created without the `Secure` attribute. Production deployments should use HTTPS.

## Shopify API behavior

The app uses the standalone authorization-code grant and sends the resulting access token only from server-side API functions. Shopify's current documentation describes authorization-code grant for apps that run outside the Shopify admin. citeturn0search0turn0search2

The clone endpoint uses `productSet`, which Shopify documents for synchronizing external product catalogs. The mutation requires the `write_products` scope. citeturn0search9turn0search8

Variant SKU, price, compare-at price and option values are mapped through `ProductVariantSetInput`. citeturn1search1

Inventory is not blindly copied because Shopify inventory quantities require a specific destination location ID. citeturn1search5

## Extraction limitation

The current extractor intentionally prioritizes schema.org Product JSON-LD. JavaScript-only, protected, or platform-specific stores can require a dedicated adapter or browser-rendering worker.

For local Vite development, the frontend falls back to the Phase 1 demo extractor only when `/api/extract` is unavailable. Deploy the `api/` functions on a serverless platform such as Vercel for the real flow.


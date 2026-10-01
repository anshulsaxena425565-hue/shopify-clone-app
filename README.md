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

# Boston Baking — Workflow Platform

A discovery-to-manufacturing workflow platform for specialty food manufacturers.
It tracks a customer opportunity from first contact through sample iteration,
pricing, product-spec onboarding, lot-sheet creation, senior-manager approval,
manufacturing, and shipment — with role-based queues, SLA tracking, bidirectional
hand-offs, a cross-role discussion thread, discovery-context autofill, and a
customer-facing portal.

> **Status: front-end prototype.** State is held in a reducer and persisted to
> `localStorage`. There is no backend, real authentication, or multi-tenancy yet —
> those are the next milestones (see *Roadmap*). The seed data is illustrative.

## Getting started

```bash
npm install
npm run dev      # start the dev server (Vite)
npm run build    # production build to dist/
npm run preview  # preview the production build
```

Open the URL Vite prints (default http://localhost:5173).

## Demo accounts

All demo accounts use the password **`bake2026`**. Pick any from the sign-in
screen. Internal roles each see their own queue; customer accounts open the
customer portal.

| Role | Example user |
|------|--------------|
| Sales / Opportunity Owner | Maya Torres |
| Sample Request | Devon Price |
| Sample Creation | Lena Okafor |
| Formulations | Rafi Mehta |
| Pricing | June Castellanos |
| Product Specifications | Ingrid Vasquez |
| Lot Sheet | Theo Lindgren |
| Senior Manager | Priya Raman |
| Manufacturing | Marcus Webb |
| Customer | Elise Moreau, Dana Ricci, Alicia Grant |

## Project structure

```
src/
  constants/     Static domain data (roles, stages, product/industry option sets)
  domain/        Pure logic — dates, seed data, users, workflow rules, autofill, queue
  state/         Reducer, React context, persistence layer
  components/
    common/      Shared UI atoms (Badge, Btn, Field, Panel, ProofingRail, ...)
    auth/        Sign-in screen
    pipeline/    Pipeline list + new-opportunity modal
    actions/     Role-and-stage action panels (the workflow engine's UI)
    detail/      Opportunity detail view + discussion thread
    customer/    Customer portal + customer spec form
    InternalShell.jsx   Internal (staff) app shell
  App.jsx        Root: reducer setup, hydration, role-based routing
  main.jsx       React entry point
```

The layering is deliberate: `constants` and `domain` are framework-free and hold
all business logic; `state` wires the reducer to storage; `components` are the
view. Swapping `state/storage.js` for an API client is the single seam where a
backend attaches.

## Roadmap toward production

1. **Backend + database** — replace `localStorage` persistence with an API and a
   real datastore; move the reducer's authoritative state server-side.
2. **Real authentication** — the current sign-in is a demo credential check.
   Integrate a managed identity provider and enforce roles server-side.
3. **Multi-tenancy** — scope every record to a customer org so the product can
   serve more than one manufacturer.
4. **Integrations** — USDA FoodData Central for nutrition estimates (design-stage
   only, not label-compliant), carrier tracking, transactional email.
5. **Generalize the demo** — the seed data and branding are specific to one
   prospect; neutralize before any public showcase.

## License

See [LICENSE](./LICENSE).

# CourierPro — Courier & Logistics Management (Frontend Prototype)

A frontend-only React prototype of a courier and logistics platform with four portals: **Customer**, **Admin**, **Branch / Hub Staff** and **Driver / Rider**.

> **Frontend only.** There is no backend, database, authentication or external integration. All data is realistic sample data generated in the browser and persisted to LocalStorage. No real payments, deliveries, SMS, GPS or notifications ever take place. The backend is planned in NestJS for a later phase.

## Tech stack

| Area | Choice |
| --- | --- |
| Framework | React 19 + TypeScript, Vite |
| Styling | Tailwind CSS v4, shadcn-style components on Radix UI primitives |
| Icons | Lucide React |
| Routing | React Router 7 (code-split per page) |
| Forms | React Hook Form + Zod |
| Tables | TanStack Table v8 |
| Charts | Recharts |
| State | Zustand (UI state), service layer + `useQuery` hook for data |
| Feedback | Sonner toasts |

## Getting started

Requires Node.js 20.19+ (or 22.12+).

```bash
npm install
npm run dev
```

Open http://localhost:5173 and pick a portal. Other scripts:

```bash
npm run build     # type-check (tsc -b) + production build
npm run lint      # oxlint
npm run preview   # serve the production build
```

Use **Reset demo data** on the start page to regenerate the sample dataset (it is also regenerated if LocalStorage is cleared).

## Demo identities

There is no sign-in yet; each portal opens as a fixed demo user (`src/data/session.ts`):

| Portal | Path | Signed in as |
| --- | --- | --- |
| Customer Portal | `/customer` | Ayesha Khan (Lahore) |
| Admin Console | `/admin` | Operations Administrator |
| Hub Workspace | `/branch` | Operations Officer, Lahore Central Hub |
| Rider App | `/driver` | Imran Ali, rider at Lahore Central Hub |

## Implemented screens

### Customer Portal (`/customer`)
- Dashboard — welcome, KPIs, recent shipments, tracking shortcut, recent activity
- Book Shipment — 5-step wizard (sender, receiver, parcel, service & payment, review) with validation, live price estimate, mock tracking number and printable label
- My Shipments — search, status/date filters, detail drawer, timeline, print label, cancel / reschedule
- Track Shipment — tracking search, status, journey progress, timeline, illustrative route map, proof of delivery
- Address Book, Payment History, Support Tickets, Profile & Settings

### Admin Console (`/admin`)
- Dashboard — network KPIs, performance charts, shipments by city, activity feed, quick actions
- Shipment Management + shipment detail (status update, driver assignment)
- Customer Management + customer detail
- Branch Management + branch detail (add / edit)
- Staff Management (roles and mock permissions)
- Driver Management + driver profile
- Pricing Management — rate cards, zone matrix, COD / surcharge configuration, price calculator
- COD & Finance — overview, collections, pending settlements, driver cash, transactions, mock reconciliation
- Reports & Analytics — date filters, charts, tables, CSV export

### Hub Workspace (`/branch`)
- Branch dashboard
- Scan Parcel — keyboard-first simulated scanning, confirmation animation, status actions, recent scans
- Incoming Shipments, Outgoing Shipments, Parcel Sorting, Branch Inventory, Returns
- Manifests — list, create, details, mock dispatch, printable manifest
- Dispatch Management, Received Manifests
- Branch Reports

### Rider App (`/driver`, mobile-first)
- Dashboard — today's deliveries, pickups, completed / pending, COD summary
- Assigned Deliveries + Delivery Detail
- Proof of Delivery — recipient, mock OTP, signature capture, photo preview, COD confirmation
- Failed Delivery — reason, notes, photo, reattempt option
- Driver Profile — details, branch, performance, history, illustrative earnings

## Project structure

```
src/
  app/          App shell, portal definitions (navigation), portal selection page
  layouts/      PortalLayout (sidebar + header), DriverLayout (mobile shell)
  routes/       Router and route helpers
  components/
    ui/         Design-system primitives (Button, Input, Dialog, Tabs, Badge …)
    shared/     Reusable app components (DataTable, StatsCard, Stepper, ShipmentTimeline, PrintLabel …)
  features/
    customer/ admin/ branch/ driver/   Portal pages, components and routes
    shipments/  Status metadata, shipment summary
    tracking/   Tracking details, route map
    pricing/    Pricing calculation
    cod/        COD helpers
  services/
    index.ts    Single import surface for data access
    mock/       LocalStorage-backed mock implementations
  data/         Seed data and deterministic generator (cities, branches, customers, riders, shipments)
  hooks/        useQuery
  stores/       Zustand UI store
  types/        Domain types (shaped like future API DTOs)
  utils/        Formatting, ids, class names
  styles/       Tailwind theme tokens and global CSS
```

## Design system

- Brand `#1263EB` (`brand-*` scale), navy headings `#101828` (`gray-900`), neutral `gray-*` scale, green / orange / red for success / warning / error.
- Tokens live in `src/styles/globals.css` (`@theme`). Inter is self-hosted via `@fontsource-variable/inter`.
- Printing: content rendered through `usePrint()` / `PrintPortal` is the only thing printed (labels, manifests).

## Connecting the NestJS backend later

UI code never touches data directly — it calls services from `src/services` and reads them through `useQuery`:

```ts
const { data, loading } = useQuery(() => shipmentService.listByCustomer(customerId), [customerId])
await shipmentService.updateStatus(id, 'delivered', { pod })
```

To integrate the real API:

1. Re-implement each service in `src/services/` with HTTP calls, keeping the same method signatures and the types in `src/types`.
2. Switch the exports in `src/services/index.ts` from `./mock/*` to the HTTP implementations.
3. Replace `src/data/session.ts` with real authentication and user context.
4. `useQuery` refreshes when the mock database changes; with a real API, swap it for TanStack Query (or similar) and invalidate after mutations.

Pricing (`src/features/pricing/calc.ts`) is a pure function and can move server-side unchanged.
"# courier-delivery" 

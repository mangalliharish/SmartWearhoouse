# SmartWarehouse

## Overview

SmartWarehouse is a construction material procurement system with role-based access and automatic order splitting. It connects buyers, dealers, and admins in a multi-dealer procurement workflow.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Auth**: JWT (jsonwebtoken + bcryptjs)
- **Frontend**: React + Vite + Tailwind CSS + shadcn/ui

## Roles

- **Buyer**: Create material orders (cement, steel, sand), view quotations, track status
- **Dealer**: View open orders, submit quotations (price/qty/date), update delivery status
- **Admin**: View all orders/quotations, trigger Auto Allocate to split orders by cheapest dealer

## Split/Allocation Algorithm

When admin clicks "Auto Allocate":
1. Fetch all quotations for the order
2. Sort dealers by lowest price per unit
3. Greedily allocate from cheapest dealer until quantity is filled
4. Create sub-orders for each dealer
5. Update master order status to "allocated"

## Order Status Timeline

`requested → quoted → allocated → dispatched → delivered`

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/        # Express 5 API server
│   └── smartwarehouse/    # React + Vite frontend
├── lib/
│   ├── api-spec/          # OpenAPI spec + Orval codegen config
│   ├── api-client-react/  # Generated React Query hooks
│   ├── api-zod/           # Generated Zod schemas from OpenAPI
│   └── db/                # Drizzle ORM schema + DB connection
├── pnpm-workspace.yaml
├── tsconfig.base.json
└── tsconfig.json
```

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. Always typecheck from root: `pnpm run typecheck`.

## Database Schema

- `users` — id, name, email, password_hash, role (buyer/dealer/admin)
- `orders` — id, buyer_id, material, total_qty, location, delivery_date, notes, status
- `quotations` — id, order_id, dealer_id, price_per_unit, available_qty, delivery_date
- `sub_orders` — id, order_id, dealer_id, allocated_qty, price_per_unit, status

## API Routes

- `POST /api/auth/register` — register with name, email, password, role
- `POST /api/auth/login` — login, returns JWT token
- `GET /api/auth/me` — get current user (requires auth)
- `GET /api/orders` — list orders (filtered by role)
- `POST /api/orders` — create order (buyer only)
- `GET /api/orders/:id` — get single order
- `POST /api/orders/:id/allocate` — auto allocate (admin only)
- `POST /api/quotations` — submit quotation (dealer only)
- `GET /api/quotations/:orderId` — get quotations for order
- `GET /api/suborders/:orderId` — get sub-orders for order
- `PATCH /api/suborders/:id/status` — update delivery status (dealer only)
- `GET /api/dealer/suborders` — get dealer's own sub-orders

## Root Scripts

- `pnpm run build` — typecheck + build all packages
- `pnpm run typecheck` — full typecheck
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API client and Zod schemas
- `pnpm --filter @workspace/db run push` — push DB schema changes

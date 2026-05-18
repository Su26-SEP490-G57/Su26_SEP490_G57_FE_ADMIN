# ShareXe FE Admin Project Context

## 1. Project Overview

**Project name:** ShareXe
**Project code:** SHX
**Repository:** `fe-admin`
**Purpose:** Admin frontend for the ShareXe carpooling platform.

ShareXe is a smart carpooling application for Vietnam. The product connects drivers and passengers who travel on similar routes so they can share rides and split transportation costs fairly. The platform focuses on affordability, community-based mobility, route matching, scheduling, GPS tracking, payments, ratings, notifications, and customer support.

This repository is the **admin web application**, not the mobile user app.

## 2. Required Tech Stack

The FE admin project must use:

- React JS
- TypeScript
- Vite
- Tailwind CSS
- React Router for routing
- Axios for API fetching
- TanStack React Query for server state management (not needed yet)

Current installed core libraries:

- `react`
- `react-dom`
- `vite`
- `typescript`
- `tailwindcss`
- `@tailwindcss/vite`
- `react-router-dom`
- `axios`
- `@tanstack/react-query`

## 3. Current Base Structure

Current source structure:

```txt
src/
  app/
    providers.tsx
  layouts/
    main-layout/
      MainLayout.tsx
  lib/
    api.ts
    query-client.ts
  pages/
    dashboard/
      DashboardPage.tsx
    users/
      UsersPage.tsx
  routes/
    index.tsx
  App.css
  App.tsx
  index.css
  main.tsx
```

### Important files

- `src/main.tsx`
  - React entrypoint.
  - Wraps the app with `AppProviders`.

- `src/app/providers.tsx`
  - Contains global providers.
  - Currently wraps the app with:
    - `QueryClientProvider`
    - `BrowserRouter`

- `src/lib/query-client.ts`
  - Exports the shared TanStack Query client.

- `src/lib/api.ts`
  - Exports the shared Axios instance.
  - Uses:

```ts
baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api'
```

- `src/routes/index.tsx`
  - Contains route definitions.
  - Current routes:
    - `/` → `DashboardPage`
    - `/users` → `UsersPage`
    - `*` → redirect to `/`

- `src/layouts/main-layout/MainLayout.tsx`
  - Basic admin layout with sidebar navigation and page outlet.

## 4. Current State

The project currently has a minimal working admin base:

- Vite React TypeScript app is initialized.
- Tailwind CSS is configured through Vite.
- Routing is configured.
- Axios API client is configured.
- TanStack Query is configured.
- Basic admin layout exists.
- Dashboard and Users placeholder pages exist.
- Production build has passed with `npm run build`.
- Dev route checks for `/` and `/users` returned HTTP 200.

## 5. Product Domain

ShareXe major features from the project introduction:

- User registration and identity verification using phone number, email, and personal documents.
- Search and book shared rides by departure point, destination, and travel time.
- Drivers can post available trips and recurring schedules.
- Smart route matching between passengers and drivers.
- Transparent trip cost calculation and fair cost-sharing suggestions.
- GPS map for route tracking, pickup, and drop-off visualization.
- In-app chat and masked calling.
- Rating and review system.
- Payment methods including cash, e-wallets, and bank cards.
- Trip scheduling and recurring booking management.
- Customer support and complaint handling.
- Notification system for trip updates, cancellations, and reminders.

For the admin app, these map naturally to admin modules such as:

- Dashboard
- Users
- Drivers
- Identity verification
- Trips
- Bookings
- Route matching monitoring
- Payments
- Reviews and ratings
- Notifications
- Support tickets
- Complaints
- Reports and analytics
- System settings

## 6. Recommended Next Development Steps

When continuing development, prioritize in this order:

1. **Admin layout foundation**
   - Improve sidebar/header layout.
   - Add page title area.
   - Add responsive behavior.
   - Add active navigation states.

2. **Auth base**
   - Add login page.
   - Add auth route guard.
   - Add token storage strategy.
   - Add logout flow.
   - Add API interceptor for auth token.

3. **API architecture**
   - Create domain-based API modules, for example:

```txt
src/features/users/api/
src/features/drivers/api/
src/features/trips/api/
src/features/bookings/api/
src/features/payments/api/
```

4. **Feature structure**
   - Prefer feature-based folders for real modules:

```txt
src/features/
  users/
    api/
    components/
    hooks/
    pages/
    types.ts
```

5. **UI system**
   - Decide whether to use a component library.
   - If no library is chosen, build reusable components under:

```txt
src/components/
  ui/
  layout/
  feedback/
```

6. **Forms and validation**
   - Consider adding:
     - `react-hook-form`
     - `zod`

7. **Admin modules**
   - Start with Users and Drivers because they are core to ShareXe.
   - Then add Trips, Bookings, Payments, Reviews, Support/Complaints, and Notifications.

## 7. Coding Guidelines For This Project

- Keep the stack React + TypeScript + Vite.
- Do not convert to Next.js unless explicitly requested.
- Prefer feature-based structure for business modules.
- Keep shared technical utilities in `src/lib`.
- Keep global app wiring in `src/app`.
- Keep route definitions in `src/routes`.
- Use TanStack Query for server data instead of manually storing API data in local component state.
- Use Axios through `src/lib/api.ts`, not direct `fetch`, unless there is a specific reason.
- Avoid over-engineering early; add abstractions when a real module needs them.
- Run `npm run build` after structural or TypeScript changes.

## 8. Useful Commands

```bash
npm install
npm run dev
npm run build
npm run lint
npm run preview
```

## 9. Handoff Instruction For Future AI Sessions

If a future assistant is asked to continue this project, read this file first.

After reading it, assume the project is a React + TypeScript + Vite admin dashboard for ShareXe. Continue by checking the current source files, then implement the next requested admin feature while preserving the structure described above.

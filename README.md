# POMS — Post-Operative Monitoring System (FE Admin)

Admin web application for the Post-Operative Monitoring System at Thanh Nhan Hospital — Surgical Department.

---

## Tech Stack

| Layer | Library |
|---|---|
| Framework | React 19 + TypeScript + Vite |
| Styling | Tailwind CSS v4 |
| Routing | React Router v7 |
| Server state | TanStack Query v5 |
| Client state | Zustand |
| HTTP client | Axios |
| Auth | Firebase Authentication |
| Form | React Hook Form + Zod |
| Icons | Lucide React + Material Symbols |
| Lint | ESLint |
| Format | Prettier |

---

## Prerequisites

- Node.js >= 18
- npm >= 9

---

## Setup

### 1. Clone the repository

```bash
git clone https://github.com/Su26-SEP490-G57/Su26_SEP490_G57_FE_ADMIN.git
cd fe-admin
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Copy the example env file and fill in your values:

```bash
cp .env.example .env.local
```

Required variables in `.env.local`:

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=

VITE_API_BASE_URL=http://localhost:3000/api
```

> Get Firebase config from: Firebase Console → Project Settings → Your apps → Web app

### 4. Run development server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select project **poms-25f1c**
3. Authentication → Sign-in method → Enable **Email/Password**
4. Authentication → Users → **Add user** to create test accounts

---

## Available Scripts

```bash
npm run dev          # Start dev server
npm run build        # Type-check + production build
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run lint:fix     # Run ESLint with auto-fix
npm run format       # Format all files with Prettier
npm run format:check # Check formatting without writing
```

---

## Project Structure

```
src/
  app/
    providers.tsx         # Global providers (QueryClient, Router, Auth)

  assets/                 # Static assets

  components/             # Shared reusable UI components (to be added)
    ui/
    layout/
    feedback/

  constants/
    routes.ts             # All route path constants

  features/
    auth/
      components/
        AuthGuard.tsx     # Route protection
      context/
        AuthContext.tsx   # Firebase auth listener
      pages/
        LoginPage.tsx     # Login form
      store/
        authStore.ts      # Zustand auth session store
    dashboard/
      pages/
        DashboardPage.tsx       # Role-based dashboard switcher
        NurseDashboard.tsx
        HeadNurseDashboard.tsx
        AdminDashboard.tsx

  layouts/
    auth-layout/
      AuthLayout.tsx      # Layout for unauthenticated pages
    main-layout/
      MainLayout.tsx      # Sidebar + header shell
      nav-config.ts       # Nav items with role permissions + DEV_ROLE

  lib/
    api.ts                # Axios instance
    firebase.ts           # Firebase app + auth
    query-client.ts       # TanStack Query client

  routes/
    index.tsx             # Route definitions

  types/
    api.ts                # ApiResponse<T>, PaginatedResponse<T>
    common.ts             # Shared types

  index.css               # Tailwind + global styles
  main.tsx                # App entry point
```

---

## Role System (Development)

Web admin supports two roles: **head_nurse** (điều dưỡng trưởng) and **admin**.

> Nurse and Patient roles are handled by the mobile app.

Currently using a temporary `DEV_ROLE` constant for UI development.

To switch roles, edit **one line** in `src/layouts/main-layout/nav-config.ts`:

```ts
export const DEV_ROLE: UserRole = 'head_nurse' // 'head_nurse' | 'admin'
```

This controls both sidebar nav items and dashboard content simultaneously.

> When the role system is ready (Firebase custom claims or BE response), replace `DEV_ROLE` with `useRole()` hook in `MainLayout.tsx` and `DashboardPage.tsx`.

---

## Environment Variables Reference

| Variable | Description |
|---|---|
| `VITE_FIREBASE_API_KEY` | Firebase Web API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase auth domain |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID |
| `VITE_FIREBASE_APP_ID` | Firebase app ID |
| `VITE_FIREBASE_MEASUREMENT_ID` | Firebase Analytics measurement ID |
| `VITE_API_BASE_URL` | Backend API base URL |

# POMS — FE Admin

> Post-Operative Monitoring System · Admin Web Application
> Thanh Nhan Hospital — Surgical Department · ERAS Protocol

![Node](https://img.shields.io/badge/node-%3E%3D18-brightgreen)
![React](https://img.shields.io/badge/react-19-blue)
![TypeScript](https://img.shields.io/badge/typescript-6-blue)
![License](https://img.shields.io/badge/license-private-red)

---

## Overview

Web admin dashboard supporting two roles:

| Role | Responsibility |
|---|---|
| `head_nurse` | Monitor post-op patients, manage POD assessments, handle ERAS alerts |
| `admin` | Manage staff accounts, audit logs, permissions, system settings |

> Nurse and Patient flows live in the mobile app — not in this repo.

---

## Tech Stack

| Layer | Library |
|---|---|
| Framework | React 19 + TypeScript + Vite 8 |
| Styling | Tailwind CSS v4 |
| Routing | React Router v7 |
| Server state | TanStack Query v5 |
| Client state | Zustand v5 |
| HTTP client | Axios |
| Auth | JWT (access token in-memory + refresh token in localStorage) |
| Forms | React Hook Form + Zod |
| Charts | Chart.js + react-chartjs-2 |
| Icons | Lucide React · Material Symbols Outlined (CDN) |
| Lint / Format | ESLint + Prettier |

---

## Prerequisites

- Node.js >= 18
- npm >= 9

---

## Getting Started

```bash
# 1. Clone
git clone <repo-url>
cd fe-admin

# 2. Install
npm install

# 3. Configure env
cp .env.example .env.local
# Edit .env.local — set VITE_API_BASE_URL to your backend

# 4. Run dev server
npm run dev
# → http://localhost:5173
```

---

## Environment Variables

| Variable | Description | Example |
|---|---|---|
| `VITE_API_BASE_URL` | Backend API base URL | `http://localhost:3000/api` |

---

## Scripts

```bash
npm run dev           # Dev server (HMR)
npm run build         # Type-check + production build
npm run preview       # Preview production build locally
npm run lint          # ESLint
npm run lint:fix      # ESLint with auto-fix
npm run format        # Prettier (write)
npm run format:check  # Prettier (check only)
```

---

## Project Structure

```
src/
├── app/
│   └── providers.tsx           # QueryClient + Router + AuthProvider
├── constants/
│   └── routes.ts               # Route path constants
├── features/
│   ├── auth/
│   │   ├── components/AuthGuard.tsx
│   │   ├── context/AuthContext.tsx   # Session restore on mount
│   │   ├── pages/LoginPage.tsx
│   │   ├── store/authStore.ts        # Zustand: accessToken (memory) + userProfile (persisted)
│   │   └── types.ts
│   └── dashboard/
│       └── pages/
│           ├── DashboardPage.tsx          # Role-based switcher
│           ├── HeadNurseDashboard.tsx
│           └── AdminDashboard.tsx
├── layouts/
│   ├── auth-layout/AuthLayout.tsx
│   └── main-layout/
│       ├── MainLayout.tsx        # Collapsible sidebar + header
│       └── nav-config.ts         # Nav items per role + DEV_ROLE
├── lib/
│   ├── api.ts                    # Axios instance + token interceptor + 401 refresh
│   └── query-client.ts           # TanStack Query config (retry, error handling)
├── routes/
│   └── index.tsx
└── types/
    ├── api.ts                    # ApiResponse<T>, PaginatedResponse<T>
    └── common.ts
```

---

## Auth Flow

```
POST /auth/login → { accessToken, refreshToken, user }
  accessToken  → Zustand in-memory (cleared on tab close)
  refreshToken → localStorage (key: poms_refresh_token)
  userProfile  → Zustand + persisted to localStorage (key: poms-auth)

On page reload:
  AuthContext reads refreshToken → POST /auth/refresh → new accessToken
  On failure → clearSession() → redirect /login

On every API request:
  Axios interceptor injects: Authorization: Bearer <accessToken>
  On 401 → queue pending requests → refresh token → retry all
  On refresh failure → clearSession() → redirect /login
```

---

## Role Switching (Dev Only)

Toggle the active role in `src/layouts/main-layout/nav-config.ts`:

```ts
export const DEV_ROLE: UserRole = 'head_nurse' // or 'admin'
```

Replace with `useAuthStore().userProfile?.role` once the real auth API is wired up.

---

## Known Limitations

- `LoginPage` uses a **mock login** function — replace with `POST /auth/login` once BE is ready.
- `DEV_ROLE` is **hardcoded** — not derived from the real user session yet.
- All routes except `/dashboard` render placeholder components.
- No toast/notification system yet — `query-client.ts` has `TODO` comments where toasts should go.

# POMS — FE Admin

> Post-Operative Monitoring System · Admin Web Application
> Thanh Nhan Hospital — Surgical Department · ERAS Protocol

![Node](https://img.shields.io/badge/node-%3E%3D18-brightgreen)
![React](https://img.shields.io/badge/react-19-blue)
![TypeScript](https://img.shields.io/badge/typescript-6-blue)
![License](https://img.shields.io/badge/license-private-red)

---

## Overview

Admin dashboard for **Post-Operative Monitoring System (POMS)** implementing the ERAS (Enhanced Recovery After Surgery) protocol.

Monitors surgical patients via **triage-level assessment** (GREEN/YELLOW/RED), manages diet progression (0-4 levels), and handles critical alerts with auto-lock and push notifications.

### Supported Roles

| Role         | Responsibility                                                       |
| ------------ | -------------------------------------------------------------------- |
| `head_nurse` | Monitor post-op patients, manage POD assessments, handle ERAS alerts |
| `doctor`     | Review clinical assessments, adjust diet levels (upgrade/downgrade)  |
| `nurse`      | Submit patient assessments, respond to alerts (downgrade diet only)  |
| `admin`      | Manage staff accounts, audit logs, permissions, system settings      |

> Nurse daily workflows and Patient self-assessment live in the mobile app (separate repo).

---

## Tech Stack

| Layer         | Library                                                      |
| ------------- | ------------------------------------------------------------ |
| Framework     | React 19 + TypeScript + Vite 8                               |
| Styling       | Tailwind CSS v4                                              |
| Routing       | React Router v7                                              |
| Server state  | TanStack Query v5                                            |
| Client state  | Zustand v5                                                   |
| HTTP client   | Axios                                                        |
| Auth          | JWT (access token in-memory + refresh token in localStorage) |
| Forms         | React Hook Form + Zod                                        |
| Charts        | Chart.js + react-chartjs-2                                   |
| Icons         | Lucide React · Material Symbols Outlined (CDN)               |
| Lint / Format | ESLint + Prettier                                            |

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

| Variable            | Description          | Example                     |
| ------------------- | -------------------- | --------------------------- |
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

## Key Features

### Patient Grid
- High-density table view with real-time triage status
- Color tinting by triage level (GREEN/YELLOW/RED)
- Auto-lock highlight (60-min cooldown after RED alert)
- Smart filtering: hides patients meeting discharge criteria (GREEN + max diet level + >24h since assessment)

### Assessment Matrix
- Real-time symptom survey submission
- Triage calculation from selected options (`optionTriageLevel`)
- Historical assessment timeline per patient
- No numerical scores — classification is purely GREEN/YELLOW/RED

### Question Management
- POMS questionnaire editor with triage-level selector
- 2-column grid layout for answer options (mobile: 1 col, desktop: 2 cols)
- Visual triage selector (3 buttons: GREEN/YELLOW/RED with ring + hover effects)
- Validation: all options must have a triage level assigned

### Diet Level Management
- Track diet progression (0-4 levels) per operation type
- Role-based authorization:
  - **Doctor**: Can upgrade or downgrade
  - **Nurse/Head Nurse**: Can only downgrade
- Dynamic max level validation from backend (`pod_protocols` table)
- Auto-progression via scheduler (00:01 ICT) when GREEN + no pending RED alerts

### Alert Dashboard
- Auto-locked RED alerts with 60-minute cooldown
- FCM push notification to assigned nurse
- Alert history with unlock timestamps

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
│   ├── analytics/              # Dashboard metrics, charts
│   ├── care-observation/       # Vital signs, I/O monitoring
│   ├── nurses/                 # Nurse management, room assignments
│   ├── patients/               # Patient grid, assessment matrix
│   ├── protocols/              # Question management (POMS editor)
│   ├── recovery/               # Recovery milestones, discharge criteria
│   ├── treatment-orders/       # Medication orders
│   └── vitals/                 # Vital signs history
├── layouts/
│   ├── auth-layout/AuthLayout.tsx
│   └── main-layout/
│       ├── MainLayout.tsx        # Top tabs navigation (minimalist, horizontal)
│       └── nav-config.ts         # Nav items per role
├── lib/
│   ├── api.ts                    # Axios instance + token interceptor + 401 refresh
│   └── query-client.ts           # TanStack Query config (retry, error handling)
├── routes/
│   └── index.tsx                 # Lazy-loaded route definitions (code splitting)
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

## Development Workflow

### Code Quality

```bash
# Before committing
npm run lint          # Check for errors
npm run format:check  # Check formatting

# Auto-fix
npm run lint:fix      # Fix ESLint issues
npm run format        # Format with Prettier
```

### Pre-commit Hooks

Husky runs `lint-staged` automatically on commit:
- Fixes ESLint issues in staged `.ts/.tsx` files
- Formats code with Prettier
- Blocks commit if unfixable errors exist

### Hot Reload & Type Safety

```bash
npm run dev    # Vite dev server with HMR
npm run build  # Type-check (tsc -b) + production build
```

Any TypeScript error will **fail the build** — fix before deploying.

---

## Deployment

### Build for Production

```bash
npm run build
# Output: dist/
```

### Preview Production Build Locally

```bash
npm run preview
# → http://localhost:4173
```

### Environment Variables

| Variable            | Description          | Example                     |
| ------------------- | -------------------- | --------------------------- |
| `VITE_API_BASE_URL` | Backend API base URL | `http://localhost:3000/api` |

---

## Known Limitations

- **Patient Notes**: Placeholder UI button exists but feature is not implemented (out of scope).
- **Analytics Dashboard**: Some metrics may show "No data" if backend seeding is incomplete.
- **Mobile Responsiveness**: Optimized for desktop (1280px+); mobile view works but not primary target.

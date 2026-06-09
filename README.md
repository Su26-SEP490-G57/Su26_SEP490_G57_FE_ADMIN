# POMS — Post-Operative Monitoring System (FE Admin)

Admin web application for the Post-Operative Monitoring System at Thanh Nhan Hospital — Surgical Department. Supports the ERAS (Enhanced Recovery After Surgery) protocol.

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
| Auth | JWT truyền thống (BE issue token) |
| Form | React Hook Form + Zod |
| Charts | Chart.js + react-chartjs-2 |
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
git clone <repo-url>
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
VITE_API_BASE_URL=http://localhost:3000
```

### 4. Run development server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## Test Login (Mock)

Khi BE chưa sẵn sàng, login dùng mock data:

- **Email:** bất kỳ email hợp lệ (vd: `admin@poms.vn`)
- **Password:** `123456`

Khi BE sẵn sàng, xóa `mockLogin` trong `src/features/auth/pages/LoginPage.tsx` và uncomment gọi API thật.

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

  constants/
    routes.ts             # All route path constants

  features/
    auth/
      components/
        AuthGuard.tsx     # Route protection
      context/
        AuthContext.tsx   # Session restore on app load
      pages/
        LoginPage.tsx     # Login form (mock → real API when BE ready)
      store/
        authStore.ts      # Zustand auth session store
      types.ts            # UserProfile, LoginResponse, STORAGE_KEYS
    dashboard/
      pages/
        DashboardPage.tsx       # Role-based dashboard switcher
        HeadNurseDashboard.tsx  # ERAS dashboard UI
        AdminDashboard.tsx      # Admin dashboard UI

  layouts/
    auth-layout/
      AuthLayout.tsx      # Layout for unauthenticated pages
    main-layout/
      MainLayout.tsx      # Collapsible sidebar + header
      nav-config.ts       # Nav items with role permissions + DEV_ROLE

  lib/
    api.ts                # Axios instance + 2 interceptors (token + refresh)
    query-client.ts       # TanStack Query client config

  routes/
    index.tsx             # Route definitions

  types/
    api.ts                # ApiResponse<T>, PaginatedResponse<T>
    common.ts             # Shared types
```

---

## Role System (Development)

Web admin hỗ trợ 2 role: **head_nurse** (điều dưỡng trưởng) và **admin**.

> Nurse và Patient thuộc mobile app — không có trong web admin này.

Để switch role khi dev, đổi 1 dòng trong `src/layouts/main-layout/nav-config.ts`:

```ts
export const DEV_ROLE: UserRole = 'head_nurse' // 'head_nurse' | 'admin'
```

Khi role system thật sẵn sàng (từ BE response), thay `DEV_ROLE` bằng `userProfile.role` trong `MainLayout.tsx` và `DashboardPage.tsx`.

---

## Auth Flow

```
Login: POST /auth/login → { accessToken, refreshToken, userProfile }
  → accessToken lưu Zustand (in-memory)
  → refreshToken lưu localStorage (key: poms_refresh_token)
  → userProfile lưu Zustand + persist localStorage (key: poms-auth)

Refresh trang:
  → AuthContext đọc refreshToken từ localStorage
  → POST /auth/refresh → nhận accessToken mới
  → Nếu fail → redirect /login

API request:
  → Axios interceptor tự gán Authorization: Bearer <accessToken>
  → Nếu 401 → tự refresh token → retry request gốc
```

---

## Environment Variables Reference

| Variable | Description |
|---|---|
| `VITE_API_BASE_URL` | Backend API base URL (vd: `http://localhost:3000`) |

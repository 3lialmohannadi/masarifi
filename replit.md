# Masarifi - Personal Finance App

## Overview

Masarifi (مصاريفي) is a bilingual (Arabic/English) personal finance mobile app built with React Native and Expo. It targets users in the Gulf region (Qatar, Saudi Arabia, UAE, etc.) and supports multiple Gulf currencies. The app provides comprehensive money management features including:

- **Accounts** – Multiple bank/cash accounts with balance tracking
- **Transactions** – Income and expense logging with categories
- **Transfers** – Move money between accounts
- **Savings** – Savings wallets with goal-tracking and progress visualization
- **Commitments** – Recurring financial obligations (rent, installments, insurance) with due-date tracking and pay-now functionality
- **Plans** – Financial plans for specific goals (travel, wedding, car, etc.) with budget tracking
- **Budgets** – Monthly category-level budget limits
- **Statistics** – Monthly income/expense breakdowns and category spending charts
- **Dashboard** – Overview of balances, daily spending limit, upcoming commitments, and recent activity

All data is stored locally on-device using AsyncStorage — there is no user authentication or cloud sync. The app has a dark/light/auto theme system and full RTL layout support.

---

## User Preferences

Preferred communication style: Simple, everyday language.

---

## System Architecture

### Frontend (React Native / Expo)

- **Framework**: Expo SDK 54 with Expo Router v6 for file-based navigation
- **React Version**: React 19 with the new architecture enabled (`newArchEnabled: true`)
- **Navigation Structure**:
  - `app/(tabs)/` – Five bottom-tab screens: Dashboard, Transactions, Savings, Plans, Statistics, More
  - `app/(modals)/` – Modal screens for all create/edit forms (accounts, transactions, categories, commitments, plans, savings wallets, transfers, budgets)
  - `app/accounts/[id].tsx` – Dynamic detail screen for individual accounts
- **UI Platform Adaptation**: Uses `expo-glass-effect` and native tab bars on iOS when Liquid Glass is available; falls back to a classic Expo `Tabs` layout on Android and web
- **Styling**: StyleSheet-based inline styles driven by a theme object (`LightTheme` / `DarkTheme` in `constants/colors.ts`). No external UI library.
- **Animations**: `react-native-reanimated` and `react-native-gesture-handler` for gestures and transitions
- **Haptics**: `expo-haptics` used throughout for tactile feedback on button presses

### State Management

Each domain has its own React Context + Provider in the `store/` directory:

| Context | Manages |
|---|---|
| `AppContext` | App-wide settings: language, theme, selected account |
| `AccountsContext` | Bank/cash accounts |
| `TransactionsContext` | Transactions and transfers |
| `CategoriesContext` | Transaction categories (with default seeding) |
| `SavingsContext` | Savings wallets and savings transactions |
| `CommitmentsContext` | Recurring financial commitments |
| `PlansContext` | Financial plans and plan categories |
| `BudgetsContext` | Monthly category budgets |

All contexts load data from AsyncStorage on mount, persist changes on every mutation, and expose a typed hook (e.g., `useAccounts()`). Providers are nested in `_layout.tsx`.

### Data Persistence

- **Storage**: `@react-native-async-storage/async-storage` — all data is stored locally as JSON strings under namespaced keys (e.g., `@masarifi/accounts`, `@masarifi/transactions`)
- **No server-side data storage** — the backend/database setup exists but is not connected to the app's data layer
- **IDs**: Generated client-side using a timestamp + random string approach (`utils/id.ts`)

### Backend (Express.js)

A minimal Express server exists in `server/` but currently only serves static assets and has placeholder routes. It is intended for Replit deployment scenarios to serve the Expo web build.

- Entry: `server/index.ts`
- Routes: `server/routes.ts` (empty, ready for API routes prefixed with `/api`)
- Storage: `server/storage.ts` provides an in-memory `MemStorage` class (not currently wired to the app)
- Database schema: `shared/schema.ts` defines a `users` table via Drizzle ORM (PostgreSQL), but it is not used by the app yet

### Internationalization (i18n)

- Two language files: `i18n/ar.ts` (Arabic, RTL) and `i18n/en.ts` (English)
- Default language is Arabic (`ar`)
- Language selected by user and persisted in settings
- All UI strings go through the `t` object from `useApp()`
- Auto-translation for bilingual name inputs uses the free MyMemory API (`utils/translate.ts`)
- RTL layout is handled by flipping `flexDirection` conditionally based on `isRTL` from `AppContext`

### Currency Support

Gulf-region currencies: QAR, USD, EUR, SAR, AED, GBP, KWD, BHD, OMR — each with proper decimal precision and Arabic/English display names (`utils/currency.ts`).

### TanStack Query

`@tanstack/react-query` and a `QueryClient` are configured (`lib/query-client.ts`) with a helper `apiRequest()` pointing to `EXPO_PUBLIC_DOMAIN`. This is scaffolded for future API calls but not currently used by core features since data is local.

---

## External Dependencies

### Core Frameworks
- **Expo SDK 54** with Expo Router v6 — app framework and file-based routing
- **React Native 0.81** — mobile UI runtime

### Data & State
- **@react-native-async-storage/async-storage** — local on-device persistence (primary data store)
- **@tanstack/react-query** — HTTP data fetching (scaffolded, not yet active)
- **Drizzle ORM** (`drizzle-orm`, `drizzle-zod`) — PostgreSQL ORM for the server-side schema; connected to `DATABASE_URL` environment variable
- **pg** — PostgreSQL driver for the server

### UI & UX
- **@expo-google-fonts/inter** — Inter font family
- **@expo/vector-icons** (Feather icon set) — icons throughout the app
- **expo-linear-gradient** — gradient backgrounds
- **expo-blur** — blur effects (tab bar on iOS)
- **expo-glass-effect** — Liquid Glass native tabs on iOS 26+
- **expo-haptics** — haptic feedback
- **react-native-reanimated** — animations
- **react-native-gesture-handler** — gesture recognition
- **react-native-safe-area-context** — safe area insets
- **react-native-svg** — SVG rendering (used for charts/statistics)
- **react-native-keyboard-controller** — keyboard-aware scroll behavior
- **expo-image-picker** — image selection (used in forms)
- **expo-location** — location access (available but usage minimal)

### Server
- **Express 5** — HTTP server for serving the Expo web build and future API endpoints
- **http-proxy-middleware** — proxy support for Replit dev environment
- **esbuild** — server bundle build tool

### Translation API
- **MyMemory Translated API** (`api.mymemory.translated.net`) — free, unauthenticated REST endpoint for auto-translating bilingual name fields between Arabic and English

### Environment Variables
| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string for Drizzle/server |
| `EXPO_PUBLIC_DOMAIN` | Base URL for API requests from the Expo app |
| `REPLIT_DEV_DOMAIN` | Replit dev tunnel domain (used in CORS and dev scripts) |
| `REPLIT_DOMAINS` | Allowed CORS origins in production |
| `REPLIT_INTERNAL_APP_DOMAIN` | Used by the static build script for deployment |
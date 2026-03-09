# Masarifi - Personal Finance App

## Overview

Masarifi (مصاريفي) is a bilingual (Arabic/English) personal finance mobile app built with React Native and Expo. It targets users in the Gulf region (Qatar, Saudi Arabia, UAE, etc.) and supports multiple Gulf currencies. The app provides comprehensive money management features including:

- **Accounts** – Multiple bank/cash accounts with balance tracking
- **Transactions** – Income and expense logging with categories and grouped-by-date view. Transfers are merged into the same list with a "Transfer" filter pill.
- **Transfers** – Move money between accounts (multi-currency with exchange rate). Tapping a transfer opens a detail modal with delete + balance reversal.
- **Savings** – Savings wallets with goal-tracking and progress visualization
- **Commitments** – Recurring financial obligations (rent, installments, insurance) with due-date tracking and pay-now functionality
- **Plans** – Financial plans for specific goals (travel, wedding, car, etc.) with budget tracking
- **Budgets** – Monthly category-level budget limits with progress bars
- **Statistics** – Monthly income/expense breakdowns, 6-month trend chart, and category spending analysis
- **Dashboard** – Overview of balances, daily spending limit, upcoming commitments, and recent activity

All data is stored locally on-device using AsyncStorage — there is no user authentication or cloud sync. The app has a dark/light/auto theme system and full RTL layout support.

---

## User Preferences

Preferred communication style: Simple, everyday language.

---

## Project Structure

```
workspace/
├── app/                          # Expo Router file-based screens
│   ├── (tabs)/                   # Bottom tab screens
│   │   ├── index.tsx             # Dashboard
│   │   ├── transactions.tsx      # Transactions list
│   │   ├── savings.tsx           # Savings wallets
│   │   ├── statistics.tsx        # Statistics & analytics
│   │   ├── plans.tsx             # Financial plans (hidden tab, accessible via More)
│   │   ├── more.tsx              # More menu (links to all sub-screens)
│   │   └── _layout.tsx           # Tab bar layout (NativeTabs / ClassicTabs)
│   ├── (modals)/                 # Modal form screens
│   │   ├── add-transaction.tsx   # Add/edit transaction (reads ?type=income|expense)
│   │   ├── account-form.tsx      # Add/edit account
│   │   ├── category-form.tsx     # Add/edit category
│   │   ├── commitment-form.tsx   # Add/edit commitment
│   │   ├── plan-form.tsx         # Add/edit financial plan
│   │   ├── budget-form.tsx       # Add/edit monthly budget
│   │   ├── saving-wallet-form.tsx # Add/edit savings wallet
│   │   ├── savings-movement.tsx  # Deposit/withdraw from savings wallet
│   │   └── transfer-form.tsx     # Transfer between accounts
│   ├── accounts/
│   │   ├── list.tsx              # Accounts list screen
│   │   └── [id].tsx              # Account detail & transaction history
│   ├── savings/[id].tsx          # Savings wallet detail
│   ├── plans/[id].tsx            # Plan detail & linked transactions
│   ├── commitments/index.tsx     # Commitments list with filters
│   ├── budget/index.tsx          # Monthly budgets with month picker
│   ├── categories/index.tsx      # Categories management
│   ├── settings/index.tsx        # App settings
│   ├── statistics/index.tsx      # Standalone statistics screen (legacy)
│   ├── _layout.tsx               # Root Stack layout + all Providers
│   ├── +not-found.tsx            # Themed 404 screen
│   └── +native-intent.tsx        # Native intent redirects
├── components/                   # Reusable React components
│   ├── ui/                       # Base UI components
│   │   ├── AppButton.tsx         # Primary action button with loading state
│   │   ├── AppInput.tsx          # Themed text input with label and error
│   │   ├── Badge.tsx             # Status badge chip
│   │   ├── EmptyState.tsx        # Empty list placeholder (icon + text + action)
│   │   ├── ProgressBar.tsx       # Animated progress bar
│   │   ├── ThemedText.tsx        # Themed text component
│   │   └── ThemedView.tsx        # Themed view component
│   ├── AccountSelector.tsx       # Account picker dropdown
│   ├── BilingualNameInput.tsx    # Dual-language name input with auto-translate
│   ├── ColorPicker.tsx           # Color swatch picker
│   ├── CommitmentItem.tsx        # Commitment list row (with Pay Now button)
│   ├── ErrorBoundary.tsx         # React error boundary wrapper
│   ├── ErrorFallback.tsx         # Error recovery UI
│   ├── IconPicker.tsx            # Feather icon picker grid
│   ├── KeyboardAwareScrollViewCompat.tsx # Keyboard-aware scroll
│   ├── PayNowModal.tsx           # Commitment payment confirmation modal
│   ├── SavingsWalletCard.tsx     # Savings wallet summary card
│   └── TransactionItem.tsx       # Transaction list row
├── constants/                    # App-wide constants
│   ├── colors.ts                 # LightTheme, DarkTheme, AppColors palette
│   ├── accounts.ts               # Account type metadata (icon, color, names)
│   └── currencies.ts             # Currency list with symbols and decimals
├── hooks/                        # Custom React hooks
│   ├── useMonthPicker.ts         # Month navigation hook (shared by Statistics & Budget)
│   ├── useDebounce.ts            # Debounce hook (used in Transactions search)
│   └── index.ts                  # Barrel export
├── i18n/                         # Internationalization
│   ├── ar.ts                     # Arabic translations (default)
│   ├── en.ts                     # English translations
│   └── index.ts                  # getTranslations() function
├── lib/
│   └── query-client.ts           # TanStack Query client + apiRequest helper
├── store/                        # React Context providers (state management)
│   ├── AppContext.tsx             # Settings, theme, language, RTL
│   ├── AccountsContext.tsx       # Accounts CRUD
│   ├── TransactionsContext.tsx   # Transactions + Transfers CRUD
│   ├── CategoriesContext.tsx     # Categories CRUD + default seeding
│   ├── SavingsContext.tsx        # Savings wallets + savings transactions
│   ├── CommitmentsContext.tsx    # Commitments CRUD + auto-status + recurrence
│   ├── PlansContext.tsx          # Financial plans + plan categories
│   └── BudgetsContext.tsx        # Monthly budgets CRUD
├── types/
│   └── index.ts                  # All TypeScript interfaces and type aliases
├── utils/                        # Pure utility functions
│   ├── currency.ts               # formatCurrency, getCurrencySymbol, CURRENCIES list
│   ├── date.ts                   # Date helpers: format, parse, compare, month math
│   ├── defaults.ts               # createDefaultCategories(), createDefaultSavingsWallet()
│   ├── display.ts                # getDisplayName() for bilingual name objects
│   ├── id.ts                     # generateId(), now() timestamp
│   ├── storage.ts                # AsyncStorage wrappers with error logging
│   └── translate.ts              # autoTranslate() via MyMemory API
├── assets/                       # Static assets (images, fonts, icons)
└── server/                       # Express.js backend (serves web build + API scaffold)
    ├── index.ts                  # Server entry point (port 5000)
    ├── routes.ts                 # API route handlers
    └── storage.ts                # In-memory storage (server-side, not used by app)
```

---

## System Architecture

### Frontend (React Native / Expo)

- **Framework**: Expo SDK 54 with Expo Router v6 for file-based navigation
- **React Version**: React 19 with the new architecture enabled (`newArchEnabled: true`)
- **Navigation Structure**:
  - `app/(tabs)/` – Five visible bottom-tab screens: Dashboard, Transactions, Savings, Statistics, More
  - `app/(tabs)/plans.tsx` – Hidden tab (href: null), accessible via More → Plans
  - `app/(modals)/` – Modal screens for all create/edit forms
  - Sub-screens for accounts, commitments, budgets, categories, settings
- **UI Platform Adaptation**: Uses `expo-glass-effect` and native tab bars on iOS when Liquid Glass is available; falls back to a classic Expo `Tabs` layout on Android and web
- **Styling**: StyleSheet-based inline styles driven by a theme object (`LightTheme` / `DarkTheme` in `constants/colors.ts`). No external UI library.
- **Theme System**: Three modes (light/dark/auto). Auto follows system `useColorScheme()`. Theme stored as `settings.theme` in AppContext, persisted to AsyncStorage. `isDark` boolean computed by AppContext. StatusBar style auto-adapts via `AppLoadingGate`. New semantic color tokens: `warningBackground`, `warningText`, `warningBorder` (adapts between light/dark). All screens use `theme.xxx` — no hardcoded light-only colors like `#FEF2F2`, `#F0FDF4`, `#FFFBEB`.
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
| `CommitmentsContext` | Recurring financial commitments (with auto-status: upcoming/due_today/overdue) |
| `PlansContext` | Financial plans and plan categories |
| `BudgetsContext` | Monthly category budgets |

All contexts:
- Load data from AsyncStorage on mount
- Persist changes on every mutation
- Expose `isLoaded: boolean` for loading state
- Expose a typed hook (e.g., `useAccounts()`)
- Are nested in `_layout.tsx` via `<Providers>`

### Custom Hooks

| Hook | Purpose |
|---|---|
| `useMonthPicker` | Shared month navigation (used in Statistics tab and Budget screen) |
| `useDebounce` | Debounce input changes (used in Transactions search) |

### Data Persistence

- **Storage**: `@react-native-async-storage/async-storage` — all data stored locally as JSON under namespaced keys (e.g., `@masarifi/accounts`, `@masarifi/transactions`)
- **Storage keys**: Defined as `const KEYS` in `utils/storage.ts`
- **Error handling**: Storage operations log errors to console in `__DEV__` mode
- **IDs**: Generated client-side using timestamp + random string (`utils/id.ts`)
- **No server-side data storage** — all app data is 100% local

### Internationalization (i18n)

- Two language files: `i18n/ar.ts` (Arabic, RTL default) and `i18n/en.ts` (English)
- Language selected by user and persisted in settings
- All UI strings go through `t` object from `useApp()`
- Auto-translation for bilingual name inputs uses the free MyMemory API (`utils/translate.ts`)
- RTL layout handled by flipping `flexDirection` based on `isRTL` from `AppContext`

### Currency Support

Gulf-region currencies: QAR, SAR, AED, KWD, BHD, OMR, USD, EUR, GBP — each with:
- Arabic and English names
- Country flag emoji
- Proper decimal precision (2 or 3 decimals)
- Symbol for display

### TypeScript

- Strict TypeScript throughout
- All entities typed in `types/index.ts`
- Context values fully typed with interfaces
- Hook return types declared
- `any` types minimized; used only where necessary for dynamic Feather icon names

---

## Key Patterns

### Adding a New Screen
1. Create `app/[section]/index.tsx` or `app/[section]/[id].tsx`
2. Register in `app/_layout.tsx` with `<Stack.Screen name="section/index" />`
3. Add navigation link in `app/(tabs)/more.tsx`
4. Add i18n keys to both `i18n/ar.ts` and `i18n/en.ts`

### Adding a New Context
1. Create `store/NewContext.tsx` following existing patterns
2. Add `StorageKey` to `utils/storage.ts`
3. Wrap children in `app/_layout.tsx` Providers chain

### Form Validation Pattern
Forms validate on submit, storing errors in a `Record<string, string>` state and displaying via `AppInput`'s `error` prop.

---

## Backend (Express.js)

A minimal Express server exists in `server/` that:
- Serves static Expo web build files
- Has API route scaffolding (not wired to app data)

Entry: `server/index.ts` on port 5000.

---

## Environment Variables

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string for Drizzle/server |
| `EXPO_PUBLIC_DOMAIN` | Base URL for API requests from the Expo app |
| `REPLIT_DEV_DOMAIN` | Replit dev tunnel domain (used in CORS and dev scripts) |
| `SESSION_SECRET` | Express session secret |

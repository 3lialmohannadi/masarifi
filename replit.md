# Masarifi - Personal Finance App

## Overview
Masarifi is a bilingual (Arabic/English) personal finance mobile app built with React Native and Expo, targeting users in the Gulf region. It offers comprehensive money management features including accounts, transactions, transfers, savings with goal tracking, manual commitments (one-time bills/dues), and detailed statistics. The app supports multiple Gulf currencies and provides a holistic view of personal finances. The vision is to empower users with robust tools for financial tracking, leveraging local market understanding and advanced mobile technology.

## Design System
**Color Palette (Teal FinTech):**
- Primary: `#2F8F83` (teal)
- Background (light): `#F4F7F7`
- Background (dark): `#0F1E1C`
- Card (light): `#FFFFFF` with `#D4E4E2` border + subtle teal shadow
- Card (dark): `#1A2E2B` with `#2A4440` border
- Text (light): `#1F2A44`, Text (dark): `#E8F2F1`
- Hero sections: teal `#2F8F83` (light) / dark teal `#132825` (dark) with `borderBottomRadius: 32`

**Card Shadows:** Platform-aware — `boxShadow` on web, native `shadow*` props on iOS/Android (light mode only). Shadow utility functions (`cardShadow`, `strongShadow`, `subtleShadow`) are exported from `theme/colors.ts`. Use these helpers for new components.

**Design Tokens (strictly enforced across all screens):**
- Screen title: `fontSize: 22, fontWeight: "800"` — applies to ALL screens (tab and stack)
- Screen horizontal padding: `paddingHorizontal: 20` — both tab and stack screens
- Card border radius: `borderRadius: 16` — cards, rows, and modal/form inputs
- Icon container: `width: 42, height: 42, borderRadius: 13` — colored icon bg circles in NavRows
- NavRow icon size: `size={20}` — Feather icon inside the 42px container
- **Category & Savings Wallet icons: Use `MaterialCommunityIcons` via `<CategoryIcon name={...} size={...} color={...} />` from `@/components/CategoryIcon`. All category icons and savings wallet icons use MCIcons. Only Feather-specific UI icons (chevrons, x, edit-2, etc.) use Feather directly.**
- Badge/chip: `borderRadius: 20` — filter pills and status badges use 20 (pill shape)
- Back button (stack screens): circle `width: 36, height: 36, borderRadius: 18, backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border` with chevron `size={18}`
- Item gap in lists: consistent spacing via `gap: 8` or `marginBottom: 8` between list items

**Tab Screen Bottom Padding:** All 5 tab screens use `paddingBottom: insets.bottom + (Platform.OS === "web" ? 90 : 110)` to clear the tab bar (84px on web, ~83px on iOS, ~56px on Android).
**Stack Screen Bottom Padding:** `paddingBottom: insets.bottom + 30`

## Project Structure
```
app/                  Expo Router screens (file-based routing)
  (tabs)/             Bottom tab screens (Home, Transactions, Savings, Statistics, More)
  (modals)/           Modal forms (account, transaction, commitment, savings, etc.)
  accounts/           Account detail & list screens
  categories/         Categories management screen
  commitments/        Commitments list & detail screens
  savings/            Savings wallet detail screen
  settings/           Settings screen
assets/               Images, icons, splash screens
components/           Shared UI components
  ui/                 Base UI primitives (AppButton, AppInput, Badge, EmptyState, ProgressBar, ThemedText, ThemedView)
database/             PostgreSQL schema (Drizzle ORM)
  schema.ts           All table definitions and relations
hooks/                Custom React hooks (useDebounce, useMonthPicker)
i18n/                 Translations (ar.ts, en.ts, index.ts)
navigation/           Route constants (routes.ts)
server/               Express backend
  db.ts               Database connection
  routes.ts           All REST API endpoints
  storage.ts          Database access layer
  templates/          Landing page HTML
services/             API service layer
  api.ts              React Query client, apiRequest, getApiUrl
store/                React Context providers (one per domain)
  AppContext.tsx       Theme, language, settings
  AccountsContext.tsx
  TransactionsContext.tsx
  CommitmentsContext.tsx
  SavingsContext.tsx
  CategoriesContext.tsx
theme/                Design system
  colors.ts           LightTheme, DarkTheme, shadow utilities, type Theme
types/                TypeScript type definitions
  index.ts            All shared types
utils/                Utility functions
  currency.ts         CURRENCIES list, formatCurrency, getCurrencyInfo
  date.ts             Date helpers, isReservedOn28th, formatDate
  defaults.ts         Default data generators
  display.ts          Display/label helpers
  id.ts               generateId, now
  storage.ts          AsyncStorage helpers with KEYS
  translate.ts        MyMemory auto-translation
```

## Feature Status (Current)
- **Plans/Budget**: Permanently removed — no UI, no routes, no translations, no backend endpoints.
- **Favorites on Categories**: Permanently removed from UI. `is_favorite: false` is still sent to DB on category create (schema unchanged for backward-compat). No star badges, no sorting by favorite, no toggleFavorite function.
- **Commitments**: Always manual. `recurrence_type` always `"none"`. `is_manual` always `true`. No recurring auto-generation.
- **CategoryPickerModal**: Unified across all 4 forms (add-transaction, commitment-form, savings-movement, QuickAddSheet). 3-column grid with search.
- **Splash Screen**: 3-second video splash (assets/videos/splash.mp4, 316KB). `playingChange` event triggers `SplashScreen.hideAsync()`. 5s fallback timeout.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture
### Frontend (React Native / Expo)
The frontend is built with Expo SDK 54 and Expo Router v6 for file-based navigation. It uses React 19 with the new architecture enabled. Navigation includes bottom-tab screens for dashboard, transactions, savings, statistics, and a 'More' menu, along with modal screens for all create/edit forms. UI adapts to platforms using `expo-glass-effect` on iOS and falls back to classic Expo `Tabs` on Android/web. Styling is managed via StyleSheet-based inline styles with a comprehensive theme system (light/dark/auto) that includes new semantic color tokens and full RTL layout support. Animations are handled by `react-native-reanimated` and `react-native-gesture-handler`, with `expo-haptics` for tactile feedback.

### State Management
State is managed through a system of React Context Providers, each dedicated to a specific domain (e.g., `AccountsContext`, `TransactionsContext`, `SavingsContext`). These contexts load data from AsyncStorage on mount, persist changes on every mutation, and provide typed hooks for data access.

### Data Persistence
Masarifi employs a hybrid storage approach, prioritizing API data with AsyncStorage serving as an offline cache and migration fallback. The backend uses PostgreSQL with Drizzle ORM. The app follows an API sync pattern: data loads from the API, migrates from AsyncStorage to API if the API is empty, then keeps both in sync with optimistic state updates. IDs are generated client-side. The system operates in a single-user mode with a `DEFAULT_USER_ID`.

### Internationalization (i18n)
The app supports Arabic (RTL default) and English, with language selection persisted in settings. All UI strings are managed via a centralized translation object. Bilingual name inputs use auto-translation via the MyMemory API. RTL layout is dynamically handled by adjusting `flexDirection`.

### Currency Support
The application supports key Gulf-region currencies (QAR, SAR, AED, KWD, BHD, OMR) alongside USD, EUR, and GBP, each configured with bilingual names, country flag emojis, proper decimal precision, and display symbols.

### Backend (Express.js + PostgreSQL)
The backend is an Express server that serves static Expo web build files and provides a comprehensive REST API for all entities (accounts, categories, transactions, transfers, savings, commitments). It uses Drizzle ORM for PostgreSQL interactions with fully-typed `norm*` functions (one per entity) that convert Drizzle rows to API responses. A `toNumber()` helper handles Postgres `numeric` → JS number coercion. All route handlers have try/catch with an `errMsg()` helper for safe error extraction.

### Code Quality Standards
- **server/routes.ts**: `norm*` functions use Drizzle `$inferSelect` types. `toNumber()` replaces inline ternary coercions. `toIso`/`toIsoOrNull` are documented with JSDoc.
- **store/CommitmentsContext.tsx**: `MAX_RECURRENCE_STEPS = 730` constant (not a magic number). Status sync uses `Map<id, status>` (not array-index comparison). `allocatedMoneyForAccount` and `reservedMoneyForDailyLimit` are documented with JSDoc.
- **store/TransactionsContext.tsx**: Variable names use full domain words (`apiTransactions`, `localTransfers`, `transfer`, `newTransfer`). Hydration branches are commented.
- **store/SavingsContext.tsx**: `addSavingsTransaction` delta logic is documented. Default wallet creation is commented. All hydration branches labeled.
- **components/Toast.tsx**: `pointerEvents` lives on outer `View` (not `Animated.View`) to prevent React Native Web deprecation warning.
- **Remaining known warnings**: `props.pointerEvents is deprecated` — emitted by `react-native-screens@4.16.0` and `react-native-web@0.21.2` internals, not by application code. Unfixable without upgrading those libraries.

## UI Patterns

### Empty States
All screens use the `EmptyState` component (`components/ui/EmptyState.tsx`) when there is no data to display. Every empty state includes:
- **Icon**: Feather icon in a 64×64 circle with `theme.cardSecondary` background
- **Title**: Primary message (e.g. "لا توجد عمليات" / "No transactions yet")
- **Subtitle**: Helpful guidance text explaining what the user can do
- **Action** (optional): A pressable button to create the first item

Screens with empty states: Transactions, Transfers, Commitments, Savings (wallets + movements), Accounts, Categories, and the Home screen recent-transactions section.

### Toast Notifications
All modal forms show toast feedback via the `Toast` component (`components/Toast.tsx`):
- **Success** (green): After saving any record
- **Info** (blue): After deleting any record
- **Error** (red): When an unexpected error occurs
Usage: `const { showToast } = useApp()` → `showToast(t.toast.saved)` / `showToast(t.toast.error, "error")`

## External Dependencies
- **PostgreSQL**: Primary database for all application data.
- **Drizzle ORM**: Used for interacting with the PostgreSQL database from the Express backend.
- **React Native**: Core framework for mobile app development.
- **Expo**: Framework for building universal React applications.
- **Expo Router**: File-based routing for Expo applications.
- **react-native-reanimated**: For animations and gestures.
- **react-native-gesture-handler**: For handling touch and gesture interactions.
- **expo-haptics**: For providing haptic feedback.
- **expo-glass-effect**: For iOS-specific UI effects.
- **MyMemory API**: Used for auto-translation in bilingual name inputs.
- **AsyncStorage**: Local storage solution for offline caching and device preferences.
- **react-native-svg**: Used for rendering charts and graphics in statistics.
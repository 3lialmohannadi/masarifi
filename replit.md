# Masarifi - Personal Finance App

## Overview
Masarifi is a bilingual (Arabic/English) personal finance mobile app built with React Native and Expo, targeting users in the Gulf region. It offers comprehensive money management features including accounts, transactions, transfers, savings with goal tracking, recurring commitments, financial plans, monthly budgets, and detailed statistics. The app supports multiple Gulf currencies and provides a holistic view of personal finances. The vision is to empower users with robust tools for financial planning and tracking, leveraging local market understanding and advanced mobile technology.

## Design System
**Color Palette (Teal FinTech):**
- Primary: `#2F8F83` (teal)
- Background (light): `#F4F7F7`
- Background (dark): `#0F1E1C`
- Card (light): `#FFFFFF` with `#D4E4E2` border + subtle teal shadow
- Card (dark): `#1A2E2B` with `#2A4440` border
- Text (light): `#1F2A44`, Text (dark): `#E8F2F1`
- Hero sections: teal `#2F8F83` (light) / dark teal `#132825` (dark) with `borderBottomRadius: 32`

**Card Shadows:** Platform-aware — `boxShadow` on web, native `shadow*` props on iOS/Android (light mode only). Shadow utility functions (`cardShadow`, `strongShadow`, `subtleShadow`) are exported from `constants/colors.ts`. Use these helpers for new components.

**Design Tokens (strictly enforced across all screens):**
- Screen title: `fontSize: 22, fontWeight: "800"` — applies to ALL screens (tab and stack)
- Screen horizontal padding: `paddingHorizontal: 20` — both tab and stack screens
- Card border radius: `borderRadius: 16` — cards, rows, and modal/form inputs
- Icon container: `width: 42, height: 42, borderRadius: 13` — colored icon bg circles in NavRows
- NavRow icon size: `size={20}` — Feather icon inside the 42px container
- Badge/chip: `borderRadius: 20` — filter pills and status badges use 20 (pill shape)
- Back button (stack screens): circle `width: 36, height: 36, borderRadius: 18, backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border` with chevron `size={18}`
- Item gap in lists: consistent spacing via `gap: 8` or `marginBottom: 8` between list items

**Tab Screen Bottom Padding:** All 5 tab screens use `paddingBottom: insets.bottom + (Platform.OS === "web" ? 90 : 110)` to clear the tab bar (84px on web, ~83px on iOS, ~56px on Android).
**Stack Screen Bottom Padding:** `paddingBottom: insets.bottom + 30`

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
The backend is an Express server that serves static Expo web build files and provides a comprehensive REST API for all entities (accounts, categories, transactions, savings, commitments, plans, budgets). It uses Drizzle ORM for PostgreSQL interactions, handles numeric normalization, and manages timestamp fields.

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
const emerald = "#10B981";
const emeraldDark = "#059669";
const emeraldLight = "#34D399";
const navy = "#0A1628";
const navyMid = "#111827";
const navyCard = "#1A2540";
const navyBorder = "#253355";

export const AppColors = {
  emerald,
  emeraldDark,
  emeraldLight,
  income: "#22C55E",
  expense: "#EF4444",
  savings: "#3B82F6",
  commitment: "#F59E0B",
  plan: "#8B5CF6",
  transfer: "#06B6D4",
  warning: "#F59E0B",
  error: "#EF4444",
  success: "#22C55E",
  currencies: {
    QAR: "#8B5CF6",
    USD: "#22C55E",
    EUR: "#3B82F6",
    SAR: "#10B981",
    AED: "#F59E0B",
    GBP: "#EC4899",
    KWD: "#06B6D4",
    BHD: "#F97316",
    OMR: "#14B8A6",
  },
};

export const LightTheme = {
  background: "#F8FAFC",
  backgroundSecondary: "#EFF6FF",
  card: "#FFFFFF",
  cardSecondary: "#F1F5F9",
  border: "#E2E8F0",
  borderLight: "#F1F5F9",
  text: "#0F172A",
  textSecondary: "#475569",
  textMuted: "#94A3B8",
  primary: emerald,
  primaryDark: emeraldDark,
  primaryLight: "#DCFCE7",
  tabBar: "#FFFFFF",
  header: "#FFFFFF",
  input: "#F8FAFC",
  inputBorder: "#E2E8F0",
  shadow: "#000000",
  overlay: "rgba(0,0,0,0.5)",
  income: "#22C55E",
  expense: "#EF4444",
  incomeBackground: "#F0FDF4",
  expenseBackground: "#FEF2F2",
  ...AppColors,
};

export const DarkTheme = {
  background: navy,
  backgroundSecondary: "#0D1A2E",
  card: navyCard,
  cardSecondary: navyMid,
  border: navyBorder,
  borderLight: "#1E2D4A",
  text: "#F1F5F9",
  textSecondary: "#94A3B8",
  textMuted: "#475569",
  primary: emerald,
  primaryDark: emeraldDark,
  primaryLight: "#064E3B",
  tabBar: navyMid,
  header: navyMid,
  input: navyMid,
  inputBorder: navyBorder,
  shadow: "#000000",
  overlay: "rgba(0,0,0,0.7)",
  income: "#22C55E",
  expense: "#EF4444",
  incomeBackground: "#052e16",
  expenseBackground: "#450a0a",
  ...AppColors,
};

export type Theme = typeof LightTheme;

export default {
  light: {
    text: "#0F172A",
    background: "#F8FAFC",
    tint: emerald,
    tabIconDefault: "#94A3B8",
    tabIconSelected: emerald,
  },
  dark: {
    text: "#F1F5F9",
    background: navy,
    tint: emerald,
    tabIconDefault: "#475569",
    tabIconSelected: emerald,
  },
};

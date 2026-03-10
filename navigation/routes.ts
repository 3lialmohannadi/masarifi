export const ROUTES = {
  TABS: {
    HOME: "/(tabs)/",
    TRANSACTIONS: "/(tabs)/transactions",
    SAVINGS: "/(tabs)/savings",
    STATISTICS: "/(tabs)/statistics",
    MORE: "/(tabs)/more",
  },
  MODALS: {
    ADD_TRANSACTION: "/(modals)/add-transaction",
    ACCOUNT_FORM: "/(modals)/account-form",
    CATEGORY_FORM: "/(modals)/category-form",
    BUDGET_FORM: "/(modals)/budget-form",
    COMMITMENT_FORM: "/(modals)/commitment-form",
    PLAN_FORM: "/(modals)/plan-form",
    PLAN_CATEGORY_FORM: "/(modals)/plan-category-form",
    SAVINGS_WALLET_FORM: "/(modals)/saving-wallet-form",
    SAVINGS_MOVEMENT: "/(modals)/savings-movement",
    TRANSFER_FORM: "/(modals)/transfer-form",
    TRANSFER_DETAIL: "/(modals)/transfer-detail",
  },
  ACCOUNTS: {
    LIST: "/accounts/list",
    DETAIL: (id: string) => `/accounts/${id}` as const,
  },
  COMMITMENTS: {
    INDEX: "/commitments",
    DETAIL: (id: string) => `/commitments/${id}` as const,
  },
  PLANS: {
    INDEX: "/plans",
    DETAIL: (id: string) => `/plans/${id}` as const,
  },
  SAVINGS: {
    DETAIL: (id: string) => `/savings/${id}` as const,
  },
  BUDGET: "/budget",
  CATEGORIES: "/categories",
  SETTINGS: "/settings",
} as const;

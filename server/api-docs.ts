/**
 * OpenAPI 3.0 specification for the Masarifi API.
 * Served at GET /api/docs for reference.
 */
export const apiSpec = {
  openapi: "3.0.3",
  info: {
    title: "Masarifi API",
    description: "Personal finance management API with bilingual (Arabic/English) support",
    version: "1.0.0",
  },
  servers: [
    { url: "/api", description: "API base" },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
    schemas: {
      Error: {
        type: "object",
        properties: {
          message: { type: "string" },
          errors: {
            type: "array",
            items: {
              type: "object",
              properties: {
                field: { type: "string" },
                message: { type: "string" },
              },
            },
          },
        },
      },
      AuthResponse: {
        type: "object",
        properties: {
          token: { type: "string" },
          userId: { type: "string" },
        },
      },
      Account: {
        type: "object",
        properties: {
          id: { type: "string" },
          user_id: { type: "string" },
          name_ar: { type: "string" },
          name_en: { type: "string" },
          type: { type: "string", enum: ["current", "cash", "travel", "savings_bank", "wallet", "credit", "investment"] },
          balance: { type: "number" },
          currency: { type: "string" },
          color: { type: "string" },
          icon: { type: "string" },
          is_active: { type: "boolean" },
          created_at: { type: "string", format: "date-time" },
          updated_at: { type: "string", format: "date-time" },
        },
      },
      Category: {
        type: "object",
        properties: {
          id: { type: "string" },
          name_ar: { type: "string" },
          name_en: { type: "string" },
          icon: { type: "string" },
          color: { type: "string" },
          type: { type: "string", enum: ["income", "expense", "savings", "commitment", "plan", "general"] },
          is_default: { type: "boolean" },
          is_active: { type: "boolean" },
          is_favorite: { type: "boolean" },
          created_at: { type: "string", format: "date-time" },
          updated_at: { type: "string", format: "date-time" },
        },
      },
      Transaction: {
        type: "object",
        properties: {
          id: { type: "string" },
          account_id: { type: "string" },
          category_id: { type: "string", nullable: true },
          type: { type: "string", enum: ["income", "expense"] },
          amount: { type: "number" },
          currency: { type: "string" },
          date: { type: "string", format: "date-time" },
          note: { type: "string" },
          created_at: { type: "string", format: "date-time" },
          updated_at: { type: "string", format: "date-time" },
        },
      },
      Transfer: {
        type: "object",
        properties: {
          id: { type: "string" },
          source_account_id: { type: "string" },
          destination_account_id: { type: "string" },
          source_amount: { type: "number" },
          destination_amount: { type: "number" },
          exchange_rate: { type: "number" },
          date: { type: "string", format: "date-time" },
          note: { type: "string" },
          created_at: { type: "string", format: "date-time" },
        },
      },
      SavingsWallet: {
        type: "object",
        properties: {
          id: { type: "string" },
          name_ar: { type: "string" },
          name_en: { type: "string" },
          description: { type: "string" },
          type: { type: "string", enum: ["general_savings", "goal_savings"] },
          current_amount: { type: "number" },
          target_amount: { type: "number", nullable: true },
          target_date: { type: "string", format: "date-time", nullable: true },
          color: { type: "string" },
          icon: { type: "string" },
          is_default: { type: "boolean" },
          is_archived: { type: "boolean" },
          created_at: { type: "string", format: "date-time" },
          updated_at: { type: "string", format: "date-time" },
        },
      },
      SavingsTransaction: {
        type: "object",
        properties: {
          id: { type: "string" },
          wallet_id: { type: "string" },
          account_id: { type: "string", nullable: true },
          type: { type: "string", enum: ["deposit_internal", "deposit_external", "withdraw_internal", "withdraw_external"] },
          amount: { type: "number" },
          date: { type: "string", format: "date-time" },
          note: { type: "string" },
          created_at: { type: "string", format: "date-time" },
        },
      },
      Commitment: {
        type: "object",
        properties: {
          id: { type: "string" },
          account_id: { type: "string" },
          category_id: { type: "string", nullable: true },
          name_ar: { type: "string" },
          name_en: { type: "string" },
          amount: { type: "number" },
          due_date: { type: "string", format: "date-time" },
          recurrence_type: { type: "string", enum: ["none", "daily", "weekly", "monthly", "yearly"] },
          status: { type: "string", enum: ["upcoming", "due_today", "overdue", "paid"] },
          is_manual: { type: "boolean" },
          paid_at: { type: "string", format: "date-time", nullable: true },
          note: { type: "string" },
          created_at: { type: "string", format: "date-time" },
          updated_at: { type: "string", format: "date-time" },
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
  paths: {
    "/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Register a new user",
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["username", "password"],
                properties: {
                  username: { type: "string", minLength: 3, maxLength: 50 },
                  password: { type: "string", minLength: 6, maxLength: 128 },
                },
              },
            },
          },
        },
        responses: {
          "201": { description: "User registered", content: { "application/json": { schema: { $ref: "#/components/schemas/AuthResponse" } } } },
          "400": { description: "Validation error", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          "409": { description: "Username already exists" },
        },
      },
    },
    "/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Login with username and password",
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["username", "password"],
                properties: {
                  username: { type: "string" },
                  password: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Login successful", content: { "application/json": { schema: { $ref: "#/components/schemas/AuthResponse" } } } },
          "401": { description: "Invalid credentials" },
        },
      },
    },
    "/accounts": {
      get: {
        tags: ["Accounts"], summary: "List all accounts",
        responses: { "200": { description: "OK", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Account" } } } } } },
      },
      post: {
        tags: ["Accounts"], summary: "Create an account",
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/Account" } } } },
        responses: { "200": { description: "Created", content: { "application/json": { schema: { $ref: "#/components/schemas/Account" } } } }, "400": { description: "Validation error" } },
      },
    },
    "/accounts/{id}": {
      patch: { tags: ["Accounts"], summary: "Update an account", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Updated" }, "404": { description: "Not found" } } },
      delete: { tags: ["Accounts"], summary: "Soft-delete an account", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Deleted" }, "404": { description: "Not found" }, "409": { description: "Has linked commitments" } } },
    },
    "/categories": {
      get: { tags: ["Categories"], summary: "List all categories", responses: { "200": { description: "OK" } } },
      post: { tags: ["Categories"], summary: "Create a category", responses: { "200": { description: "Created" }, "400": { description: "Validation error" } } },
    },
    "/categories/{id}": {
      patch: { tags: ["Categories"], summary: "Update a category", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Updated" }, "404": { description: "Not found" } } },
      delete: { tags: ["Categories"], summary: "Delete a category", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Deleted" }, "409": { description: "In use by transactions" } } },
    },
    "/transactions": {
      get: { tags: ["Transactions"], summary: "List all transactions", responses: { "200": { description: "OK" } } },
      post: { tags: ["Transactions"], summary: "Create a transaction", responses: { "200": { description: "Created" }, "400": { description: "Validation error / amount must be > 0" } } },
    },
    "/transactions/{id}": {
      patch: { tags: ["Transactions"], summary: "Update a transaction", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Updated" }, "404": { description: "Not found" } } },
      delete: { tags: ["Transactions"], summary: "Delete a transaction", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Deleted" }, "404": { description: "Not found" } } },
    },
    "/transfers": {
      get: { tags: ["Transfers"], summary: "List all transfers", responses: { "200": { description: "OK" } } },
      post: { tags: ["Transfers"], summary: "Create a transfer", responses: { "200": { description: "Created" }, "400": { description: "Validation error" } } },
    },
    "/transfers/{id}": {
      delete: { tags: ["Transfers"], summary: "Delete a transfer", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Deleted" }, "404": { description: "Not found" } } },
    },
    "/savings-wallets": {
      get: { tags: ["Savings"], summary: "List savings wallets", responses: { "200": { description: "OK" } } },
      post: { tags: ["Savings"], summary: "Create a savings wallet", responses: { "200": { description: "Created" } } },
    },
    "/savings-wallets/{id}": {
      patch: { tags: ["Savings"], summary: "Update a savings wallet", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Updated" } } },
      delete: { tags: ["Savings"], summary: "Delete a savings wallet", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Deleted" } } },
    },
    "/savings-transactions": {
      get: { tags: ["Savings"], summary: "List savings transactions", parameters: [{ name: "walletId", in: "query", schema: { type: "string" } }], responses: { "200": { description: "OK" } } },
      post: { tags: ["Savings"], summary: "Create a savings transaction", responses: { "200": { description: "Created" } } },
    },
    "/savings-transactions/{id}": {
      delete: { tags: ["Savings"], summary: "Delete a savings transaction", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Deleted" } } },
    },
    "/commitments": {
      get: { tags: ["Commitments"], summary: "List all commitments", responses: { "200": { description: "OK" } } },
      post: { tags: ["Commitments"], summary: "Create a commitment", responses: { "200": { description: "Created" } } },
    },
    "/commitments/{id}": {
      patch: { tags: ["Commitments"], summary: "Update a commitment", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Updated" } } },
      delete: { tags: ["Commitments"], summary: "Delete a commitment", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Deleted" } } },
    },
    "/reset": {
      post: {
        tags: ["Admin"],
        summary: "Reset all user data",
        description: "Deletes all accounts, transactions, transfers, savings, and commitments for the authenticated user. Requires X-Confirm-Reset: true header.",
        parameters: [{ name: "X-Confirm-Reset", in: "header", required: true, schema: { type: "string", enum: ["true"] } }],
        responses: { "200": { description: "Data reset" }, "400": { description: "Missing confirmation header" } },
      },
    },
  },
};

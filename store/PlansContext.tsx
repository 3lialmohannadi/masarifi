import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  ReactNode,
} from "react";
import type { Plan, PlanCategory } from "@/types";
import { loadData, saveData, KEYS } from "@/utils/storage";
import { generateId, now } from "@/utils/id";
import { apiRequest } from "@/services/api";

interface PlansContextValue {
  plans: Plan[];
  planCategories: PlanCategory[];
  addPlan: (p: Omit<Plan, "id" | "created_at" | "updated_at">) => Plan;
  updatePlan: (id: string, updates: Partial<Plan>) => void;
  deletePlan: (id: string) => void;
  getPlan: (id: string) => Plan | undefined;
  addPlanCategory: (pc: Omit<PlanCategory, "id" | "created_at">) => PlanCategory;
  updatePlanCategory: (id: string, updates: Partial<PlanCategory>) => void;
  deletePlanCategory: (id: string) => void;
  getPlanCategories: (planId: string) => PlanCategory[];
  getPlanSpent: (planId: string, transactions: { linked_plan_id?: string; amount: number; type: string }[]) => number;
  getPlanCategorySpent: (planCategoryId: string, transactions: { linked_plan_category_id?: string; amount: number; type: string }[]) => number;
  clearAll: () => void;
  isLoaded: boolean;
}

const PlansContext = createContext<PlansContextValue | null>(null);

export function PlansProvider({ children }: { children: ReactNode }) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [planCategories, setPlanCategories] = useState<PlanCategory[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    Promise.all([
      apiRequest("GET", "/api/plans").then((r) => r.json()).catch(() => null),
      apiRequest("GET", "/api/plan-categories").then((r) => r.json()).catch(() => null),
    ]).then(async ([apiPlans, apiPCs]) => {
      if (apiPlans && apiPlans.length > 0) {
        setPlans(apiPlans);
        saveData(KEYS.PLANS, apiPlans);
      } else {
        const local = await loadData<Plan[]>(KEYS.PLANS);
        if (local && local.length > 0) {
          setPlans(local);
          local.forEach((item) =>
            apiRequest("POST", "/api/plans", item).catch(() => {})
          );
        }
      }

      if (apiPCs && apiPCs.length > 0) {
        setPlanCategories(apiPCs);
        saveData(KEYS.PLAN_CATEGORIES, apiPCs);
      } else {
        const local = await loadData<PlanCategory[]>(KEYS.PLAN_CATEGORIES);
        if (local && local.length > 0) {
          setPlanCategories(local);
          local.forEach((item) =>
            apiRequest("POST", "/api/plan-categories", item).catch(() => {})
          );
        }
      }
      setIsLoaded(true);
    });
  }, []);

  const persistPlans = (data: Plan[]) => {
    setPlans(data);
    saveData(KEYS.PLANS, data);
  };

  const persistPlanCategories = (data: PlanCategory[]) => {
    setPlanCategories(data);
    saveData(KEYS.PLAN_CATEGORIES, data);
  };

  const addPlan = (p: Omit<Plan, "id" | "created_at" | "updated_at">): Plan => {
    const newPlan: Plan = {
      ...p,
      id: generateId(),
      created_at: now(),
      updated_at: now(),
    };
    persistPlans([...plans, newPlan]);
    apiRequest("POST", "/api/plans", newPlan).catch(console.error);
    return newPlan;
  };

  const updatePlan = (id: string, updates: Partial<Plan>) => {
    const updated = plans.map((p) =>
      p.id === id ? { ...p, ...updates, updated_at: now() } : p
    );
    persistPlans(updated);
    const record = updated.find((p) => p.id === id);
    if (record) apiRequest("PATCH", `/api/plans/${id}`, record).catch(console.error);
  };

  const deletePlan = (id: string) => {
    persistPlans(plans.filter((p) => p.id !== id));
    persistPlanCategories(planCategories.filter((pc) => pc.plan_id !== id));
    apiRequest("DELETE", `/api/plans/${id}`).catch(console.error);
  };

  const getPlan = (id: string) => plans.find((p) => p.id === id);

  const addPlanCategory = (pc: Omit<PlanCategory, "id" | "created_at">): PlanCategory => {
    const newPC: PlanCategory = { ...pc, id: generateId(), created_at: now() };
    persistPlanCategories([...planCategories, newPC]);
    apiRequest("POST", "/api/plan-categories", newPC).catch(console.error);
    return newPC;
  };

  const updatePlanCategory = (id: string, updates: Partial<PlanCategory>) => {
    const updated = planCategories.map((pc) =>
      pc.id === id ? { ...pc, ...updates } : pc
    );
    persistPlanCategories(updated);
    const record = updated.find((pc) => pc.id === id);
    if (record) apiRequest("PATCH", `/api/plan-categories/${id}`, record).catch(console.error);
  };

  const deletePlanCategory = (id: string) => {
    persistPlanCategories(planCategories.filter((pc) => pc.id !== id));
    apiRequest("DELETE", `/api/plan-categories/${id}`).catch(console.error);
  };

  const getPlanCategories = (planId: string) =>
    planCategories.filter((pc) => pc.plan_id === planId);

  const getPlanSpent = (
    planId: string,
    transactions: { linked_plan_id?: string; amount: number; type: string }[]
  ) =>
    transactions
      .filter((t) => t.linked_plan_id === planId && t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);

  const getPlanCategorySpent = (
    planCategoryId: string,
    transactions: { linked_plan_category_id?: string; amount: number; type: string }[]
  ) =>
    transactions
      .filter((t) => t.linked_plan_category_id === planCategoryId && t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);

  const clearAll = () => {
    persistPlans([]);
    persistPlanCategories([]);
  };

  const value = useMemo(
    () => ({
      plans,
      planCategories,
      addPlan,
      updatePlan,
      deletePlan,
      getPlan,
      addPlanCategory,
      updatePlanCategory,
      deletePlanCategory,
      getPlanCategories,
      getPlanSpent,
      getPlanCategorySpent,
      clearAll,
      isLoaded,
    }),
    [plans, planCategories, isLoaded]
  );

  return <PlansContext.Provider value={value}>{children}</PlansContext.Provider>;
}

export function usePlans() {
  const ctx = useContext(PlansContext);
  if (!ctx) throw new Error("usePlans must be used within PlansProvider");
  return ctx;
}

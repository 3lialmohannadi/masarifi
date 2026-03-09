import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
  FlatList,
  Alert,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import { useApp } from "@/store/AppContext";
import { useTransactions } from "@/store/TransactionsContext";
import { useAccounts } from "@/store/AccountsContext";
import { useCategories } from "@/store/CategoriesContext";
import { usePlans } from "@/store/PlansContext";
import { AppButton } from "@/components/ui/AppButton";
import { AppInput } from "@/components/ui/AppInput";
import { getDisplayName } from "@/utils/display";
import { formatCurrency } from "@/utils/currency";
import { todayISOString } from "@/utils/date";
import type { TransactionType } from "@/types";

export default function AddTransactionModal() {
  const insets = useSafeAreaInsets();
  const { theme, t, language, selectedAccountId, updateSettings, isRTL } = useApp();
  const { transactions, addTransaction, updateTransaction, deleteTransaction } = useTransactions();
  const { accounts } = useAccounts();
  const { updateBalance } = useAccounts();
  const { categories, getCategoriesByType } = useCategories();
  const { plans, planCategories } = usePlans();
  const params = useLocalSearchParams<{ id?: string }>();

  const existingTx = params.id ? transactions.find((t) => t.id === params.id) : undefined;

  const [type, setType] = useState<TransactionType>(existingTx?.type || "expense");
  const [amount, setAmount] = useState(existingTx ? String(existingTx.amount) : "");
  const [accountId, setAccountId] = useState(existingTx?.account_id || selectedAccountId || accounts[0]?.id || "");
  const [categoryId, setCategoryId] = useState(existingTx?.category_id || "");
  const [date, setDate] = useState(existingTx?.date || todayISOString());
  const [note, setNote] = useState(existingTx?.note || "");
  const [linkedPlanId, setLinkedPlanId] = useState(existingTx?.linked_plan_id || "");
  const [linkedPlanCategoryId, setLinkedPlanCategoryId] = useState(existingTx?.linked_plan_category_id || "");

  const [showAccounts, setShowAccounts] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const [showPlans, setShowPlans] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const relevantCategories = useMemo(
    () => getCategoriesByType(type === "income" ? "income" : "expense"),
    [type, categories]
  );

  const selectedAccount = accounts.find((a) => a.id === accountId);
  const selectedCategory = categories.find((c) => c.id === categoryId);
  const selectedPlan = plans.find((p) => p.id === linkedPlanId);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!amount || parseFloat(amount) <= 0) newErrors.amount = t.validation.amountPositive;
    if (!accountId) newErrors.account = t.validation.accountRequired;
    if (!categoryId) newErrors.category = t.validation.categoryRequired;
    if (!date) newErrors.date = t.validation.dateRequired;
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const amountNum = parseFloat(amount);
      const currency = selectedAccount?.currency || "USD";

      if (existingTx) {
        const oldAmount = existingTx.amount;
        const oldType = existingTx.type;
        const oldAccountId = existingTx.account_id;

        // Reverse old effect
        const oldDelta = oldType === "income" ? -oldAmount : oldAmount;
        updateBalance(oldAccountId, oldDelta);

        // Apply new effect
        const newDelta = type === "income" ? amountNum : -amountNum;
        updateBalance(accountId, newDelta);

        updateTransaction(existingTx.id, {
          type,
          amount: amountNum,
          account_id: accountId,
          category_id: categoryId,
          currency,
          date,
          note,
          linked_plan_id: linkedPlanId || undefined,
          linked_plan_category_id: linkedPlanCategoryId || undefined,
        });
      } else {
        const delta = type === "income" ? amountNum : -amountNum;
        updateBalance(accountId, delta);
        updateSettings({ last_used_category_id: categoryId });
        addTransaction({
          type,
          amount: amountNum,
          account_id: accountId,
          category_id: categoryId,
          currency,
          date,
          note,
          linked_plan_id: linkedPlanId || undefined,
          linked_plan_category_id: linkedPlanCategoryId || undefined,
        });
      }
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(t.common.areYouSure, t.transactions.deleteConfirm, [
      { text: t.common.cancel, style: "cancel" },
      {
        text: t.common.delete,
        style: "destructive",
        onPress: () => {
          if (existingTx) {
            const delta = existingTx.type === "income" ? -existingTx.amount : existingTx.amount;
            updateBalance(existingTx.account_id, delta);
            deleteTransaction(existingTx.id);
          }
          router.back();
        },
      },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      {/* Header */}
      <View
        style={{
          flexDirection: isRTL ? "row-reverse" : "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingTop: insets.top + 16,
          paddingHorizontal: 16,
          paddingBottom: 12,
          backgroundColor: theme.card,
          borderBottomWidth: 1,
          borderBottomColor: theme.border,
        }}
      >
        <Pressable onPress={() => router.back()}>
          <Feather name="x" size={24} color={theme.textSecondary} />
        </Pressable>
        <Text style={{ fontSize: 17, fontWeight: "700", color: theme.text }}>
          {existingTx ? t.transactions.edit : t.transactions.add}
        </Text>
        {existingTx ? (
          <Pressable onPress={handleDelete}>
            <Feather name="trash-2" size={20} color={theme.expense} />
          </Pressable>
        ) : (
          <View style={{ width: 24 }} />
        )}
      </View>

      <ScrollView
        contentContainerStyle={{
          padding: 16,
          paddingBottom: insets.bottom + 30,
          gap: 16,
        }}
      >
        {/* Type Selector */}
        <View
          style={{
            flexDirection: "row",
            backgroundColor: theme.card,
            borderRadius: 14,
            padding: 4,
            gap: 4,
          }}
        >
          {(["expense", "income"] as TransactionType[]).map((ty) => {
            const isActive = type === ty;
            const label = ty === "income" ? t.transactions.income : t.transactions.expense;
            const activeColor = ty === "income" ? theme.income : theme.expense;
            return (
              <Pressable
                key={ty}
                onPress={() => {
                  Haptics.selectionAsync();
                  setType(ty);
                  setCategoryId("");
                }}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 11,
                  alignItems: "center",
                  backgroundColor: isActive ? activeColor : "transparent",
                }}
              >
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: "700",
                    color: isActive ? "#fff" : theme.textSecondary,
                  }}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Amount */}
        <AppInput
          label={t.common.amount}
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
          placeholder="0.00"
          error={errors.amount}
          textAlign="center"
          style={{ fontSize: 28, fontWeight: "700", textAlign: "center" }}
        />

        {/* Account */}
        <View style={{ gap: 6 }}>
          <Text style={{ fontSize: 13, fontWeight: "500", color: theme.textSecondary, textAlign: isRTL ? "right" : "left" }}>
            {t.transactions.account}
          </Text>
          <Pressable
            onPress={() => setShowAccounts(true)}
            style={{
              backgroundColor: theme.input,
              borderRadius: 12,
              borderWidth: 1.5,
              borderColor: errors.account ? "#EF4444" : theme.inputBorder,
              padding: 13,
              flexDirection: isRTL ? "row-reverse" : "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            {selectedAccount ? (
              <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 8 }}>
                <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: selectedAccount.color }} />
                <Text style={{ color: theme.text, fontSize: 15, fontWeight: "500" }}>
                  {getDisplayName(selectedAccount, language)}
                </Text>
                <Text style={{ color: theme.textSecondary, fontSize: 13 }}>
                  ({formatCurrency(selectedAccount.balance, selectedAccount.currency, language)})
                </Text>
              </View>
            ) : (
              <Text style={{ color: theme.textMuted, fontSize: 15 }}>
                {t.transactions.selectAccount}
              </Text>
            )}
            <Feather name="chevron-down" size={16} color={theme.textMuted} />
          </Pressable>
          {errors.account && (
            <Text style={{ fontSize: 12, color: "#EF4444" }}>{errors.account}</Text>
          )}
        </View>

        {/* Category */}
        <View style={{ gap: 6 }}>
          <Text style={{ fontSize: 13, fontWeight: "500", color: theme.textSecondary, textAlign: isRTL ? "right" : "left" }}>
            {t.transactions.category}
          </Text>
          <Pressable
            onPress={() => setShowCategories(true)}
            style={{
              backgroundColor: theme.input,
              borderRadius: 12,
              borderWidth: 1.5,
              borderColor: errors.category ? "#EF4444" : theme.inputBorder,
              padding: 13,
              flexDirection: isRTL ? "row-reverse" : "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            {selectedCategory ? (
              <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 8 }}>
                <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: `${selectedCategory.color}20`, alignItems: "center", justifyContent: "center" }}>
                  <Feather name={selectedCategory.icon as any} size={14} color={selectedCategory.color} />
                </View>
                <Text style={{ color: theme.text, fontSize: 15, fontWeight: "500" }}>
                  {getDisplayName(selectedCategory, language)}
                </Text>
              </View>
            ) : (
              <Text style={{ color: theme.textMuted, fontSize: 15 }}>
                {t.transactions.selectCategory}
              </Text>
            )}
            <Feather name="chevron-down" size={16} color={theme.textMuted} />
          </Pressable>
          {errors.category && (
            <Text style={{ fontSize: 12, color: "#EF4444" }}>{errors.category}</Text>
          )}
        </View>

        {/* Date */}
        <AppInput
          label={t.common.date}
          value={date}
          onChangeText={setDate}
          placeholder="YYYY-MM-DD"
          error={errors.date}
        />

        {/* Note */}
        <AppInput
          label={`${t.common.note} (${t.common.optional})`}
          value={note}
          onChangeText={setNote}
          placeholder={language === "ar" ? "ملاحظة..." : "Note..."}
          multiline
        />

        {/* Link to Plan (for expense) */}
        {type === "expense" && plans.length > 0 && (
          <View style={{ gap: 6 }}>
            <Text style={{ fontSize: 13, fontWeight: "500", color: theme.textSecondary, textAlign: isRTL ? "right" : "left" }}>
              {t.transactions.linkedPlan} ({t.common.optional})
            </Text>
            <Pressable
              onPress={() => setShowPlans(true)}
              style={{
                backgroundColor: theme.input,
                borderRadius: 12,
                borderWidth: 1.5,
                borderColor: theme.inputBorder,
                padding: 13,
                flexDirection: isRTL ? "row-reverse" : "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Text style={{ color: selectedPlan ? theme.text : theme.textMuted, fontSize: 15 }}>
                {selectedPlan ? getDisplayName(selectedPlan, language) : t.transactions.selectPlan}
              </Text>
              <Feather name="chevron-down" size={16} color={theme.textMuted} />
            </Pressable>
          </View>
        )}

        <AppButton
          title={existingTx ? t.common.save : t.common.add}
          onPress={handleSave}
          loading={loading}
          fullWidth
          size="lg"
        />
      </ScrollView>

      {/* Account Picker */}
      <SelectorModal
        visible={showAccounts}
        onClose={() => setShowAccounts(false)}
        title={t.transactions.selectAccount}
        theme={theme}
      >
        <FlatList
          data={accounts.filter((a) => a.is_active)}
          keyExtractor={(a) => a.id}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => {
                setAccountId(item.id);
                setShowAccounts(false);
              }}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                padding: 14,
                backgroundColor: item.id === accountId ? theme.primaryLight : "transparent",
                borderRadius: 12,
                marginHorizontal: 8,
                marginVertical: 2,
              }}
            >
              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: item.color }} />
              <Text style={{ flex: 1, color: theme.text, fontWeight: "500" }}>
                {getDisplayName(item, language)}
              </Text>
              <Text style={{ color: theme.textSecondary, fontSize: 13 }}>
                {formatCurrency(item.balance, item.currency, language)}
              </Text>
            </Pressable>
          )}
        />
      </SelectorModal>

      {/* Category Picker */}
      <SelectorModal
        visible={showCategories}
        onClose={() => setShowCategories(false)}
        title={t.transactions.selectCategory}
        theme={theme}
      >
        <FlatList
          data={relevantCategories}
          keyExtractor={(c) => c.id}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => {
                setCategoryId(item.id);
                setShowCategories(false);
              }}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                padding: 14,
                backgroundColor: item.id === categoryId ? theme.primaryLight : "transparent",
                borderRadius: 12,
                marginHorizontal: 8,
                marginVertical: 2,
              }}
            >
              <View style={{ width: 36, height: 36, borderRadius: 9, backgroundColor: `${item.color}20`, alignItems: "center", justifyContent: "center" }}>
                <Feather name={item.icon as any} size={18} color={item.color} />
              </View>
              <Text style={{ flex: 1, color: theme.text, fontWeight: "500" }}>
                {getDisplayName(item, language)}
              </Text>
              {item.is_favorite && (
                <Feather name="star" size={14} color="#F59E0B" />
              )}
            </Pressable>
          )}
          ListEmptyComponent={
            <Text style={{ color: theme.textMuted, textAlign: "center", padding: 20 }}>
              {t.categories.noCategories}
            </Text>
          }
        />
      </SelectorModal>

      {/* Plan Picker */}
      <SelectorModal
        visible={showPlans}
        onClose={() => setShowPlans(false)}
        title={t.transactions.selectPlan}
        theme={theme}
      >
        <FlatList
          data={[{ id: "", name_ar: "لا يوجد", name_en: "None", color: theme.textMuted }, ...plans] as any[]}
          keyExtractor={(p) => p.id}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => {
                setLinkedPlanId(item.id);
                setLinkedPlanCategoryId("");
                setShowPlans(false);
              }}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                padding: 14,
                backgroundColor: item.id === linkedPlanId ? theme.primaryLight : "transparent",
                borderRadius: 12,
                marginHorizontal: 8,
                marginVertical: 2,
              }}
            >
              <Text style={{ flex: 1, color: theme.text, fontWeight: "500" }}>
                {getDisplayName(item, language)}
              </Text>
            </Pressable>
          )}
        />
      </SelectorModal>
    </View>
  );
}

function SelectorModal({
  visible,
  onClose,
  title,
  theme,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  theme: any;
  children: React.ReactNode;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
        <View style={{ backgroundColor: theme.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: "70%", paddingVertical: 8 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12 }}>
            <Text style={{ fontSize: 17, fontWeight: "700", color: theme.text }}>{title}</Text>
            <Pressable onPress={onClose}>
              <Feather name="x" size={22} color={theme.textSecondary} />
            </Pressable>
          </View>
          {children}
          <View style={{ height: 20 }} />
        </View>
      </View>
    </Modal>
  );
}

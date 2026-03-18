import React, { useState, useMemo } from "react";
import type { Theme } from "@/theme/colors";
import {
  View,
  Text,
  Pressable,
  TextInput,
  Modal,
  FlatList,
  Platform,
} from "react-native";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { CategoryIcon } from "@/components/CategoryIcon";
import { router, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import { useApp } from "@/store/AppContext";
import { useTransactions } from "@/store/TransactionsContext";
import { useAccounts } from "@/store/AccountsContext";
import { useCategories } from "@/store/CategoriesContext";
import { AppButton } from "@/components/ui/AppButton";
import { SuccessOverlay } from "@/components/ui/SuccessOverlay";
import { getDisplayName } from "@/utils/display";
import { formatCurrency } from "@/utils/currency";
import { todayISOString, isValidDate } from "@/utils/date";
import { SMART_SUGGESTIONS } from "@/utils/defaults";
import { DatePickerModal } from "@/components/DatePickerModal";
import { CategoryPickerModal } from "@/components/CategoryPickerModal";
import type { TransactionType, Category } from "@/types";

function TxField({
  label,
  children,
  error,
  required,
}: {
  label: string;
  children: React.ReactNode;
  error?: string;
  required?: boolean;
}) {
  const { theme, isRTL } = useApp();
  return (
    <View style={{ gap: 6 }}>
      <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 4 }}>
        <Text style={{ fontSize: 13, fontWeight: "600", color: theme.textSecondary }}>
          {label}
        </Text>
        {required && <Text style={{ fontSize: 12, color: theme.expense }}>*</Text>}
      </View>
      {children}
      {!!error && (
        <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 4 }}>
          <Feather name="alert-circle" size={12} color="#EF4444" />
          <Text style={{ fontSize: 12, color: "#EF4444" }}>{error}</Text>
        </View>
      )}
    </View>
  );
}

export default function AddTransactionModal() {
  const insets = useSafeAreaInsets();
  const { theme, t, language, selectedAccountId, updateSettings, isRTL, settings, showToast } = useApp();
  const { transactions, addTransaction, updateTransaction, deleteTransaction } = useTransactions();
  const { accounts, updateBalance } = useAccounts();
  const { categories } = useCategories();
  const params = useLocalSearchParams<{ id?: string; type?: string; accountId?: string }>();

  const existingTx = params.id ? transactions.find((tx) => tx.id === params.id) : undefined;

  const [type, setType] = useState<TransactionType>(
    existingTx?.type || (params.type === "income" ? "income" : "expense")
  );
  const [amount, setAmount] = useState(existingTx ? String(existingTx.amount) : "");
  const [accountId, setAccountId] = useState(
    existingTx?.account_id ||
      params.accountId ||
      selectedAccountId ||
      accounts.find((a) => a.is_active)?.id ||
      ""
  );
  const [categoryId, setCategoryId] = useState(existingTx?.category_id || "");
  const [date, setDate] = useState(existingTx?.date || todayISOString());
  const [note, setNote] = useState(existingTx?.note || "");
  const [showAccounts, setShowAccounts] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const relevantCategories = useMemo(
    () =>
      [...categories],
    [categories]
  );

  const smartSuggestion = useMemo<Category | null>(() => {
    if (!note.trim()) return null;
    const lower = note.toLowerCase().trim();
    const words = lower.split(/\s+/);
    for (const word of words) {
      const names = SMART_SUGGESTIONS[word];
      if (names) {
        const matched = relevantCategories.find(
          (c) => c.name_ar === names[0] || c.name_en === names[1]
        );
        if (matched) return matched;
      }
    }
    return null;
  }, [note, relevantCategories]);

  const showSmartSuggestion = !!smartSuggestion && smartSuggestion.id !== categoryId;

  const activeAccounts = accounts.filter((a) => a.is_active);
  const selectedAccount = accounts.find((a) => a.id === accountId);
  const selectedCategory = categories.find((c) => c.id === categoryId);
  // Pre-select last used category for new transactions (one-time init)
  const categoryInitialized = React.useRef(false);
  React.useEffect(() => {
    if (existingTx || categoryInitialized.current) return;
    const key = settings.last_used_category_id;
    const found = key ? relevantCategories.find((c) => c.id === key) : null;
    if (found) setCategoryId(found.id);
    categoryInitialized.current = true;
  }, [relevantCategories]); // eslint-disable-line react-hooks/exhaustive-deps

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    const amountNum = parseFloat(amount);
    if (!amount || isNaN(amountNum) || amountNum <= 0)
      errs.amount = t.validation.amountPositive;
    if (!accountId) errs.account = t.validation.accountRequired;
    if (!categoryId) errs.category = t.validation.categoryRequired;
    if (!date) errs.date = t.validation.dateRequired;
    else if (!isValidDate(date)) errs.date = t.validation.dateInvalid;
    if (!type) errs.type = t.validation.typeRequired;
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const amountNum = parseFloat(amount);
      const currency = selectedAccount?.currency || "USD";

      if (existingTx) {
        // Reverse old balance effect
        const oldDelta = existingTx.type === "income" ? -existingTx.amount : existingTx.amount;
        updateBalance(existingTx.account_id, oldDelta);
        // Apply new balance effect
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
        });
      } else {
        const delta = type === "income" ? amountNum : -amountNum;
        updateBalance(accountId, delta);
        if (categoryId) updateSettings({ last_used_category_id: categoryId });
        const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
        const remainingDays = daysInMonth - new Date().getDate() + 1;
        const acctBalance = accounts.find((a) => a.id === accountId)?.balance || 0;
        const smartLimit = acctBalance > 0 ? acctBalance / remainingDays : 0;
        const dailyLimit = settings.daily_limit_mode === "manual" && settings.manual_daily_limit > 0
          ? settings.manual_daily_limit
          : smartLimit;
        addTransaction(
          { type, amount: amountNum, account_id: accountId, category_id: categoryId, currency, date, note },
          { enabled: settings.notification_enabled && type === "expense", dailyLimit }
        );
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        router.back();
      }, 700);
    } catch {
      showToast(t.toast.error, "error");
    } finally {
      setLoading(false);
    }
  };

  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const handleDelete = () => setShowConfirmDelete(true);

  const confirmDelete = () => {
    if (existingTx) {
      const delta = existingTx.type === "income" ? -existingTx.amount : existingTx.amount;
      updateBalance(existingTx.account_id, delta);
      deleteTransaction(existingTx.id);
    }
    showToast(t.toast.transactionDeleted, "info");
    router.back();
  };

  const setQuickDate = (daysAgo: number) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    setDate(d.toISOString().split("T")[0]);
    if (errors.date) setErrors((e) => ({ ...e, date: "" }));
  };

  const pickerStyle = (hasError: boolean) => ({
    backgroundColor: theme.input,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: hasError ? "#EF4444" : theme.inputBorder,
    padding: 13,
    flexDirection: (isRTL ? "row-reverse" : "row") as "row" | "row-reverse",
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
  });

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      {/* Header */}
      <View
        style={{
          flexDirection: isRTL ? "row-reverse" : "row",
          alignItems: "center",
          gap: 12,
          paddingTop: Platform.OS === "web" ? insets.top + 67 : insets.top + 16,
          paddingHorizontal: 16,
          paddingBottom: 14,
          backgroundColor: theme.card,
          borderBottomWidth: 1,
          borderBottomColor: theme.border,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: theme.background, borderWidth: 1, borderColor: theme.border, alignItems: "center", justifyContent: "center" }}
        >
          <Feather name="x" size={18} color={theme.text} />
        </Pressable>
        <Text style={{ flex: 1, fontSize: 22, fontWeight: "700", color: theme.text, textAlign: isRTL ? "right" : "left" }}>
          {existingTx ? t.transactions.edit : t.transactions.add}
        </Text>
        {existingTx ? (
          <Pressable
            onPress={handleDelete}
            hitSlop={8}
            style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: theme.expense + "15", borderWidth: 1, borderColor: theme.expense + "30", alignItems: "center", justifyContent: "center" }}
          >
            <Feather name="trash-2" size={18} color={theme.expense} />
          </Pressable>
        ) : (
          <View style={{ width: 36 }} />
        )}
      </View>

      <KeyboardAwareScrollViewCompat
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 40, gap: 18 }}
        bottomOffset={60}
      >
        {/* ── Type Selector ── */}
        <View
          style={{
            flexDirection: isRTL ? "row-reverse" : "row",
            backgroundColor: theme.card,
            borderRadius: 14,
            padding: 4,
            gap: 4,
            borderWidth: 1,
            borderColor: errors.type ? "#EF4444" : theme.border,
          }}
        >
          {(["expense", "income"] as TransactionType[]).map((ty) => {
            const isActive = type === ty;
            const label = ty === "income" ? t.transactions.income : t.transactions.expense;
            const activeColor = ty === "income" ? theme.income : theme.expense;
            const icon = ty === "income" ? "arrow-down" : "arrow-up";
            return (
              <Pressable
                key={ty}
                onPress={() => {
                  Haptics.selectionAsync();
                  setType(ty);
                  setCategoryId("");
                  if (errors.type) setErrors((e) => ({ ...e, type: "" }));
                }}
                style={{
                  flex: 1,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  paddingVertical: 13,
                  borderRadius: 11,
                  backgroundColor: isActive ? activeColor : "transparent",
                }}
              >
                <Feather name={icon as any} size={16} color={isActive ? "#fff" : theme.textSecondary} />
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

        {/* ── Amount ── */}
        <View style={{
          backgroundColor: errors.amount ? "#EF444408" : (type === "income" ? theme.income + "08" : theme.expense + "08"),
          borderRadius: 20,
          borderWidth: 1.5,
          borderColor: errors.amount ? "#EF4444" : (type === "income" ? theme.income + "30" : theme.expense + "30"),
          paddingVertical: 20,
          paddingHorizontal: 16,
          alignItems: "center",
          gap: 6,
        }}>
          <Text style={{ fontSize: 12, fontWeight: "600", color: type === "income" ? theme.income : theme.expense, letterSpacing: 0.5 }}>
            {type === "income" ? t.transactions.income : t.transactions.expense}
          </Text>
          <TextInput
            testID="amount-input"
            value={amount}
            onChangeText={(v) => {
              setAmount(v);
              if (errors.amount) setErrors((e) => ({ ...e, amount: "" }));
            }}
            keyboardType="decimal-pad"
            placeholder="0.00"
            placeholderTextColor={(type === "income" ? theme.income : theme.expense) + "50"}
            style={{
              fontSize: 48,
              fontWeight: "800",
              color: type === "income" ? theme.income : theme.expense,
              textAlign: "center",
              width: "100%",
              letterSpacing: -1,
              ...(Platform.OS === "web" ? ({ outlineStyle: "none" } as object) : {}),
            }}
          />
          {selectedAccount && (
            <Text style={{ fontSize: 12, color: theme.textMuted, marginTop: 2 }}>
              {t.transactions.account}: {formatCurrency(selectedAccount.balance, selectedAccount.currency, language)}
            </Text>
          )}
          {!!errors.amount && (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Feather name="alert-circle" size={12} color="#EF4444" />
              <Text style={{ fontSize: 12, color: "#EF4444" }}>{errors.amount}</Text>
            </View>
          )}
        </View>

        {/* ── Account ── */}
        <TxField label={t.transactions.account} error={errors.account} required>
          <Pressable
            onPress={() => setShowAccounts(true)}
            style={pickerStyle(!!errors.account)}
          >
            {selectedAccount ? (
              <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 10, flex: 1 }}>
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 9,
                    backgroundColor: selectedAccount.color + "22",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <MaterialCommunityIcons name={selectedAccount.icon as any} size={15} color={selectedAccount.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: theme.text, fontSize: 15, fontWeight: "600" }}>
                    {getDisplayName(selectedAccount, language)}
                  </Text>
                  <Text style={{ color: theme.textMuted, fontSize: 12 }}>
                    {formatCurrency(selectedAccount.balance, selectedAccount.currency, language)}
                  </Text>
                </View>
              </View>
            ) : (
              <Text style={{ color: theme.textMuted, fontSize: 15 }}>{t.transactions.selectAccount}</Text>
            )}
            <Feather name="chevron-down" size={16} color={theme.textMuted} />
          </Pressable>
        </TxField>

        {/* ── Category ── */}
        <TxField label={t.transactions.category} error={errors.category} required>
          <Pressable
            onPress={() => setShowCategories(true)}
            style={pickerStyle(!!errors.category)}
          >
            {selectedCategory ? (
              <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 10, flex: 1 }}>
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 9,
                    backgroundColor: `${selectedCategory.color}22`,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <CategoryIcon name={selectedCategory.icon} size={15} color={selectedCategory.color} />
                </View>
                <Text style={{ color: theme.text, fontSize: 15, fontWeight: "600", flex: 1 }}>
                  {getDisplayName(selectedCategory, language)}
                </Text>
              </View>
            ) : (
              <Text style={{ color: theme.textMuted, fontSize: 15 }}>{t.transactions.selectCategory}</Text>
            )}
            <Feather name="chevron-down" size={16} color={theme.textMuted} />
          </Pressable>
        </TxField>

        {/* ── Date ── */}
        <TxField label={t.common.date} error={errors.date} required>
          {/* Quick date buttons */}
          <View style={{ flexDirection: isRTL ? "row-reverse" : "row", gap: 8, marginBottom: 8 }}>
            {[
              { label: t.transactions.today, days: 0 },
              { label: t.transactions.yesterday, days: 1 },
            ].map(({ label, days }) => {
              const d = new Date();
              d.setDate(d.getDate() - days);
              const val = d.toISOString().split("T")[0];
              const isActive = date === val;
              return (
                <Pressable
                  key={days}
                  onPress={() => setQuickDate(days)}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    borderRadius: 20,
                    backgroundColor: isActive ? theme.primary + "20" : theme.card,
                    borderWidth: 1,
                    borderColor: isActive ? theme.primary : theme.border,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "600",
                      color: isActive ? theme.primary : theme.textSecondary,
                    }}
                  >
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Pressable
            onPress={() => setShowDatePicker(true)}
            style={{
              backgroundColor: theme.input,
              borderRadius: 12,
              borderWidth: 1.5,
              borderColor: errors.date ? "#EF4444" : theme.inputBorder,
              flexDirection: isRTL ? "row-reverse" : "row",
              alignItems: "center",
              paddingHorizontal: 13,
              paddingVertical: 13,
              gap: 10,
            }}
          >
            <Feather name="calendar" size={16} color={theme.primary} />
            <Text style={{ flex: 1, fontSize: 15, color: theme.text, textAlign: isRTL ? "right" : "left" }}>
              {date}
            </Text>
            <Feather name="chevron-down" size={14} color={theme.textMuted} />
          </Pressable>
        </TxField>

        {/* ── Note ── */}
        <TxField label={`${t.common.note} (${t.common.optional})`}>
          <View
            style={{
              backgroundColor: theme.input,
              borderRadius: 12,
              borderWidth: 1.5,
              borderColor: theme.inputBorder,
              paddingHorizontal: 13,
              minHeight: 80,
            }}
          >
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder={t.common.notePlaceholder}
              placeholderTextColor={theme.textMuted}
              multiline
              style={{
                color: theme.text,
                fontSize: 14,
                paddingVertical: 12,
                textAlign: isRTL ? "right" : "left",
                ...(Platform.OS === "web" ? ({ outlineStyle: "none" } as object) : {}),
              }}
            />
          </View>
        </TxField>

        {/* ── Smart Suggestion ── */}
        {showSmartSuggestion && smartSuggestion && (
          <Pressable
            onPress={() => {
              Haptics.selectionAsync();
              setCategoryId(smartSuggestion.id);
              setErrors((e) => ({ ...e, category: "" }));
            }}
            style={{
              flexDirection: isRTL ? "row-reverse" : "row",
              alignItems: "center",
              gap: 8,
              backgroundColor: smartSuggestion.color + "15",
              borderRadius: 12,
              paddingHorizontal: 14,
              paddingVertical: 10,
              borderWidth: 1,
              borderColor: smartSuggestion.color + "40",
            }}
          >
            <Feather name="zap" size={14} color={smartSuggestion.color} />
            <Text style={{ fontSize: 13, color: smartSuggestion.color, fontWeight: "600", flex: 1, textAlign: isRTL ? "right" : "left" }}>
              {t.validation.smartSuggestion}: {getDisplayName(smartSuggestion, language)}
            </Text>
            <View style={{ width: 30, height: 30, borderRadius: 9, backgroundColor: smartSuggestion.color + "20", alignItems: "center", justifyContent: "center" }}>
              <CategoryIcon name={smartSuggestion.icon} size={14} color={smartSuggestion.color} />
            </View>
          </Pressable>
        )}

        <AppButton
          title={existingTx ? t.common.save : t.common.add}
          onPress={handleSave}
          loading={loading}
          fullWidth
          size="lg"
        />

        {existingTx && (
          <Pressable
            onPress={handleDelete}
            style={{
              backgroundColor: theme.expenseBackground,
              borderRadius: 14,
              padding: 16,
              flexDirection: isRTL ? "row-reverse" : "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <Feather name="trash-2" size={18} color={theme.expense} />
            <Text style={{ fontSize: 15, fontWeight: "700", color: theme.expense }}>
              {t.transactions.delete}
            </Text>
          </Pressable>
        )}
      </KeyboardAwareScrollViewCompat>

      <SuccessOverlay
        visible={showSuccess}
        message={existingTx ? t.toast.transactionUpdated : t.toast.transactionSaved}
        color={type === "income" ? theme.income : theme.expense}
      />

      {/* ── Account Picker ── */}
      <SelectorModal
        visible={showAccounts}
        onClose={() => setShowAccounts(false)}
        title={t.transactions.selectAccount}
        theme={theme}
        insets={insets}
      >
        <FlatList
          data={activeAccounts}
          keyExtractor={(a) => a.id}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => {
                setAccountId(item.id);
                setShowAccounts(false);
                if (errors.account) setErrors((e) => ({ ...e, account: "" }));
              }}
              style={{
                flexDirection: isRTL ? "row-reverse" : "row",
                alignItems: "center",
                gap: 12,
                padding: 14,
                backgroundColor: item.id === accountId ? theme.primary + "15" : "transparent",
                borderRadius: 12,
                marginHorizontal: 8,
                marginVertical: 2,
              }}
            >
              <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: item.color + "22", alignItems: "center", justifyContent: "center" }}>
                <MaterialCommunityIcons name={item.icon as any} size={17} color={item.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: theme.text, fontWeight: "600", fontSize: 15 }}>
                  {getDisplayName(item, language)}
                </Text>
                <Text style={{ color: theme.textMuted, fontSize: 12 }}>
                  {formatCurrency(item.balance, item.currency, language)}
                </Text>
              </View>
              {item.id === accountId && (
                <Feather name="check" size={18} color={theme.primary} />
              )}
            </Pressable>
          )}
          ListEmptyComponent={
            <Text style={{ color: theme.textMuted, textAlign: "center", padding: 20 }}>
              {t.accounts.noAccounts}
            </Text>
          }
        />
      </SelectorModal>

      {/* ── Category Picker ── */}
      <CategoryPickerModal
        visible={showCategories}
        onClose={() => setShowCategories(false)}
        categories={relevantCategories}
        selectedId={categoryId}
        onSelect={(id) => {
          setCategoryId(id);
          if (errors.category) setErrors((e) => ({ ...e, category: "" }));
        }}
        theme={theme}
        insets={insets}
        language={language}
        isRTL={isRTL}
        noDataText={t.categories.noCategories}
        title={t.transactions.selectCategory}
      />

      <DatePickerModal
        visible={showDatePicker}
        value={date}
        maxDate={todayISOString()}
        onConfirm={(d) => { setDate(d); if (errors.date) setErrors((e) => ({ ...e, date: "" })); }}
        onClose={() => setShowDatePicker(false)}
      />

      <ConfirmDialog
        visible={showConfirmDelete}
        title={t.common.areYouSure}
        message={t.transactions.deleteConfirm}
        onConfirm={confirmDelete}
        onCancel={() => setShowConfirmDelete(false)}
      />
    </View>
  );
}

function SelectorModal({
  visible,
  onClose,
  title,
  theme,
  insets,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  theme: Theme;
  insets: { bottom: number };
  children: React.ReactNode;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent>
      <Pressable
        style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}
        onPress={onClose}
      >
        <Pressable
          onPress={() => {}}
          style={{
            backgroundColor: theme.card,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            maxHeight: "72%",
            paddingTop: 12,
            paddingBottom: insets.bottom + 16,
          }}
        >
          {/* Handle */}
          <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: theme.border, alignSelf: "center", marginBottom: 12 }} />

          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: theme.border }}>
            <Text style={{ fontSize: 17, fontWeight: "700", color: theme.text }}>{title}</Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <Feather name="x" size={22} color={theme.textSecondary} />
            </Pressable>
          </View>
          <View style={{ flex: 1 }}>
            {children}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

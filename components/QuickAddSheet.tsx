import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  View,
  Text,
  Modal,
  Pressable,
  TextInput,
  FlatList,
  Keyboard,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { CategoryIcon } from "@/components/CategoryIcon";
import { DatePickerModal } from "@/components/DatePickerModal";
import * as Haptics from "expo-haptics";
import { useApp } from "@/store/AppContext";
import { useAccounts } from "@/store/AccountsContext";
import { useTransactions } from "@/store/TransactionsContext";
import { useCategories } from "@/store/CategoriesContext";
import { getDisplayName } from "@/utils/display";
import { formatCurrency } from "@/utils/currency";
import { todayISOString, isValidDate } from "@/utils/date";
import { SMART_SUGGESTIONS } from "@/utils/defaults";
import type { TransactionType, Category } from "@/types";

interface QuickAddSheetProps {
  visible: boolean;
  initialType: TransactionType;
  onClose: () => void;
}

function getSmartSuggestion(note: string, categories: Category[], language: string): Category | null {
  if (!note.trim()) return null;
  const lower = note.toLowerCase().trim();
  const words = lower.split(/\s+/);
  for (const word of words) {
    const names = SMART_SUGGESTIONS[word];
    if (names) {
      const matched = categories.find(
        (c) => c.name_ar === names[0] || c.name_en === names[1]
      );
      if (matched) return matched;
    }
  }
  return null;
}

type Step = "main" | "account" | "category";

export function QuickAddSheet({ visible, initialType, onClose }: QuickAddSheetProps) {
  const insets = useSafeAreaInsets();
  const { theme, language, isRTL, t, selectedAccountId, settings, updateSettings } = useApp();
  const { accounts, updateBalance } = useAccounts();
  const { addTransaction } = useTransactions();
  const { categories: allCategories } = useCategories();

  const amountRef = useRef<TextInput>(null);

  const activeAccounts = useMemo(
    () => accounts.filter((a) => a.is_active),
    [accounts]
  );

  const defaultAccount = useMemo(
    () => activeAccounts.find((a) => a.id === selectedAccountId) || activeAccounts[0] || null,
    [activeAccounts, selectedAccountId]
  );

  const [type, setType] = useState<TransactionType>(initialType);
  const [amount, setAmount] = useState("");
  const [accountId, setAccountId] = useState(defaultAccount?.id || "");
  const [categoryId, setCategoryId] = useState("");
  const [categorySearch, setCategorySearch] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(todayISOString());
  const [step, setStep] = useState<Step>("main");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [amountError, setAmountError] = useState("");
  const [categoryError, setCategoryError] = useState("");
  const [dateError, setDateError] = useState("");

  // Reset all state when the sheet opens
  useEffect(() => {
    if (!visible) return;
    setType(initialType);
    setAmount("");
    setAccountId(defaultAccount?.id || "");
    setNote("");
    setDate(todayISOString());
    setStep("main");
    setCategorySearch("");
    setAmountError("");
    setCategoryError("");
    setDateError("");
    setSaving(false);
    setShowDatePicker(false);
    const lastKey = settings.last_used_category_id;
    const found = lastKey ? allCategories.find((c) => c.id === lastKey) : null;
    setCategoryId(found?.id || "");
    setTimeout(() => amountRef.current?.focus(), 250);
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

  const selectedAccount = activeAccounts.find((a) => a.id === accountId);
  const selectedCategory = allCategories.find((c) => c.id === categoryId);

  const filteredCategories = useMemo(() => {
    if (!categorySearch.trim()) return allCategories;
    const q = categorySearch.toLowerCase();
    return allCategories.filter(
      (c) => c.name_ar.includes(q) || c.name_en.toLowerCase().includes(q)
    );
  }, [allCategories, categorySearch]);

  const smartSuggestion = useMemo(
    () => getSmartSuggestion(note, allCategories, language),
    [note, allCategories, language]
  );
  const showSmartSuggestion = !!smartSuggestion && smartSuggestion.id !== categoryId;

  const handleSave = () => {
    Keyboard.dismiss();
    let hasError = false;
    const amountNum = parseFloat(amount);

    if (!amount || isNaN(amountNum) || amountNum <= 0) {
      setAmountError(t.validation.amountPositive);
      hasError = true;
    } else {
      setAmountError("");
    }

    if (!categoryId) {
      setCategoryError(t.validation.categoryRequired);
      hasError = true;
    } else {
      setCategoryError("");
    }

    if (!isValidDate(date)) {
      setDateError(t.validation.dateInvalid);
      hasError = true;
    } else {
      setDateError("");
    }

    if (hasError) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setSaving(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const currency = selectedAccount?.currency || "QAR";
    const delta = type === "income" ? amountNum : -amountNum;
    const acctId = accountId || defaultAccount?.id || "";

    updateBalance(acctId, delta);
    addTransaction({ type, amount: amountNum, account_id: acctId, category_id: categoryId, currency, date, note });
    if (categoryId) updateSettings({ last_used_category_id: categoryId });

    setSaving(false);
    onClose();
  };

  const typeColor = type === "income" ? theme.income : theme.expense;
  const today = todayISOString();
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

  const goBack = () => setStep("main");

  // ─── Step: Category Picker ────────────────────────────────────────────────

  const renderCategoryStep = () => (
    <View style={{ backgroundColor: theme.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: "80%", paddingBottom: insets.bottom + 16 }}>
      <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: theme.border, alignSelf: "center", marginTop: 10, marginBottom: 4 }} />
      {/* Header */}
      <View style={{ flexDirection: isRTL ? "row-reverse" : "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.border }}>
        <Pressable onPress={goBack} hitSlop={12}>
          <Feather name={isRTL ? "chevron-right" : "chevron-left"} size={22} color={theme.textSecondary} />
        </Pressable>
        <Text style={{ fontSize: 16, fontWeight: "700", color: theme.text }}>
          {t.transactions.selectCategory}
        </Text>
        <Pressable onPress={goBack} hitSlop={12}>
          <Feather name="x" size={20} color={theme.textSecondary} />
        </Pressable>
      </View>
      {/* Search */}
      <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 8, marginHorizontal: 12, marginTop: 10, marginBottom: 6, backgroundColor: theme.background, borderRadius: 12, borderWidth: 1, borderColor: theme.border, paddingHorizontal: 12 }}>
        <Feather name="search" size={15} color={theme.textMuted} />
        <TextInput
          value={categorySearch}
          onChangeText={setCategorySearch}
          placeholder={t.common.searchPlaceholder}
          placeholderTextColor={theme.textMuted}
          style={{ flex: 1, paddingVertical: 10, color: theme.text, fontSize: 14, textAlign: isRTL ? "right" : "left", ...(Platform.OS === "web" ? ({ outlineStyle: "none" } as object) : {}) }}
        />
        {categorySearch.length > 0 && (
          <Pressable onPress={() => setCategorySearch("")} hitSlop={6}>
            <Feather name="x" size={15} color={theme.textMuted} />
          </Pressable>
        )}
      </View>
      {/* Grid */}
      <FlatList
        data={filteredCategories}
        keyExtractor={(c) => c.id}
        numColumns={3}
        keyboardShouldPersistTaps="handled"
        columnWrapperStyle={{ paddingHorizontal: 8, gap: 8, marginVertical: 4 }}
        contentContainerStyle={{ paddingVertical: 6 }}
        renderItem={({ item }) => {
          const isSelected = item.id === categoryId;
          return (
            <Pressable
              onPress={() => {
                Haptics.selectionAsync();
                setCategoryId(item.id);
                setCategoryError("");
                setStep("main");
              }}
              style={{
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
                paddingVertical: 12,
                paddingHorizontal: 6,
                backgroundColor: isSelected ? theme.primary + "18" : theme.background,
                borderRadius: 14,
                borderWidth: isSelected ? 2 : 1,
                borderColor: isSelected ? theme.primary : theme.border,
                gap: 6,
              }}
            >
              <View style={{ width: 44, height: 44, borderRadius: 13, backgroundColor: `${item.color}22`, alignItems: "center", justifyContent: "center" }}>
                <CategoryIcon name={item.icon || "tag"} size={22} color={item.color} />
              </View>
              <Text numberOfLines={2} style={{ fontSize: 11, fontWeight: isSelected ? "700" : "500", color: isSelected ? theme.primary : theme.text, textAlign: "center", lineHeight: 14 }}>
                {getDisplayName(item, language)}
              </Text>
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <Text style={{ color: theme.textMuted, textAlign: "center", padding: 20 }}>
            {t.categories.noCategories}
          </Text>
        }
      />
    </View>
  );

  // ─── Step: Account Picker ─────────────────────────────────────────────────

  const renderAccountStep = () => (
    <View style={{ backgroundColor: theme.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: insets.bottom + 16, maxHeight: "65%" }}>
      <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: theme.border, alignSelf: "center", marginTop: 10, marginBottom: 4 }} />
      <View style={{ flexDirection: isRTL ? "row-reverse" : "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: theme.border }}>
        <Pressable onPress={goBack} hitSlop={12}>
          <Feather name={isRTL ? "chevron-right" : "chevron-left"} size={22} color={theme.textSecondary} />
        </Pressable>
        <Text style={{ fontSize: 16, fontWeight: "700", color: theme.text }}>{t.transactions.selectAccount}</Text>
        <View style={{ width: 22 }} />
      </View>
      <FlatList
        data={activeAccounts}
        keyExtractor={(a) => a.id}
        renderItem={({ item }) => {
          const isSelected = item.id === accountId;
          return (
            <Pressable
              onPress={() => { setAccountId(item.id); setStep("main"); }}
              style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 14, padding: 16, backgroundColor: isSelected ? theme.primary + "12" : "transparent" }}
            >
              <View style={{ width: 38, height: 38, borderRadius: 11, backgroundColor: item.color + "22", alignItems: "center", justifyContent: "center" }}>
                <MaterialCommunityIcons name={item.icon as any} size={18} color={item.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: theme.text, fontWeight: "600", textAlign: isRTL ? "right" : "left" }}>{getDisplayName(item, language)}</Text>
                <Text style={{ color: theme.textMuted, fontSize: 12, textAlign: isRTL ? "right" : "left" }}>{formatCurrency(item.balance, item.currency, language)}</Text>
              </View>
              {isSelected && <Feather name="check" size={18} color={theme.primary} />}
            </Pressable>
          );
        }}
      />
    </View>
  );

  // ─── Custom Keypad helper ─────────────────────────────────────────────────

  const handleKeypadPress = (key: string) => {
    Haptics.selectionAsync();
    if (amountError) setAmountError("");
    setAmount((prev) => {
      if (key === "backspace") return prev.slice(0, -1);
      if (key === ".") {
        if (prev.includes(".")) return prev;
        return prev === "" ? "0." : prev + ".";
      }
      const next = prev + key;
      const parts = next.split(".");
      if (parts.length === 2 && parts[1].length > 2) return prev;
      if (parts[0].length > 9) return prev;
      return next;
    });
  };

  const keypadRows: string[][] = [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
    [".", "0", "backspace"],
  ];

  const renderKeypad = () => (
    <View style={{ paddingHorizontal: 12, paddingTop: 4, gap: 6 }}>
      {keypadRows.map((row, ri) => (
        <View key={ri} style={{ flexDirection: "row", gap: 6 }}>
          {row.map((key) => (
            <Pressable
              key={key}
              onPress={() => handleKeypadPress(key)}
              style={({ pressed }) => ({
                flex: 1,
                height: 52,
                borderRadius: 14,
                backgroundColor: pressed
                  ? theme.border
                  : key === "backspace"
                  ? theme.cardSecondary
                  : theme.background,
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 1,
                borderColor: theme.border,
              })}
            >
              {key === "backspace" ? (
                <Feather name="delete" size={20} color={theme.textSecondary} />
              ) : (
                <Text style={{ fontSize: 22, fontWeight: "600", color: theme.text }}>
                  {key}
                </Text>
              )}
            </Pressable>
          ))}
        </View>
      ))}
    </View>
  );

  // ─── Step: Main ───────────────────────────────────────────────────────────

  const renderMainStep = () => (
    <View style={{ flex: 1, justifyContent: "flex-end" }}>
      <Pressable style={{ flex: 1 }} onPress={() => { Keyboard.dismiss(); onClose(); }} />
      <Pressable onPress={() => {}} style={{ backgroundColor: theme.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingBottom: insets.bottom + 8 }}>
        {/* Handle */}
        <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: theme.border, alignSelf: "center", marginTop: 10 }} />

        {/* Type Toggle */}
        <View style={{ flexDirection: isRTL ? "row-reverse" : "row", margin: 16, marginBottom: 8, backgroundColor: theme.background, borderRadius: 16, padding: 4, gap: 4 }}>
          {(["expense", "income"] as TransactionType[]).map((ty) => {
            const isActive = type === ty;
            const col = ty === "income" ? theme.income : theme.expense;
            return (
              <Pressable
                key={ty}
                onPress={() => { Haptics.selectionAsync(); setType(ty); }}
                style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 11, borderRadius: 13, backgroundColor: isActive ? col : "transparent" }}
              >
                <Feather name={ty === "income" ? "arrow-down" : "arrow-up"} size={15} color={isActive ? "#fff" : theme.textSecondary} />
                <Text style={{ fontSize: 15, fontWeight: "700", color: isActive ? "#fff" : theme.textSecondary }}>
                  {ty === "income" ? t.transactions.income : t.transactions.expense}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Amount Display */}
        <View style={{ alignItems: "center", paddingHorizontal: 20, paddingVertical: 4 }}>
          <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <TextInput
              ref={amountRef}
              testID="quick-amount-input"
              value={amount}
              onChangeText={(v) => { setAmount(v); if (amountError) setAmountError(""); }}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor={theme.textMuted + "80"}
              showSoftInputOnFocus={false}
              caretHidden={Platform.OS !== "web"}
              style={{ fontSize: 52, fontWeight: "800", color: typeColor, textAlign: "center", minWidth: 140, ...(Platform.OS === "web" ? ({ outlineStyle: "none" } as object) : {}) }}
            />
            {selectedAccount && (
              <Text style={{ fontSize: 16, fontWeight: "600", color: theme.textMuted, alignSelf: "flex-end", paddingBottom: 10 }}>
                {selectedAccount.currency}
              </Text>
            )}
          </View>
          {!!amountError && (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 }}>
              <Feather name="alert-circle" size={12} color="#EF4444" />
              <Text style={{ fontSize: 12, color: "#EF4444" }}>{amountError}</Text>
            </View>
          )}
        </View>

        {/* Category */}
        <View style={{ paddingHorizontal: 16, marginBottom: 6 }}>
          {!!categoryError && (
            <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 4, marginBottom: 4 }}>
              <Feather name="alert-circle" size={12} color="#EF4444" />
              <Text style={{ fontSize: 12, color: "#EF4444", textAlign: isRTL ? "right" : "left" }}>{categoryError}</Text>
            </View>
          )}
          <Pressable
            testID="cat-selector-btn"
            onPress={() => { Haptics.selectionAsync(); setStep("category"); }}
            style={({ pressed }) => ({
              flexDirection: isRTL ? "row-reverse" : "row",
              alignItems: "center",
              gap: 10,
              backgroundColor: pressed ? theme.cardSecondary : theme.background,
              borderRadius: 14,
              borderWidth: 1.5,
              borderColor: categoryError ? "#EF4444" : selectedCategory ? selectedCategory.color + "80" : theme.border,
              paddingHorizontal: 14,
              paddingVertical: 10,
            })}
          >
            {selectedCategory ? (
              <>
                <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: selectedCategory.color + "20", alignItems: "center", justifyContent: "center" }}>
                  <CategoryIcon name={selectedCategory.icon} size={17} color={selectedCategory.color} />
                </View>
                <Text style={{ flex: 1, fontSize: 15, fontWeight: "600", color: selectedCategory.color, textAlign: isRTL ? "right" : "left" }}>
                  {getDisplayName(selectedCategory, language)}
                </Text>
                <Feather name="chevron-down" size={16} color={selectedCategory.color} />
              </>
            ) : (
              <>
                <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: theme.border + "60", alignItems: "center", justifyContent: "center" }}>
                  <Feather name="tag" size={17} color={theme.textMuted} />
                </View>
                <Text style={{ flex: 1, fontSize: 15, color: theme.textMuted, textAlign: isRTL ? "right" : "left" }}>
                  {t.transactions.selectCategory}
                </Text>
                <Feather name="chevron-down" size={16} color={theme.textMuted} />
              </>
            )}
          </Pressable>
        </View>

        {/* Smart Suggestion */}
        {showSmartSuggestion && smartSuggestion && (
          <Pressable
            onPress={() => { Haptics.selectionAsync(); setCategoryId(smartSuggestion.id); setCategoryError(""); }}
            style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 8, marginHorizontal: 16, marginBottom: 8, backgroundColor: smartSuggestion.color + "15", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: smartSuggestion.color + "40" }}
          >
            <Feather name="zap" size={13} color={smartSuggestion.color} />
            <Text style={{ fontSize: 12, color: smartSuggestion.color, fontWeight: "600", flex: 1, textAlign: isRTL ? "right" : "left" }}>
              {t.validation.smartSuggestion}: {getDisplayName(smartSuggestion, language)}
            </Text>
            <View style={{ width: 26, height: 26, borderRadius: 8, backgroundColor: smartSuggestion.color + "20", alignItems: "center", justifyContent: "center" }}>
              <CategoryIcon name={smartSuggestion.icon} size={13} color={smartSuggestion.color} />
            </View>
          </Pressable>
        )}

        {/* Account + Date row */}
        <View style={{ flexDirection: isRTL ? "row-reverse" : "row", gap: 8, paddingHorizontal: 16, marginBottom: 8 }}>
          <Pressable
            onPress={() => setStep("account")}
            style={{ flex: 1, flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 8, backgroundColor: theme.background, borderRadius: 12, padding: 10, borderWidth: 1, borderColor: theme.border }}
          >
            {selectedAccount ? (
              <>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: selectedAccount.color }} />
                <Text style={{ color: theme.text, fontSize: 13, fontWeight: "600", flex: 1 }} numberOfLines={1}>{getDisplayName(selectedAccount, language)}</Text>
              </>
            ) : (
              <>
                <Feather name="credit-card" size={14} color={theme.textMuted} />
                <Text style={{ color: theme.textMuted, fontSize: 13, flex: 1 }}>{t.transactions.account}</Text>
              </>
            )}
            <Feather name="chevron-down" size={13} color={theme.textMuted} />
          </Pressable>
          <Pressable
            onPress={() => setShowDatePicker(true)}
            style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 6, backgroundColor: theme.background, borderRadius: 12, padding: 10, borderWidth: 1, borderColor: dateError ? "#EF4444" : theme.border }}
          >
            <Feather name="calendar" size={14} color={dateError ? "#EF4444" : theme.textMuted} />
            <Text style={{ color: date === today ? typeColor : theme.textSecondary, fontSize: 13, fontWeight: "600" }}>
              {date === today ? t.transactions.today : date === yesterday ? t.transactions.yesterday : date}
            </Text>
          </Pressable>
        </View>

        {/* Note row */}
        <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 8, marginHorizontal: 16, marginBottom: 6, backgroundColor: theme.background, borderRadius: 12, paddingHorizontal: 12, borderWidth: 1, borderColor: theme.border }}>
          <Feather name="message-square" size={14} color={theme.textMuted} />
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder={t.common.notePlaceholder}
            placeholderTextColor={theme.textMuted}
            style={{ flex: 1, paddingVertical: 10, color: theme.text, fontSize: 13, textAlign: isRTL ? "right" : "left", ...(Platform.OS === "web" ? ({ outlineStyle: "none" } as object) : {}) }}
          />
        </View>

        {/* Custom Numeric Keypad (native only) */}
        {Platform.OS !== "web" && renderKeypad()}

        {/* Save Button */}
        <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
          <Pressable
            onPress={handleSave}
            disabled={saving}
            testID="quick-save-btn"
            style={({ pressed }) => ({
              backgroundColor: typeColor,
              borderRadius: 18,
              paddingVertical: 16,
              alignItems: "center",
              opacity: saving ? 0.7 : pressed ? 0.88 : 1,
              transform: [{ scale: pressed ? 0.98 : 1 }],
            })}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={{ color: "#fff", fontSize: 17, fontWeight: "800", letterSpacing: 0.2 }}>
                {t.common.add}{amount ? ` ${amount} ${selectedAccount?.currency || ""}` : ""}
              </Text>
            )}
          </Pressable>
        </View>
      </Pressable>
    </View>
  );

  // ─── Single Modal with all steps ─────────────────────────────────────────

  return (
    <>
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => { if (step !== "main") { goBack(); } else { onClose(); } }}
      >
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.55)" }}>
          {step === "main" && renderMainStep()}
          {step === "category" && (
            <>
              <Pressable style={{ flex: 1 }} onPress={goBack} />
              {renderCategoryStep()}
            </>
          )}
          {step === "account" && (
            <>
              <Pressable style={{ flex: 1 }} onPress={goBack} />
              {renderAccountStep()}
            </>
          )}
        </View>
      </Modal>

      <DatePickerModal
        visible={showDatePicker}
        value={date}
        maxDate={today}
        onConfirm={(d) => { setDate(d); setDateError(""); setShowDatePicker(false); setStep("main"); }}
        onClose={() => setShowDatePicker(false)}
      />
    </>
  );
}

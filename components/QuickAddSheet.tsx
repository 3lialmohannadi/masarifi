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
} from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { CategoryIcon } from "@/components/CategoryIcon";
import * as Haptics from "expo-haptics";
import { useApp } from "@/store/AppContext";
import { useAccounts } from "@/store/AccountsContext";
import { useTransactions } from "@/store/TransactionsContext";
import { useCategories } from "@/store/CategoriesContext";
import { getDisplayName } from "@/utils/display";
import { formatCurrency } from "@/utils/currency";
import { todayISOString } from "@/utils/date";
import { SMART_SUGGESTIONS } from "@/utils/defaults";
import type { TransactionType, Category } from "@/types";

interface QuickAddSheetProps {
  visible: boolean;
  initialType: TransactionType;
  onClose: () => void;
}

function isValidDate(str: string): boolean {
  if (!str || !/^\d{4}-\d{2}-\d{2}$/.test(str)) return false;
  const d = new Date(str);
  return !isNaN(d.getTime());
}

function getSmartSuggestion(note: string, categories: Category[], language: string): Category | null {
  if (!note.trim()) return null;
  const lower = note.toLowerCase().trim();
  const words = lower.split(/\s+/);
  for (const word of words) {
    const names = SMART_SUGGESTIONS[word];
    if (names) {
      const arName = names[0];
      const enName = names[1];
      const matched = categories.find(
        (c) => c.name_ar === arName || c.name_en === enName
      );
      if (matched) return matched;
    }
  }
  return null;
}

export function QuickAddSheet({ visible, initialType, onClose }: QuickAddSheetProps) {
  const insets = useSafeAreaInsets();
  const { theme, language, isRTL, t, selectedAccountId, settings, updateSettings } = useApp();
  const { accounts, updateBalance } = useAccounts();
  const { addTransaction } = useTransactions();
  const { categories: allCategories } = useCategories();

  const amountRef = useRef<TextInput>(null);

  const activeAccounts = accounts.filter((a) => a.is_active);
  const defaultAccount =
    activeAccounts.find((a) => a.id === selectedAccountId) ||
    activeAccounts[0] ||
    null;

  const [type, setType] = useState<TransactionType>(initialType);
  const [amount, setAmount] = useState("");
  const [accountId, setAccountId] = useState(defaultAccount?.id || "");
  const [categoryId, setCategoryId] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(todayISOString());
  const [step, setStep] = useState<"main" | "account" | "date" | "category">("main");
  const [catSearch, setCatSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [amountError, setAmountError] = useState("");
  const [categoryError, setCategoryError] = useState("");
  const [dateError, setDateError] = useState("");

  const categories = useMemo(
    () =>
      allCategories
        .filter((c) => c.is_active)
        .sort((a, b) => (b.is_favorite ? 1 : 0) - (a.is_favorite ? 1 : 0)),
    [allCategories]
  );

  const selectedAccount = activeAccounts.find((a) => a.id === accountId);
  const selectedCategory = categories.find((c) => c.id === categoryId);

  const smartSuggestion = useMemo(
    () => getSmartSuggestion(note, categories, language),
    [note, categories, language]
  );

  const showSmartSuggestion =
    !!smartSuggestion && smartSuggestion.id !== categoryId;

  // Pre-select last used category when sheet opens or type changes
  useEffect(() => {
    if (visible) {
      setType(initialType);
      setAmount("");
      setAccountId(defaultAccount?.id || "");
      setNote("");
      setDate(todayISOString());
      setStep("main");
      setAmountError("");
      setCategoryError("");
      setDateError("");
      setTimeout(() => amountRef.current?.focus(), 200);
    }
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    const key = settings.last_used_category_id;
    const found = key ? categories.find((c) => c.id === key) : null;
    setCategoryId(found?.id || "");
    setCategoryError("");
  }, [visible, categories]);

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
    addTransaction({
      type,
      amount: amountNum,
      account_id: acctId,
      category_id: categoryId,
      currency,
      date,
      note,
    });

    if (categoryId) updateSettings({ last_used_category_id: categoryId });

    setSaving(false);
    onClose();
  };

  const typeColor = type === "income" ? theme.income : theme.expense;
  const today = todayISOString();
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

  if (step === "account") {
    return (
      <Modal visible={visible} transparent animationType="slide" statusBarTranslucent>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "flex-end" }}>
          <View
            style={{
              backgroundColor: theme.card,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              paddingBottom: insets.bottom + 16,
              maxHeight: "65%",
            }}
          >
            <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: theme.border, alignSelf: "center", marginTop: 10, marginBottom: 4 }} />
            <View style={{ flexDirection: isRTL ? "row-reverse" : "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: theme.border }}>
              <Pressable onPress={() => setStep("main")} hitSlop={10}>
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
                      <Feather name={item.icon as any} size={18} color={item.color} />
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
        </View>
      </Modal>
    );
  }

  if (step === "category") {
    const filteredCats = catSearch.trim()
      ? categories.filter((c) =>
          getDisplayName(c, language).toLowerCase().includes(catSearch.toLowerCase()) ||
          c.name_ar.includes(catSearch) ||
          c.name_en.toLowerCase().includes(catSearch.toLowerCase())
        )
      : categories;

    return (
      <Modal visible={visible} transparent animationType="slide" statusBarTranslucent>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "flex-end" }}>
          <View
            style={{
              backgroundColor: theme.card,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              paddingBottom: insets.bottom + 16,
              maxHeight: "82%",
            }}
          >
            {/* Handle */}
            <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: theme.border, alignSelf: "center", marginTop: 10, marginBottom: 4 }} />

            {/* Header */}
            <View style={{ flexDirection: isRTL ? "row-reverse" : "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: theme.border }}>
              <Pressable onPress={() => { setStep("main"); setCatSearch(""); }} hitSlop={10}>
                <Feather name={isRTL ? "chevron-right" : "chevron-left"} size={22} color={theme.textSecondary} />
              </Pressable>
              <Text style={{ fontSize: 16, fontWeight: "700", color: theme.text }}>{t.transactions.selectCategory}</Text>
              <View style={{ width: 22 }} />
            </View>

            {/* Search */}
            <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 8, marginHorizontal: 16, marginTop: 12, marginBottom: 4, backgroundColor: theme.background, borderRadius: 12, borderWidth: 1, borderColor: theme.border, paddingHorizontal: 12 }}>
              <Feather name="search" size={15} color={theme.textMuted} />
              <TextInput
                value={catSearch}
                onChangeText={setCatSearch}
                placeholder={language === "ar" ? "بحث..." : "Search..."}
                placeholderTextColor={theme.textMuted}
                style={{ flex: 1, paddingVertical: 10, color: theme.text, fontSize: 14, textAlign: isRTL ? "right" : "left", ...Platform.select({ web: { outlineStyle: "none" } } as any) }}
              />
              {catSearch.length > 0 && (
                <Pressable onPress={() => setCatSearch("")} hitSlop={6}>
                  <Feather name="x" size={15} color={theme.textMuted} />
                </Pressable>
              )}
            </View>

            {/* Category Grid */}
            <FlatList
              data={filteredCats}
              numColumns={4}
              keyExtractor={(c) => c.id}
              contentContainerStyle={{ paddingHorizontal: 12, paddingTop: 8, paddingBottom: 8 }}
              columnWrapperStyle={{ gap: 8, marginBottom: 8 }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item: cat }) => {
                const isSelected = cat.id === categoryId;
                return (
                  <Pressable
                    key={cat.id}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setCategoryId(cat.id);
                      setCategoryError("");
                      setStep("main");
                      setCatSearch("");
                    }}
                    style={{
                      flex: 1,
                      alignItems: "center",
                      gap: 5,
                      paddingVertical: 10,
                      paddingHorizontal: 4,
                      borderRadius: 14,
                      backgroundColor: isSelected ? cat.color + "20" : "transparent",
                      borderWidth: 1.5,
                      borderColor: isSelected ? cat.color : "transparent",
                    }}
                  >
                    <View style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: cat.color + "20", alignItems: "center", justifyContent: "center" }}>
                      <CategoryIcon name={cat.icon} size={20} color={cat.color} />
                    </View>
                    <Text style={{ fontSize: 10, fontWeight: "600", color: isSelected ? cat.color : theme.textSecondary, textAlign: "center" }} numberOfLines={2}>
                      {getDisplayName(cat, language)}
                    </Text>
                    {isSelected && (
                      <View style={{ position: "absolute", top: 6, right: isRTL ? "auto" : 6, left: isRTL ? 6 : "auto", width: 16, height: 16, borderRadius: 8, backgroundColor: cat.color, alignItems: "center", justifyContent: "center" }}>
                        <Feather name="check" size={10} color="#fff" />
                      </View>
                    )}
                  </Pressable>
                );
              }}
              ListEmptyComponent={
                <View style={{ padding: 20, alignItems: "center" }}>
                  <Text style={{ color: theme.textMuted, fontSize: 13 }}>{t.categories.noCategories}</Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>
    );
  }

  if (step === "date") {
    return (
      <Modal visible={visible} transparent animationType="slide" statusBarTranslucent>
        <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "flex-end" }}>
          <View style={{ backgroundColor: theme.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: insets.bottom + 24, padding: 20, gap: 16 }}>
            <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: theme.border, alignSelf: "center", marginBottom: 4 }} />
            <View style={{ flexDirection: isRTL ? "row-reverse" : "row", justifyContent: "space-between", alignItems: "center" }}>
              <Pressable onPress={() => setStep("main")} hitSlop={10}>
                <Feather name={isRTL ? "chevron-right" : "chevron-left"} size={22} color={theme.textSecondary} />
              </Pressable>
              <Text style={{ fontSize: 16, fontWeight: "700", color: theme.text }}>{t.common.date}</Text>
              <View style={{ width: 22 }} />
            </View>
            <View style={{ flexDirection: isRTL ? "row-reverse" : "row", gap: 10 }}>
              {[{ label: t.transactions.today, val: today }, { label: t.transactions.yesterday, val: yesterday }].map(({ label, val }) => (
                <Pressable
                  key={val}
                  onPress={() => { setDate(val); setDateError(""); }}
                  style={{ flex: 1, padding: 14, borderRadius: 14, alignItems: "center", backgroundColor: date === val ? typeColor + "18" : theme.background, borderWidth: 1.5, borderColor: date === val ? typeColor : theme.border }}
                >
                  <Text style={{ fontWeight: "700", color: date === val ? typeColor : theme.textSecondary }}>{label}</Text>
                </Pressable>
              ))}
            </View>
            <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 10, backgroundColor: theme.input, borderRadius: 12, borderWidth: 1.5, borderColor: dateError ? "#EF4444" : theme.inputBorder, paddingHorizontal: 14 }}>
              <Feather name="calendar" size={16} color={theme.textMuted} />
              <TextInput
                value={date}
                onChangeText={(v) => { setDate(v); setDateError(""); }}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={theme.textMuted}
                style={{ flex: 1, paddingVertical: 13, color: theme.text, fontSize: 15, textAlign: isRTL ? "right" : "left", ...Platform.select({ web: { outlineStyle: "none" } } as any) }}
              />
            </View>
            {!!dateError && <Text style={{ fontSize: 12, color: "#EF4444" }}>{dateError}</Text>}
            <Pressable
              onPress={() => { if (isValidDate(date)) { setDateError(""); setStep("main"); } else setDateError(t.validation.dateInvalid); }}
              style={{ backgroundColor: typeColor, borderRadius: 14, padding: 15, alignItems: "center" }}
            >
              <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>{t.common.confirm}</Text>
            </Pressable>
          </View>
        </View>
        </KeyboardAvoidingView>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "flex-end" }} onPress={() => { Keyboard.dismiss(); onClose(); }}>
          <Pressable
            onPress={() => {}}
            style={{
              backgroundColor: theme.card,
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              paddingBottom: insets.bottom + 16,
            }}
          >
          {/* Handle */}
          <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: theme.border, alignSelf: "center", marginTop: 10 }} />

          {/* Type Toggle */}
          <View style={{ flexDirection: isRTL ? "row-reverse" : "row", margin: 16, backgroundColor: theme.background, borderRadius: 16, padding: 4, gap: 4 }}>
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

          {/* Amount */}
          <View style={{ alignItems: "center", paddingHorizontal: 20, marginBottom: 4 }}>
            <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 8 }}>
              <TextInput
                ref={amountRef}
                testID="quick-amount-input"
                value={amount}
                onChangeText={(v) => { setAmount(v); if (amountError) setAmountError(""); }}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor={theme.textMuted}
                style={{
                  fontSize: 44,
                  fontWeight: "800",
                  color: typeColor,
                  textAlign: "center",
                  minWidth: 120,
                  ...Platform.select({ web: { outlineStyle: "none" } } as any),
                }}
              />
              {selectedAccount && (
                <Text style={{ fontSize: 14, color: theme.textMuted, alignSelf: "flex-end", paddingBottom: 8 }}>
                  {selectedAccount.currency}
                </Text>
              )}
            </View>
            {!!amountError && (
              <Text style={{ fontSize: 12, color: "#EF4444", marginTop: 2 }}>{amountError}</Text>
            )}
          </View>

          {/* Category Selector Button */}
          <View style={{ paddingHorizontal: 16, marginBottom: 6 }}>
            {!!categoryError && (
              <Text style={{ fontSize: 12, color: "#EF4444", marginBottom: 6, textAlign: isRTL ? "right" : "left" }}>{categoryError}</Text>
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
                paddingVertical: 12,
              })}
            >
              {selectedCategory ? (
                <>
                  <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: selectedCategory.color + "20", alignItems: "center", justifyContent: "center" }}>
                    <CategoryIcon name={selectedCategory.icon} size={18} color={selectedCategory.color} />
                  </View>
                  <Text style={{ flex: 1, fontSize: 15, fontWeight: "600", color: selectedCategory.color, textAlign: isRTL ? "right" : "left" }}>
                    {getDisplayName(selectedCategory, language)}
                  </Text>
                  <Feather name="chevron-down" size={16} color={selectedCategory.color} />
                </>
              ) : (
                <>
                  <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: theme.border + "60", alignItems: "center", justifyContent: "center" }}>
                    <Feather name="tag" size={18} color={theme.textMuted} />
                  </View>
                  <Text style={{ flex: 1, fontSize: 15, color: theme.textMuted, textAlign: isRTL ? "right" : "left" }}>
                    {t.transactions.selectCategory}
                  </Text>
                  <Feather name="chevron-down" size={16} color={theme.textMuted} />
                </>
              )}
            </Pressable>
          </View>

          {/* Smart Suggestion Banner */}
          {showSmartSuggestion && smartSuggestion && (
            <Pressable
              onPress={() => {
                Haptics.selectionAsync();
                setCategoryId(smartSuggestion.id);
                setCategoryError("");
              }}
              style={{
                flexDirection: isRTL ? "row-reverse" : "row",
                alignItems: "center",
                gap: 8,
                marginHorizontal: 16,
                marginBottom: 8,
                backgroundColor: smartSuggestion.color + "15",
                borderRadius: 12,
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderWidth: 1,
                borderColor: smartSuggestion.color + "40",
              }}
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

          {/* Bottom Row: Account + Date + Note + Save */}
          <View style={{ paddingHorizontal: 16, gap: 10 }}>
            {/* Account + Date row */}
            <View style={{ flexDirection: isRTL ? "row-reverse" : "row", gap: 10 }}>
              {/* Account */}
              <Pressable
                onPress={() => setStep("account")}
                style={{ flex: 1, flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 8, backgroundColor: theme.background, borderRadius: 12, padding: 11, borderWidth: 1, borderColor: theme.border }}
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

              {/* Date */}
              <Pressable
                onPress={() => setStep("date")}
                style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 6, backgroundColor: theme.background, borderRadius: 12, padding: 11, borderWidth: 1, borderColor: dateError ? "#EF4444" : theme.border }}
              >
                <Feather name="calendar" size={14} color={dateError ? "#EF4444" : theme.textMuted} />
                <Text style={{ color: date === today ? typeColor : theme.textSecondary, fontSize: 13, fontWeight: "600" }}>
                  {date === today ? t.transactions.today : date === yesterday ? t.transactions.yesterday : date}
                </Text>
              </Pressable>
            </View>

            {/* Note with smart suggestions trigger */}
            <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 8, backgroundColor: theme.background, borderRadius: 12, paddingHorizontal: 12, borderWidth: 1, borderColor: theme.border }}>
              <Feather name="message-square" size={14} color={theme.textMuted} />
              <TextInput
                value={note}
                onChangeText={setNote}
                placeholder={language === "ar" ? "ملاحظة... (ستاربكس، أوبر، ...)" : "Note... (starbucks, uber, ...)"}
                placeholderTextColor={theme.textMuted}
                style={{ flex: 1, paddingVertical: 11, color: theme.text, fontSize: 13, textAlign: isRTL ? "right" : "left", ...Platform.select({ web: { outlineStyle: "none" } } as any) }}
              />
            </View>

            {/* Save Button */}
            <Pressable
              onPress={handleSave}
              disabled={saving}
              testID="quick-save-btn"
              style={{ backgroundColor: typeColor, borderRadius: 16, paddingVertical: 16, alignItems: "center", opacity: saving ? 0.7 : 1 }}
            >
              <Text style={{ color: "#fff", fontSize: 17, fontWeight: "800" }}>
                {t.common.add} {amount ? `${amount} ${selectedAccount?.currency || ""}` : ""}
              </Text>
            </Pressable>
          </View>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

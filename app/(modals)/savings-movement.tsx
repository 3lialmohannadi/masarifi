import React, { useState } from "react";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import {
  View,
  Text,
  Pressable,
  FlatList,
  Modal,
  Platform,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { CategoryIcon } from "@/components/CategoryIcon";
import { router, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import { useApp } from "@/store/AppContext";
import { useSavings } from "@/store/SavingsContext";
import { useAccounts } from "@/store/AccountsContext";
import { useTransactions } from "@/store/TransactionsContext";
import { useCategories } from "@/store/CategoriesContext";
import { getDisplayName } from "@/utils/display";
import { formatCurrency } from "@/utils/currency";
import { todayISOString } from "@/utils/date";

type MovementType = "deposit" | "withdraw";
type SourceType = "internal" | "external";

export default function SavingsMovementModal() {
  const insets = useSafeAreaInsets();
  const { theme, t, language, selectedAccountId, isRTL, showToast } = useApp();
  const { wallets, addSavingsTransaction } = useSavings();
  const { accounts, updateBalance } = useAccounts();
  const { addTransaction } = useTransactions();
  const { categories } = useCategories();
  const params = useLocalSearchParams<{ walletId?: string; type?: string }>();

  const activeAccounts = accounts.filter((a) => a.is_active);
  const defaultAccountId =
    selectedAccountId && activeAccounts.find((a) => a.id === selectedAccountId)
      ? selectedAccountId
      : activeAccounts[0]?.id || "";

  const [movementType, setMovementType] = useState<MovementType>(
    params.type === "withdraw" ? "withdraw" : "deposit"
  );
  const [sourceType, setSourceType] = useState<SourceType>("internal");
  const [walletId, setWalletId] = useState(params.walletId || wallets[0]?.id || "");
  const [accountId, setAccountId] = useState(defaultAccountId);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [showWallets, setShowWallets] = useState(false);
  const [showAccounts, setShowAccounts] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const [catSearch, setCatSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const allCategories = categories.filter((c) => c.is_active).sort((a, b) => (b.is_favorite ? 1 : 0) - (a.is_favorite ? 1 : 0));
  const selectedWallet = wallets.find((w) => w.id === walletId);
  const selectedAccount = activeAccounts.find((a) => a.id === accountId);
  const selectedCategory = allCategories.find((c) => c.id === categoryId);

  const needsAccount = sourceType === "internal";
  const isDeposit = movementType === "deposit";
  const actionColor = isDeposit ? theme.income : theme.expense;

  const validate = (): boolean => {
    const err: Record<string, string> = {};
    const amountNum = parseFloat(amount);

    if (!walletId) err.wallet = t.validation.walletRequired;
    if (!amount || isNaN(amountNum) || amountNum <= 0) err.amount = t.validation.amountPositive;

    if (needsAccount && !accountId) err.account = t.validation.accountRequired;

    if (amountNum > 0) {
      if (!isDeposit && selectedWallet && amountNum > selectedWallet.current_amount) {
        err.amount = t.validation.insufficientBalance;
      }
      if (isDeposit && needsAccount && selectedAccount && amountNum > selectedAccount.balance) {
        err.amount = t.validation.insufficientBalance;
      }
    }

    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    setLoading(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    try {
      const amountNum = parseFloat(amount);
      const today = todayISOString();
      const walletName = selectedWallet ? getDisplayName(selectedWallet, language) : "";
      const currency = selectedAccount?.currency || "QAR";
      const linkCategoryId = categoryId || allCategories[0]?.id || "";

      if (isDeposit) {
        if (sourceType === "internal") {
          // Deposit from internal account → deduct from account, add to wallet
          addSavingsTransaction({
            wallet_id: walletId,
            type: "deposit_internal",
            amount: amountNum,
            account_id: accountId,
            date: today,
            note,
          });
          updateBalance(accountId, -amountNum);
          // Record as expense on the account (money moved to savings)
          addTransaction({
            account_id: accountId,
            category_id: linkCategoryId,
            type: "expense",
            amount: amountNum,
            currency,
            date: today,
            note: note || (language === "ar" ? `إيداع ← ${walletName}` : `Deposit → ${walletName}`),
            linked_saving_wallet_id: walletId,
          });
        } else {
          // Deposit from external source → add to wallet only, no account change
          addSavingsTransaction({
            wallet_id: walletId,
            type: "deposit_external",
            amount: amountNum,
            account_id: undefined,
            date: today,
            note,
          });
          // No account balance change, no regular transaction
        }
      } else {
        // Withdrawal
        if (sourceType === "internal") {
          // Withdraw to internal account → deduct from wallet, add to account
          addSavingsTransaction({
            wallet_id: walletId,
            type: "withdraw_internal",
            amount: amountNum,
            account_id: accountId,
            date: today,
            note,
          });
          updateBalance(accountId, amountNum);
          // Record as income on the account (money returned from savings)
          addTransaction({
            account_id: accountId,
            category_id: linkCategoryId,
            type: "income",
            amount: amountNum,
            currency,
            date: today,
            note: note || (language === "ar" ? `سحب ← ${walletName}` : `Withdraw ← ${walletName}`),
            linked_saving_wallet_id: walletId,
          });
        } else {
          // External withdrawal → deduct from wallet only, no account change
          addSavingsTransaction({
            wallet_id: walletId,
            type: "withdraw_external",
            amount: amountNum,
            account_id: undefined,
            date: today,
            note,
          });
          // No account balance change
        }
      }
      showToast(t.toast.deposited);
      router.back();
    } catch {
      showToast(t.toast.error, "error");
    } finally {
      setLoading(false);
    }
  };

  const topPadding = Platform.OS === "web" ? insets.top + 67 : insets.top + 16;

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      {/* Header */}
      <View
        style={{
          flexDirection: isRTL ? "row-reverse" : "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingTop: topPadding,
          paddingHorizontal: 16,
          paddingBottom: 14,
          backgroundColor: theme.card,
          borderBottomWidth: 1,
          borderBottomColor: theme.border,
        }}
      >
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Feather name="x" size={24} color={theme.textSecondary} />
        </Pressable>
        <Text style={{ fontSize: 17, fontWeight: "700", color: theme.text }}>
          {t.savings.movement}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAwareScrollViewCompat
        contentContainerStyle={{
          padding: 16,
          paddingBottom: insets.bottom + 40,
          gap: 16,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        bottomOffset={60}
      >
        {/* Deposit / Withdraw Toggle */}
        <View
          style={{
            flexDirection: isRTL ? "row-reverse" : "row",
            backgroundColor: theme.card,
            borderRadius: 16,
            padding: 4,
            gap: 4,
          }}
        >
          {(["deposit", "withdraw"] as MovementType[]).map((mt) => {
            const isActive = movementType === mt;
            const col = mt === "deposit" ? theme.income : theme.expense;
            const label = mt === "deposit" ? t.savings.deposit : t.savings.withdraw;
            const icon = mt === "deposit" ? "arrow-down-circle" : "arrow-up-circle";
            return (
              <Pressable
                key={mt}
                onPress={() => {
                  Haptics.selectionAsync();
                  setMovementType(mt);
                  setSourceType("internal");
                  setErrors({});
                }}
                style={{
                  flex: 1,
                  flexDirection: isRTL ? "row-reverse" : "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  paddingVertical: 13,
                  borderRadius: 13,
                  backgroundColor: isActive ? col : "transparent",
                }}
              >
                <Feather name={icon} size={16} color={isActive ? "#fff" : theme.textSecondary} />
                <Text style={{ fontSize: 15, fontWeight: "700", color: isActive ? "#fff" : theme.textSecondary }}>
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Source / Destination Toggle */}
        <View style={{ gap: 8 }}>
          <Text style={{ fontSize: 13, fontWeight: "600", color: theme.textSecondary, textAlign: isRTL ? "right" : "left" }}>
            {isDeposit ? t.savings.source : t.savings.destination}
          </Text>
          <View style={{ flexDirection: isRTL ? "row-reverse" : "row", gap: 10 }}>
            {/* Internal option */}
            <Pressable
              onPress={() => { Haptics.selectionAsync(); setSourceType("internal"); setErrors({}); }}
              style={{
                flex: 1,
                flexDirection: isRTL ? "row-reverse" : "row",
                alignItems: "center",
                gap: 8,
                padding: 13,
                borderRadius: 14,
                backgroundColor: sourceType === "internal" ? actionColor + "12" : theme.card,
                borderWidth: 1.5,
                borderColor: sourceType === "internal" ? actionColor : theme.border,
              }}
            >
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 9,
                  backgroundColor: sourceType === "internal" ? actionColor + "20" : theme.background,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Feather name="credit-card" size={15} color={sourceType === "internal" ? actionColor : theme.textMuted} />
              </View>
              <Text
                style={{ flex: 1, fontSize: 13, fontWeight: "600", color: sourceType === "internal" ? actionColor : theme.textSecondary, textAlign: isRTL ? "right" : "left" }}
                numberOfLines={2}
              >
                {isDeposit ? t.savings.internalAccount : t.savings.toInternalAccount}
              </Text>
              {sourceType === "internal" && (
                <Feather name="check-circle" size={16} color={actionColor} />
              )}
            </Pressable>

            {/* External option */}
            <Pressable
              onPress={() => { Haptics.selectionAsync(); setSourceType("external"); setErrors({}); }}
              style={{
                flex: 1,
                flexDirection: isRTL ? "row-reverse" : "row",
                alignItems: "center",
                gap: 8,
                padding: 13,
                borderRadius: 14,
                backgroundColor: sourceType === "external" ? actionColor + "12" : theme.card,
                borderWidth: 1.5,
                borderColor: sourceType === "external" ? actionColor : theme.border,
              }}
            >
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 9,
                  backgroundColor: sourceType === "external" ? actionColor + "20" : theme.background,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Feather name={isDeposit ? "globe" : "external-link"} size={15} color={sourceType === "external" ? actionColor : theme.textMuted} />
              </View>
              <Text
                style={{ flex: 1, fontSize: 13, fontWeight: "600", color: sourceType === "external" ? actionColor : theme.textSecondary, textAlign: isRTL ? "right" : "left" }}
                numberOfLines={2}
              >
                {isDeposit ? t.savings.externalAccount : t.savings.toExternal}
              </Text>
              {sourceType === "external" && (
                <Feather name="check-circle" size={16} color={actionColor} />
              )}
            </Pressable>
          </View>
        </View>

        {/* Info banner for external */}
        {sourceType === "external" && (
          <View
            style={{
              flexDirection: isRTL ? "row-reverse" : "row",
              alignItems: "center",
              gap: 8,
              backgroundColor: actionColor + "10",
              borderRadius: 12,
              padding: 12,
              borderWidth: 1,
              borderColor: actionColor + "30",
            }}
          >
            <Feather name="info" size={14} color={actionColor} />
            <Text style={{ flex: 1, fontSize: 12, color: actionColor, textAlign: isRTL ? "right" : "left", lineHeight: 18 }}>
              {isDeposit
                ? (language === "ar" ? "المبلغ يُضاف للمحفظة مباشرةً دون خصم من أي حساب" : "Amount is added to wallet without deducting from any account")
                : (language === "ar" ? "المبلغ يُخصم من المحفظة دون إضافة لأي حساب داخلي" : "Amount is deducted from wallet without crediting any account")}
            </Text>
          </View>
        )}

        {/* Wallet Selector */}
        <View style={{ gap: 6 }}>
          <Text style={{ fontSize: 13, fontWeight: "600", color: theme.textSecondary, textAlign: isRTL ? "right" : "left" }}>
            {t.savings.wallet} <Text style={{ color: theme.expense }}>*</Text>
          </Text>
          <Pressable
            onPress={() => setShowWallets(true)}
            style={{
              backgroundColor: theme.input,
              borderRadius: 12,
              borderWidth: 1.5,
              borderColor: errors.wallet ? "#EF4444" : theme.inputBorder,
              padding: 13,
              flexDirection: isRTL ? "row-reverse" : "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            {selectedWallet ? (
              <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 10, flex: 1 }}>
                <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: selectedWallet.color }} />
                <Text style={{ color: theme.text, fontWeight: "600", flex: 1 }}>{getDisplayName(selectedWallet, language)}</Text>
                <Text style={{ color: theme.textSecondary, fontSize: 13 }}>
                  {formatCurrency(selectedWallet.current_amount, "QAR", language)}
                </Text>
              </View>
            ) : (
              <Text style={{ color: theme.textMuted }}>{t.savings.selectWallet}</Text>
            )}
            <Feather name="chevron-down" size={16} color={theme.textMuted} style={{ marginStart: 8 }} />
          </Pressable>
          {!!errors.wallet && (
            <Text style={{ fontSize: 12, color: "#EF4444" }}>{errors.wallet}</Text>
          )}
        </View>

        {/* Account Selector (only for internal) */}
        {needsAccount && (
          <View style={{ gap: 6 }}>
            <Text style={{ fontSize: 13, fontWeight: "600", color: theme.textSecondary, textAlign: isRTL ? "right" : "left" }}>
              {isDeposit
                ? (language === "ar" ? "الحساب المصدر" : "Source Account")
                : (language === "ar" ? "الحساب المستلم" : "Destination Account")}{" "}
              <Text style={{ color: theme.expense }}>*</Text>
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
                <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 10, flex: 1 }}>
                  <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: selectedAccount.color }} />
                  <Text style={{ color: theme.text, fontWeight: "600", flex: 1 }}>{getDisplayName(selectedAccount, language)}</Text>
                  <Text style={{ color: theme.textSecondary, fontSize: 13 }}>
                    {formatCurrency(selectedAccount.balance, selectedAccount.currency, language)}
                  </Text>
                </View>
              ) : (
                <Text style={{ color: theme.textMuted }}>{t.transactions.selectAccount}</Text>
              )}
              <Feather name="chevron-down" size={16} color={theme.textMuted} style={{ marginStart: 8 }} />
            </Pressable>
            {!!errors.account && (
              <Text style={{ fontSize: 12, color: "#EF4444" }}>{errors.account}</Text>
            )}
          </View>
        )}

        {/* Category Selector */}
        <View style={{ gap: 6 }}>
          <Text style={{ fontSize: 13, fontWeight: "600", color: theme.textSecondary, textAlign: isRTL ? "right" : "left" }}>
            {t.categories.title} ({t.common.optional})
          </Text>
          <Pressable
            onPress={() => setShowCategories(true)}
            style={{
              backgroundColor: theme.input,
              borderRadius: 12,
              borderWidth: 1.5,
              borderColor: theme.inputBorder,
              padding: 13,
              flexDirection: isRTL ? "row-reverse" : "row",
              alignItems: "center",
              gap: 10,
            }}
          >
            {selectedCategory ? (
              <>
                <View style={{ width: 30, height: 30, borderRadius: 8, backgroundColor: selectedCategory.color + "20", alignItems: "center", justifyContent: "center" }}>
                  <CategoryIcon name={selectedCategory.icon || "tag"} size={15} color={selectedCategory.color} />
                </View>
                <Text style={{ flex: 1, color: theme.text, fontSize: 15, fontWeight: "600", textAlign: isRTL ? "right" : "left" }}>
                  {getDisplayName(selectedCategory, language)}
                </Text>
                <Pressable onPress={(e) => { e.stopPropagation(); setCategoryId(""); }} hitSlop={8}>
                  <Feather name="x" size={16} color={theme.textMuted} />
                </Pressable>
              </>
            ) : (
              <>
                <Feather name="tag" size={16} color={theme.textMuted} />
                <Text style={{ flex: 1, color: theme.textMuted, fontSize: 15, textAlign: isRTL ? "right" : "left" }}>
                  {language === "ar" ? "اختر التصنيف" : "Select Category"}
                </Text>
                <Feather name="chevron-down" size={16} color={theme.textMuted} />
              </>
            )}
          </Pressable>
        </View>

        {/* Amount */}
        <View style={{ gap: 6 }}>
          <Text style={{ fontSize: 13, fontWeight: "600", color: theme.textSecondary, textAlign: isRTL ? "right" : "left" }}>
            {t.common.amount} <Text style={{ color: theme.expense }}>*</Text>
          </Text>
          <View
            style={{
              flexDirection: isRTL ? "row-reverse" : "row",
              alignItems: "center",
              backgroundColor: theme.input,
              borderRadius: 12,
              borderWidth: 1.5,
              borderColor: errors.amount ? "#EF4444" : theme.inputBorder,
              paddingHorizontal: 14,
            }}
          >
            <TextInput
              value={amount}
              onChangeText={(v) => { setAmount(v); if (errors.amount) setErrors((e) => ({ ...e, amount: "" })); }}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor={theme.textMuted}
              style={{
                flex: 1,
                paddingVertical: 14,
                fontSize: 22,
                fontWeight: "700",
                color: actionColor,
                textAlign: "center",
                ...Platform.select({ web: { outlineStyle: "none" } } as any),
              }}
            />
          </View>
          {!!errors.amount && (
            <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 4 }}>
              <Feather name="alert-circle" size={12} color="#EF4444" />
              <Text style={{ fontSize: 12, color: "#EF4444" }}>{errors.amount}</Text>
            </View>
          )}
        </View>

        {/* Note */}
        <View style={{ gap: 6 }}>
          <Text style={{ fontSize: 13, fontWeight: "600", color: theme.textSecondary, textAlign: isRTL ? "right" : "left" }}>
            {t.common.note} ({t.common.optional})
          </Text>
          <View
            style={{
              backgroundColor: theme.input,
              borderRadius: 12,
              borderWidth: 1.5,
              borderColor: theme.inputBorder,
              paddingHorizontal: 14,
              minHeight: 70,
            }}
          >
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder={language === "ar" ? "ملاحظة..." : "Note..."}
              placeholderTextColor={theme.textMuted}
              multiline
              style={{
                paddingVertical: 12,
                color: theme.text,
                fontSize: 14,
                textAlign: isRTL ? "right" : "left",
                ...Platform.select({ web: { outlineStyle: "none" } } as any),
              }}
            />
          </View>
        </View>

        {/* Save Button */}
        <Pressable
          onPress={handleSave}
          disabled={loading}
          style={{
            backgroundColor: actionColor,
            borderRadius: 16,
            paddingVertical: 16,
            alignItems: "center",
            flexDirection: isRTL ? "row-reverse" : "row",
            justifyContent: "center",
            gap: 8,
            opacity: loading ? 0.7 : 1,
            marginTop: 4,
          }}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Feather
              name={isDeposit ? "arrow-down-circle" : "arrow-up-circle"}
              size={18}
              color="#fff"
            />
          )}
          <Text style={{ color: "#fff", fontSize: 17, fontWeight: "800" }}>
            {isDeposit ? t.savings.deposit : t.savings.withdraw}
            {amount && !isNaN(parseFloat(amount)) ? `  ${parseFloat(amount).toFixed(2)}` : ""}
          </Text>
        </Pressable>
      </KeyboardAwareScrollViewCompat>

      {/* Wallet Selector Modal */}
      <Modal visible={showWallets} transparent animationType="slide" statusBarTranslucent>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
          <View
            style={{
              backgroundColor: theme.card,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              maxHeight: "60%",
              paddingBottom: insets.bottom + 8,
            }}
          >
            <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: theme.border, alignSelf: "center", marginTop: 10, marginBottom: 4 }} />
            <View
              style={{
                flexDirection: isRTL ? "row-reverse" : "row",
                justifyContent: "space-between",
                alignItems: "center",
                padding: 16,
                borderBottomWidth: 1,
                borderBottomColor: theme.border,
              }}
            >
              <Text style={{ fontSize: 17, fontWeight: "700", color: theme.text }}>
                {t.savings.selectWallet}
              </Text>
              <Pressable onPress={() => setShowWallets(false)} hitSlop={10}>
                <Feather name="x" size={22} color={theme.textSecondary} />
              </Pressable>
            </View>
            <FlatList
              data={wallets.filter((w) => !w.is_archived)}
              keyExtractor={(w) => w.id}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => { setWalletId(item.id); setShowWallets(false); setErrors((e) => ({ ...e, wallet: "" })); }}
                  style={{
                    flexDirection: isRTL ? "row-reverse" : "row",
                    alignItems: "center",
                    gap: 12,
                    padding: 15,
                    backgroundColor: item.id === walletId ? theme.primaryLight : "transparent",
                    marginHorizontal: 8,
                    marginVertical: 2,
                    borderRadius: 12,
                  }}
                >
                  <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: item.color + "22", alignItems: "center", justifyContent: "center" }}>
                    <CategoryIcon name={item.icon || "tag"} size={17} color={item.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: theme.text, fontWeight: "600", textAlign: isRTL ? "right" : "left" }}>
                      {getDisplayName(item, language)}
                    </Text>
                    <Text style={{ color: theme.textSecondary, fontSize: 12, textAlign: isRTL ? "right" : "left" }}>
                      {formatCurrency(item.current_amount, "QAR", language)}
                    </Text>
                  </View>
                  {item.id === walletId && <Feather name="check" size={16} color={theme.primary} />}
                </Pressable>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Account Selector Modal */}
      <Modal visible={showAccounts} transparent animationType="slide" statusBarTranslucent>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
          <View
            style={{
              backgroundColor: theme.card,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              maxHeight: "60%",
              paddingBottom: insets.bottom + 8,
            }}
          >
            <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: theme.border, alignSelf: "center", marginTop: 10, marginBottom: 4 }} />
            <View
              style={{
                flexDirection: isRTL ? "row-reverse" : "row",
                justifyContent: "space-between",
                alignItems: "center",
                padding: 16,
                borderBottomWidth: 1,
                borderBottomColor: theme.border,
              }}
            >
              <Text style={{ fontSize: 17, fontWeight: "700", color: theme.text }}>
                {t.transactions.selectAccount}
              </Text>
              <Pressable onPress={() => setShowAccounts(false)} hitSlop={10}>
                <Feather name="x" size={22} color={theme.textSecondary} />
              </Pressable>
            </View>
            <FlatList
              data={activeAccounts}
              keyExtractor={(a) => a.id}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => { setAccountId(item.id); setShowAccounts(false); setErrors((e) => ({ ...e, account: "" })); }}
                  style={{
                    flexDirection: isRTL ? "row-reverse" : "row",
                    alignItems: "center",
                    gap: 12,
                    padding: 15,
                    backgroundColor: item.id === accountId ? theme.primaryLight : "transparent",
                    marginHorizontal: 8,
                    marginVertical: 2,
                    borderRadius: 12,
                  }}
                >
                  <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: item.color + "22", alignItems: "center", justifyContent: "center" }}>
                    <CategoryIcon name={item.icon || "tag"} size={17} color={item.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: theme.text, fontWeight: "600", textAlign: isRTL ? "right" : "left" }}>
                      {getDisplayName(item, language)}
                    </Text>
                    <Text style={{ color: theme.textSecondary, fontSize: 12, textAlign: isRTL ? "right" : "left" }}>
                      {formatCurrency(item.balance, item.currency, language)}
                    </Text>
                  </View>
                  {item.id === accountId && <Feather name="check" size={16} color={theme.primary} />}
                </Pressable>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Category Picker Modal */}
      <Modal visible={showCategories} transparent animationType="slide" statusBarTranslucent>
        <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }} onPress={() => { setShowCategories(false); setCatSearch(""); }}>
          <Pressable onPress={() => {}} style={{ backgroundColor: theme.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: "72%", paddingTop: 12, paddingBottom: insets.bottom + 16 }}>
            <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: theme.border, alignSelf: "center", marginBottom: 8 }} />
            <View style={{ flexDirection: isRTL ? "row-reverse" : "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: theme.border }}>
              <Text style={{ fontSize: 17, fontWeight: "700", color: theme.text }}>
                {language === "ar" ? "اختر التصنيف" : "Select Category"}
              </Text>
              <Pressable onPress={() => { setShowCategories(false); setCatSearch(""); }} hitSlop={8}>
                <Feather name="x" size={22} color={theme.textSecondary} />
              </Pressable>
            </View>
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
            <FlatList
              data={catSearch.trim() ? allCategories.filter((c) => c.name_ar.includes(catSearch) || c.name_en.toLowerCase().includes(catSearch.toLowerCase())) : allCategories}
              keyExtractor={(c) => c.id}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => { Haptics.selectionAsync(); setCategoryId(item.id); setShowCategories(false); setCatSearch(""); }}
                  style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 12, padding: 14, backgroundColor: item.id === categoryId ? theme.primary + "15" : "transparent", borderRadius: 12, marginHorizontal: 8, marginVertical: 2 }}
                >
                  <View style={{ width: 38, height: 38, borderRadius: 11, backgroundColor: item.color + "22", alignItems: "center", justifyContent: "center" }}>
                    <CategoryIcon name={item.icon || "tag"} size={19} color={item.color} />
                  </View>
                  <Text style={{ flex: 1, color: theme.text, fontWeight: "500", fontSize: 15, textAlign: isRTL ? "right" : "left" }}>
                    {getDisplayName(item, language)}
                  </Text>
                  {item.is_favorite && <Feather name="star" size={14} color="#F59E0B" />}
                  {item.id === categoryId && <Feather name="check" size={18} color={theme.primary} />}
                </Pressable>
              )}
              ListEmptyComponent={
                <Text style={{ color: theme.textMuted, textAlign: "center", padding: 20 }}>
                  {t.categories.noCategories}
                </Text>
              }
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

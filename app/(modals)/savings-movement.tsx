import React, { useState } from "react";
import { View, Text, ScrollView, Pressable, FlatList, Modal } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import { useApp } from "@/store/AppContext";
import { useSavings } from "@/store/SavingsContext";
import { useAccounts } from "@/store/AccountsContext";
import { useTransactions } from "@/store/TransactionsContext";
import { useCategories } from "@/store/CategoriesContext";
import { AppButton } from "@/components/ui/AppButton";
import { AppInput } from "@/components/ui/AppInput";
import { getDisplayName } from "@/utils/display";
import { formatCurrency } from "@/utils/currency";
import { todayISOString } from "@/utils/date";

type MovementType = "deposit" | "withdraw";

export default function SavingsMovementModal() {
  const insets = useSafeAreaInsets();
  const { theme, t, language, selectedAccountId, isRTL } = useApp();
  const { wallets, addSavingsTransaction } = useSavings();
  const { accounts, updateBalance } = useAccounts();
  const { addTransaction } = useTransactions();
  const { getCategoriesByType } = useCategories();
  const params = useLocalSearchParams<{ walletId?: string }>();

  const [movementType, setMovementType] = useState<MovementType>("deposit");
  const [walletId, setWalletId] = useState(params.walletId || wallets[0]?.id || "");
  const [accountId, setAccountId] = useState(
    selectedAccountId && accounts.find((a) => a.id === selectedAccountId && a.is_active)
      ? selectedAccountId
      : accounts.find((a) => a.is_active)?.id || ""
  );
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [showWallets, setShowWallets] = useState(false);
  const [showAccounts, setShowAccounts] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const savingsCategories = getCategoriesByType("savings");
  const selectedWallet = wallets.find((w) => w.id === walletId);
  const selectedAccount = accounts.find((a) => a.id === accountId);

  const validate = () => {
    const err: Record<string, string> = {};
    if (!walletId) err.wallet = t.validation.walletRequired;
    if (!accountId) err.account = t.validation.accountRequired;
    if (!amount || parseFloat(amount) <= 0) err.amount = t.validation.amountPositive;
    const amountNum = parseFloat(amount);
    if (movementType === "withdraw" && selectedWallet && amountNum > selectedWallet.current_amount) {
      err.amount = t.validation.insufficientBalance;
    }
    if (movementType === "deposit" && selectedAccount && amountNum > selectedAccount.balance) {
      err.amount = t.validation.insufficientBalance;
    }
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const amountNum = parseFloat(amount);
      const today = todayISOString();
      const walletName = selectedWallet ? getDisplayName(selectedWallet, language) : "";

      if (movementType === "deposit") {
        addSavingsTransaction({
          wallet_id: walletId,
          type: "deposit_internal",
          amount: amountNum,
          account_id: accountId,
          date: today,
          note: note,
        });
        updateBalance(accountId, -amountNum);
        const savingsCat = savingsCategories[0] || getCategoriesByType("expense")[0];
        if (savingsCat) {
          addTransaction({
            account_id: accountId,
            category_id: savingsCat.id,
            type: "expense",
            amount: amountNum,
            currency: selectedAccount?.currency || "QAR",
            date: today,
            note: note || (language === "ar" ? `إيداع - ${walletName}` : `Deposit - ${walletName}`),
            linked_saving_wallet_id: walletId,
          });
        }
      } else {
        addSavingsTransaction({
          wallet_id: walletId,
          type: "withdraw_internal",
          amount: amountNum,
          account_id: accountId,
          date: today,
          note: note,
        });
        updateBalance(accountId, amountNum);
        if (savingsCategories[0]) {
          addTransaction({
            account_id: accountId,
            category_id: savingsCategories[0].id,
            type: "income",
            amount: amountNum,
            currency: selectedAccount?.currency || "QAR",
            date: today,
            note: note || (language === "ar" ? `سحب - ${walletName}` : `Withdraw - ${walletName}`),
            linked_saving_wallet_id: walletId,
          });
        }
      }
      router.back();
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
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
          {t.savings.movement}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: insets.bottom + 30 }}>
        {/* Type Toggle */}
        <View style={{ flexDirection: "row", backgroundColor: theme.card, borderRadius: 14, padding: 4, gap: 4 }}>
          {(["deposit", "withdraw"] as MovementType[]).map((mt) => {
            const isActive = movementType === mt;
            const label = mt === "deposit" ? t.savings.deposit : t.savings.withdraw;
            const activeColor = mt === "deposit" ? theme.income : theme.expense;
            return (
              <Pressable
                key={mt}
                onPress={() => { Haptics.selectionAsync(); setMovementType(mt); }}
                style={{ flex: 1, paddingVertical: 12, borderRadius: 11, alignItems: "center", backgroundColor: isActive ? activeColor : "transparent" }}
              >
                <Text style={{ fontSize: 15, fontWeight: "700", color: isActive ? "#fff" : theme.textSecondary }}>{label}</Text>
              </Pressable>
            );
          })}
        </View>

        {/* Wallet Selector */}
        <View style={{ gap: 6 }}>
          <Text style={{ fontSize: 13, fontWeight: "500", color: theme.textSecondary, textAlign: isRTL ? "right" : "left" }}>{t.savings.wallet}</Text>
          <Pressable
            onPress={() => setShowWallets(true)}
            style={{ backgroundColor: theme.input, borderRadius: 12, borderWidth: 1.5, borderColor: errors.wallet ? "#EF4444" : theme.inputBorder, padding: 13, flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", justifyContent: "space-between" }}
          >
            {selectedWallet ? (
              <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 8 }}>
                <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: selectedWallet.color }} />
                <Text style={{ color: theme.text, fontWeight: "500" }}>{getDisplayName(selectedWallet, language)}</Text>
                <Text style={{ color: theme.textSecondary, fontSize: 13 }}>({formatCurrency(selectedWallet.current_amount, "QAR", language)})</Text>
              </View>
            ) : (
              <Text style={{ color: theme.textMuted }}>{t.savings.selectWallet}</Text>
            )}
            <Feather name="chevron-down" size={16} color={theme.textMuted} />
          </Pressable>
          {errors.wallet && <Text style={{ fontSize: 12, color: "#EF4444" }}>{errors.wallet}</Text>}
        </View>

        {/* Account Selector */}
        <View style={{ gap: 6 }}>
          <Text style={{ fontSize: 13, fontWeight: "500", color: theme.textSecondary, textAlign: isRTL ? "right" : "left" }}>{t.transactions.account}</Text>
          <Pressable
            onPress={() => setShowAccounts(true)}
            style={{ backgroundColor: theme.input, borderRadius: 12, borderWidth: 1.5, borderColor: errors.account ? "#EF4444" : theme.inputBorder, padding: 13, flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", justifyContent: "space-between" }}
          >
            {selectedAccount ? (
              <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 8 }}>
                <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: selectedAccount.color }} />
                <Text style={{ color: theme.text, fontWeight: "500" }}>{getDisplayName(selectedAccount, language)}</Text>
                <Text style={{ color: theme.textSecondary, fontSize: 13 }}>({formatCurrency(selectedAccount.balance, selectedAccount.currency, language)})</Text>
              </View>
            ) : (
              <Text style={{ color: theme.textMuted }}>{t.transactions.selectAccount}</Text>
            )}
            <Feather name="chevron-down" size={16} color={theme.textMuted} />
          </Pressable>
          {errors.account && <Text style={{ fontSize: 12, color: "#EF4444" }}>{errors.account}</Text>}
        </View>

        <AppInput label={t.common.amount} value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholder="0.00" error={errors.amount} textAlign="center" style={{ fontSize: 24, fontWeight: "700" }} />

        <AppInput label={`${t.common.note} (${t.common.optional})`} value={note} onChangeText={setNote} multiline placeholder={language === "ar" ? "ملاحظة..." : "Note..."} />

        <AppButton
          title={movementType === "deposit" ? t.savings.deposit : t.savings.withdraw}
          onPress={handleSave}
          loading={loading}
          fullWidth
          size="lg"
        />
      </ScrollView>

      {/* Wallet Selector Modal */}
      <Modal visible={showWallets} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
          <View style={{ backgroundColor: theme.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: "60%", paddingVertical: 8 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16 }}>
              <Text style={{ fontSize: 17, fontWeight: "700", color: theme.text }}>{t.savings.selectWallet}</Text>
              <Pressable onPress={() => setShowWallets(false)}><Feather name="x" size={22} color={theme.textSecondary} /></Pressable>
            </View>
            <FlatList
              data={wallets.filter((w) => !w.is_archived)}
              keyExtractor={(w) => w.id}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => { setWalletId(item.id); setShowWallets(false); }}
                  style={{ flexDirection: "row", alignItems: "center", gap: 12, padding: 14, backgroundColor: item.id === walletId ? theme.primaryLight : "transparent", borderRadius: 12, marginHorizontal: 8, marginVertical: 2 }}
                >
                  <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: item.color }} />
                  <Text style={{ flex: 1, color: theme.text, fontWeight: "500" }}>{getDisplayName(item, language)}</Text>
                  <Text style={{ color: theme.textSecondary, fontSize: 13 }}>{formatCurrency(item.current_amount, "QAR", language)}</Text>
                </Pressable>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Account Selector Modal */}
      <Modal visible={showAccounts} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
          <View style={{ backgroundColor: theme.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: "60%", paddingVertical: 8 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16 }}>
              <Text style={{ fontSize: 17, fontWeight: "700", color: theme.text }}>{t.transactions.selectAccount}</Text>
              <Pressable onPress={() => setShowAccounts(false)}><Feather name="x" size={22} color={theme.textSecondary} /></Pressable>
            </View>
            <FlatList
              data={accounts.filter((a) => a.is_active)}
              keyExtractor={(a) => a.id}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => { setAccountId(item.id); setShowAccounts(false); }}
                  style={{ flexDirection: "row", alignItems: "center", gap: 12, padding: 14, backgroundColor: item.id === accountId ? theme.primaryLight : "transparent", borderRadius: 12, marginHorizontal: 8, marginVertical: 2 }}
                >
                  <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: item.color }} />
                  <Text style={{ flex: 1, color: theme.text, fontWeight: "500" }}>{getDisplayName(item, language)}</Text>
                  <Text style={{ color: theme.textSecondary, fontSize: 13 }}>{formatCurrency(item.balance, item.currency, language)}</Text>
                </Pressable>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

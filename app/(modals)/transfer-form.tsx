import React, { useState } from "react";
import { View, Text, ScrollView, Pressable, FlatList, Modal } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { useApp } from "@/store/AppContext";
import { useAccounts } from "@/store/AccountsContext";
import { useTransactions } from "@/store/TransactionsContext";
import { AppButton } from "@/components/ui/AppButton";
import { AppInput } from "@/components/ui/AppInput";
import { getDisplayName } from "@/utils/display";
import { formatCurrency } from "@/utils/currency";
import { todayISOString } from "@/utils/date";

function isValidDate(str: string): boolean {
  if (!str || !/^\d{4}-\d{2}-\d{2}$/.test(str)) return false;
  const d = new Date(str);
  return !isNaN(d.getTime());
}

export default function TransferFormModal() {
  const insets = useSafeAreaInsets();
  const { theme, t, language, selectedAccountId, isRTL } = useApp();
  const { accounts, updateBalance } = useAccounts();
  const { addTransfer } = useTransactions();

  const activeAccounts = accounts.filter((a) => a.is_active);

  const [fromId, setFromId] = useState(selectedAccountId || activeAccounts[0]?.id || "");
  const [toId, setToId] = useState(
    activeAccounts.length > 1
      ? activeAccounts.find((a) => a.id !== (selectedAccountId || activeAccounts[0]?.id))?.id || ""
      : ""
  );
  const [amount, setAmount] = useState("");
  const [exchangeRate, setExchangeRate] = useState("1");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(todayISOString());
  const [showFrom, setShowFrom] = useState(false);
  const [showTo, setShowTo] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fromAccount = accounts.find((a) => a.id === fromId);
  const toAccount = accounts.find((a) => a.id === toId);
  const sameCurrency = fromAccount?.currency === toAccount?.currency;
  const rate = parseFloat(exchangeRate) || 1;
  const sourceAmount = parseFloat(amount) || 0;
  const destinationAmount = sameCurrency ? sourceAmount : sourceAmount * rate;

  const validate = () => {
    const err: Record<string, string> = {};
    if (!fromId) err.from = t.validation.sourceAccountRequired;
    if (!toId) err.to = t.validation.destinationAccountRequired;
    if (fromId && toId && fromId === toId) err.to = t.validation.differentAccounts;
    if (!amount || parseFloat(amount) <= 0) err.amount = t.validation.amountPositive;
    if (fromAccount && parseFloat(amount) > fromAccount.balance) err.amount = t.validation.insufficientBalance;
    if (!sameCurrency && (parseFloat(exchangeRate) <= 0 || isNaN(parseFloat(exchangeRate)))) {
      err.exchangeRate = t.validation.amountPositive;
    }
    if (!date) err.date = t.validation.dateRequired;
    else if (!isValidDate(date)) err.date = t.validation.dateInvalid;
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      addTransfer({
        source_account_id: fromId,
        destination_account_id: toId,
        source_amount: sourceAmount,
        destination_amount: destinationAmount,
        exchange_rate: sameCurrency ? 1 : rate,
        date,
        note: note || (language === "ar" ? "تحويل" : "Transfer"),
      });
      updateBalance(fromId, -sourceAmount);
      updateBalance(toId, destinationAmount);
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const AccountSelectorModal = ({
    visible,
    onClose,
    selected,
    onSelect,
    exclude,
    title,
  }: {
    visible: boolean;
    onClose: () => void;
    selected: string;
    onSelect: (id: string) => void;
    exclude?: string;
    title: string;
  }) => (
    <Modal visible={visible} transparent animationType="slide">
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
        <View style={{ backgroundColor: theme.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: "60%", paddingVertical: 8 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16 }}>
            <Text style={{ fontSize: 17, fontWeight: "700", color: theme.text }}>{title}</Text>
            <Pressable onPress={onClose}><Feather name="x" size={22} color={theme.textSecondary} /></Pressable>
          </View>
          <FlatList
            data={activeAccounts.filter((a) => a.id !== exclude)}
            keyExtractor={(a) => a.id}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => { onSelect(item.id); onClose(); }}
                style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 12, padding: 14, backgroundColor: item.id === selected ? theme.primaryLight : "transparent", borderRadius: 12, marginHorizontal: 8, marginVertical: 2 }}
              >
                <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: item.color }} />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: theme.text, fontWeight: "600" }}>{getDisplayName(item, language)}</Text>
                  <Text style={{ color: theme.textSecondary, fontSize: 12 }}>{t.accounts.types[item.type]}</Text>
                </View>
                <Text style={{ color: theme.textSecondary, fontSize: 13 }}>{formatCurrency(item.balance, item.currency, language)}</Text>
              </Pressable>
            )}
          />
        </View>
      </View>
    </Modal>
  );

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
          {t.transfer.title}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: insets.bottom + 30 }}>
        {/* From Account */}
        <View style={{ gap: 6 }}>
          <Text style={{ fontSize: 13, fontWeight: "500", color: theme.textSecondary, textAlign: isRTL ? "right" : "left" }}>{t.transfer.fromAccount}</Text>
          <Pressable
            onPress={() => setShowFrom(true)}
            style={{ backgroundColor: theme.input, borderRadius: 12, borderWidth: 1.5, borderColor: errors.from ? "#EF4444" : theme.inputBorder, padding: 13, flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", justifyContent: "space-between" }}
          >
            {fromAccount ? (
              <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 8 }}>
                <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: fromAccount.color }} />
                <Text style={{ color: theme.text, fontWeight: "500" }}>{getDisplayName(fromAccount, language)}</Text>
                <Text style={{ color: theme.textSecondary, fontSize: 13 }}>({formatCurrency(fromAccount.balance, fromAccount.currency, language)})</Text>
              </View>
            ) : (
              <Text style={{ color: theme.textMuted }}>{t.transactions.selectAccount}</Text>
            )}
            <Feather name="chevron-down" size={16} color={theme.textMuted} />
          </Pressable>
          {errors.from && <Text style={{ fontSize: 12, color: "#EF4444" }}>{errors.from}</Text>}
        </View>

        {/* Arrow Indicator */}
        <View style={{ alignItems: "center" }}>
          <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: theme.transfer + "20", alignItems: "center", justifyContent: "center" }}>
            <Feather name="arrow-down" size={22} color={theme.transfer} />
          </View>
        </View>

        {/* To Account */}
        <View style={{ gap: 6 }}>
          <Text style={{ fontSize: 13, fontWeight: "500", color: theme.textSecondary, textAlign: isRTL ? "right" : "left" }}>{t.transfer.toAccount}</Text>
          <Pressable
            onPress={() => setShowTo(true)}
            style={{ backgroundColor: theme.input, borderRadius: 12, borderWidth: 1.5, borderColor: errors.to ? "#EF4444" : theme.inputBorder, padding: 13, flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", justifyContent: "space-between" }}
          >
            {toAccount ? (
              <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 8 }}>
                <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: toAccount.color }} />
                <Text style={{ color: theme.text, fontWeight: "500" }}>{getDisplayName(toAccount, language)}</Text>
                <Text style={{ color: theme.textSecondary, fontSize: 13 }}>({formatCurrency(toAccount.balance, toAccount.currency, language)})</Text>
              </View>
            ) : (
              <Text style={{ color: theme.textMuted }}>{t.transactions.selectAccount}</Text>
            )}
            <Feather name="chevron-down" size={16} color={theme.textMuted} />
          </Pressable>
          {errors.to && <Text style={{ fontSize: 12, color: "#EF4444" }}>{errors.to}</Text>}
        </View>

        {/* Source Amount */}
        <AppInput
          label={sameCurrency ? t.common.amount : t.transfer.sourceAmount}
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
          placeholder="0.00"
          error={errors.amount}
          textAlign="center"
          style={{ fontSize: 24, fontWeight: "700" }}
        />

        {/* Exchange Rate — only when currencies differ */}
        {!sameCurrency && fromAccount && toAccount && (
          <View style={{ gap: 8 }}>
            <View style={{ backgroundColor: theme.warningBackground, borderRadius: 12, padding: 12, flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 8 }}>
              <Feather name="alert-circle" size={16} color={theme.warningText} />
              <Text style={{ flex: 1, fontSize: 13, color: theme.warningText }}>
                {t.transfer.differentCurrencies}: {fromAccount.currency} → {toAccount.currency}
              </Text>
            </View>
            <AppInput
              label={`${t.transfer.exchangeRate} (1 ${fromAccount.currency} = ? ${toAccount.currency})`}
              value={exchangeRate}
              onChangeText={setExchangeRate}
              keyboardType="decimal-pad"
              placeholder="1.00"
              error={errors.exchangeRate}
            />
            {sourceAmount > 0 && rate > 0 && (
              <View style={{ backgroundColor: theme.card, borderRadius: 12, padding: 12, alignItems: "center" }}>
                <Text style={{ fontSize: 13, color: theme.textSecondary }}>
                  {formatCurrency(sourceAmount, fromAccount.currency, language)}
                  {" → "}
                  {formatCurrency(destinationAmount, toAccount.currency, language)}
                </Text>
              </View>
            )}
          </View>
        )}

        <AppInput
          label={t.common.date}
          value={date}
          onChangeText={(v) => { setDate(v); if (errors.date) setErrors((e) => ({ ...e, date: "" })); }}
          placeholder="YYYY-MM-DD"
          error={errors.date}
        />

        <AppInput
          label={`${t.common.note} (${t.common.optional})`}
          value={note}
          onChangeText={setNote}
          placeholder={language === "ar" ? "ملاحظة..." : "Note..."}
        />

        <AppButton title={t.transfer.confirm} onPress={handleSave} loading={loading} fullWidth size="lg" />
      </ScrollView>

      <AccountSelectorModal
        visible={showFrom}
        onClose={() => setShowFrom(false)}
        selected={fromId}
        onSelect={setFromId}
        exclude={toId}
        title={t.transfer.fromAccount}
      />
      <AccountSelectorModal
        visible={showTo}
        onClose={() => setShowTo(false)}
        selected={toId}
        onSelect={setToId}
        exclude={fromId}
        title={t.transfer.toAccount}
      />
    </View>
  );
}

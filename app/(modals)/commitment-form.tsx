import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  Modal,
  FlatList,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import { useApp } from "@/store/AppContext";
import { useCommitments } from "@/store/CommitmentsContext";
import { useAccounts } from "@/store/AccountsContext";
import { useCategories } from "@/store/CategoriesContext";
import { AppButton } from "@/components/ui/AppButton";
import { AppInput } from "@/components/ui/AppInput";
import { BilingualNameInput } from "@/components/BilingualNameInput";
import { getDisplayName } from "@/utils/display";
import { formatCurrency } from "@/utils/currency";
import { todayISOString } from "@/utils/date";
import type { RecurrenceType } from "@/types";

export default function CommitmentFormModal() {
  const insets = useSafeAreaInsets();
  const { theme, t, language, isRTL } = useApp();
  const { commitments, addCommitment, updateCommitment, deleteCommitment } = useCommitments();
  const { accounts } = useAccounts();
  const { getCategoriesByType } = useCategories();
  const params = useLocalSearchParams<{ id?: string }>();

  const existing = params.id ? commitments.find((c) => c.id === params.id) : undefined;
  const commitmentCategories = getCategoriesByType("commitment");

  const [nameAr, setNameAr] = useState(existing?.name_ar || "");
  const [nameEn, setNameEn] = useState(existing?.name_en || "");
  const [amount, setAmount] = useState(existing ? String(existing.amount) : "");
  const [accountId, setAccountId] = useState(existing?.account_id || accounts[0]?.id || "");
  const [categoryId, setCategoryId] = useState(existing?.category_id || commitmentCategories[0]?.id || "");
  const [dueDate, setDueDate] = useState(existing?.due_date || todayISOString());
  const [recurrence, setRecurrence] = useState<RecurrenceType>(existing?.recurrence_type || "monthly");
  const [note, setNote] = useState(existing?.note || "");
  const [showAccounts, setShowAccounts] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const RECURRENCE_TYPES: RecurrenceType[] = ["none", "daily", "weekly", "monthly", "yearly"];

  const validate = () => {
    const err: Record<string, string> = {};
    if (!nameAr.trim() && !nameEn.trim()) err.name = t.validation.nameRequired;
    if (!amount || parseFloat(amount) <= 0) err.amount = t.validation.amountPositive;
    if (!accountId) err.account = t.validation.accountRequired;
    if (!dueDate) err.date = t.validation.dateRequired;
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const data = {
        name_ar: nameAr,
        name_en: nameEn,
        amount: parseFloat(amount),
        account_id: accountId,
        category_id: categoryId || commitmentCategories[0]?.id || "",
        due_date: dueDate,
        recurrence_type: recurrence,
        status: "upcoming" as const,
        is_manual: recurrence === "none",
        note,
      };
      if (existing) {
        updateCommitment(existing.id, data);
      } else {
        addCommitment(data);
      }
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(t.common.areYouSure, t.commitments.deleteConfirm, [
      { text: t.common.cancel, style: "cancel" },
      {
        text: t.common.delete,
        style: "destructive",
        onPress: () => {
          if (existing) deleteCommitment(existing.id);
          router.back();
        },
      },
    ]);
  };

  const selectedAccount = accounts.find((a) => a.id === accountId);

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
          {existing ? t.commitments.edit : t.commitments.add}
        </Text>
        {existing ? (
          <Pressable onPress={handleDelete}>
            <Feather name="trash-2" size={20} color={theme.expense} />
          </Pressable>
        ) : (
          <View style={{ width: 24 }} />
        )}
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: insets.bottom + 30 }}>
        <BilingualNameInput nameAr={nameAr} nameEn={nameEn} onChangeAr={setNameAr} onChangeEn={setNameEn} errorAr={errors.name} />

        <AppInput label={t.common.amount} value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholder="0.00" error={errors.amount} />

        {/* Account Picker */}
        <View style={{ gap: 6 }}>
          <Text style={{ fontSize: 13, fontWeight: "500", color: theme.textSecondary, textAlign: isRTL ? "right" : "left" }}>{t.transactions.account}</Text>
          <Pressable
            onPress={() => setShowAccounts(true)}
            style={{ backgroundColor: theme.input, borderRadius: 12, borderWidth: 1.5, borderColor: errors.account ? "#EF4444" : theme.inputBorder, padding: 13, flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", justifyContent: "space-between" }}
          >
            <Text style={{ color: selectedAccount ? theme.text : theme.textMuted, fontSize: 15 }}>
              {selectedAccount ? getDisplayName(selectedAccount, language) : t.transactions.selectAccount}
            </Text>
            <Feather name="chevron-down" size={16} color={theme.textMuted} />
          </Pressable>
          {errors.account && <Text style={{ fontSize: 12, color: "#EF4444" }}>{errors.account}</Text>}
        </View>

        <AppInput label={t.commitments.dueDate} value={dueDate} onChangeText={setDueDate} placeholder="YYYY-MM-DD" error={errors.date} />

        {/* Recurrence */}
        <View style={{ gap: 6 }}>
          <Text style={{ fontSize: 13, fontWeight: "500", color: theme.textSecondary, textAlign: isRTL ? "right" : "left" }}>{t.commitments.recurrence}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: "row", gap: 8 }}>
              {RECURRENCE_TYPES.map((rt) => (
                <Pressable
                  key={rt}
                  onPress={() => setRecurrence(rt)}
                  style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: recurrence === rt ? theme.commitment : theme.card, borderWidth: 1, borderColor: recurrence === rt ? theme.commitment : theme.border }}
                >
                  <Text style={{ fontSize: 13, fontWeight: "600", color: recurrence === rt ? "#fff" : theme.text }}>
                    {t.commitments.recurrenceTypes[rt]}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </View>

        <AppInput label={`${t.common.note} (${t.common.optional})`} value={note} onChangeText={setNote} placeholder={language === "ar" ? "ملاحظة..." : "Note..."} multiline />

        <AppButton title={t.common.save} onPress={handleSave} loading={loading} fullWidth size="lg" />
      </ScrollView>

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

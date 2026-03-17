import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Platform,
  Switch,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { CategoryIcon } from "@/components/CategoryIcon";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useApp } from "@/store/AppContext";
import { useCommitments } from "@/store/CommitmentsContext";
import { useAccounts } from "@/store/AccountsContext";
import { useCategories } from "@/store/CategoriesContext";
import { formatCurrency } from "@/utils/currency";
import { formatDateShort } from "@/utils/date";
import { getDisplayName } from "@/utils/display";
import PayNowModal from "@/components/PayNowModal";

const REMINDER_KEYS_STORAGE = "commitment_reminder_flags";

export default function CommitmentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { theme, language, isRTL, t, isDark, settings } = useApp();
  const { commitments, deleteCommitment } = useCommitments();
  const { getAccount } = useAccounts();
  const { getCategory } = useCategories();
  const [paying, setPaying] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [reminderEnabled, setReminderEnabled] = useState(false);

  useEffect(() => {
    if (!id) return;
    AsyncStorage.getItem(REMINDER_KEYS_STORAGE).then((raw) => {
      if (!raw) return;
      try {
        const flags = JSON.parse(raw) as Record<string, boolean>;
        setReminderEnabled(flags[id] ?? false);
      } catch { /* ignore */ }
    }).catch(() => {});
  }, [id]);

  const handleReminderToggle = useCallback(async (value: boolean) => {
    Haptics.selectionAsync();
    setReminderEnabled(value);
    const raw = await AsyncStorage.getItem(REMINDER_KEYS_STORAGE).catch(() => null);
    const flags: Record<string, boolean> = raw ? JSON.parse(raw) : {};
    flags[id] = value;
    await AsyncStorage.setItem(REMINDER_KEYS_STORAGE, JSON.stringify(flags)).catch(() => {});
    const { scheduleCommitmentReminder, cancelCommitmentReminder, requestPermission } = await import("@/utils/notifications");
    const commitment = commitments.find((c) => c.id === id);
    if (value && settings.notification_enabled && commitment) {
      await requestPermission();
      const displayName = getDisplayName(commitment, language);
      await scheduleCommitmentReminder(id, displayName, commitment.due_date);
    } else {
      await cancelCommitmentReminder(id);
    }
  }, [id, commitments, language, settings.notification_enabled]);

  const commitment = commitments.find((c) => c.id === id);

  if (!commitment) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.background, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: theme.textMuted }}>{t.commitments.notFound}</Text>
      </View>
    );
  }

  const account = getAccount(commitment.account_id);
  const category = getCategory(commitment.category_id);
  const currency = account?.currency || "QAR";

  const isOverdue = commitment.status === "overdue";
  const isDueToday = commitment.status === "due_today";
  const isPaid = commitment.status === "paid";

  const accentColor = isOverdue
    ? "#EF4444"
    : isDueToday
    ? "#F59E0B"
    : isPaid
    ? theme.income
    : theme.commitment;

  const statusConfig = {
    upcoming: { icon: "clock" as const, bg: theme.primaryLight, color: theme.primary },
    due_today: { icon: "alert-circle" as const, bg: "#FEF3C7", color: "#D97706" },
    overdue: { icon: "alert-triangle" as const, bg: "#FEE2E2", color: "#DC2626" },
    paid: { icon: "check-circle" as const, bg: theme.incomeBackground, color: theme.income },
  };
  const sc = statusConfig[commitment.status] || statusConfig.upcoming;

  const cardShadow = Platform.OS === "web"
    ? { boxShadow: isDark ? "none" : "0 2px 12px rgba(47,143,131,0.08)" }
    : isDark ? {} : {
        shadowColor: "#2F8F83",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
      };

  const topPadding = Platform.OS === "web" ? insets.top + 67 : insets.top + 16;

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Header ─── */}
        <View
          style={{
            paddingTop: topPadding,
            paddingHorizontal: 20,
            paddingBottom: 16,
            flexDirection: isRTL ? "row-reverse" : "row",
            alignItems: "center",
            gap: 12,
          }}
        >
          <Pressable
            onPress={() => router.back()}
            hitSlop={8}
            style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border, alignItems: "center", justifyContent: "center" }}
          >
            <Feather name={isRTL ? "chevron-right" : "chevron-left"} size={18} color={theme.text} />
          </Pressable>
          <Text style={{ flex: 1, fontSize: 20, fontWeight: "800", color: theme.text, textAlign: isRTL ? "right" : "left" }} numberOfLines={1}>
            {getDisplayName(commitment, language)}
          </Text>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push(`/(modals)/commitment-form?id=${commitment.id}`);
            }}
            style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border, alignItems: "center", justifyContent: "center" }}
          >
            <Feather name="edit-2" size={16} color={theme.textSecondary} />
          </Pressable>
        </View>

        <View style={{ paddingHorizontal: 20, gap: 16 }}>

          {/* ─── Main Card ─── */}
          <View
            style={{
              backgroundColor: theme.card,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: isOverdue ? "#EF444430" : isDueToday ? "#F59E0B30" : theme.border,
              overflow: "hidden",
              ...cardShadow,
            }}
          >
            {/* Top colored strip */}
            <View style={{ height: 4, backgroundColor: accentColor }} />

            <View style={{ padding: 20, gap: 16 }}>
              {/* Icon + Status + Amount */}
              <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 14 }}>
                <View style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: accentColor + "18", alignItems: "center", justifyContent: "center" }}>
                  {category ? (
                    <CategoryIcon name={category.icon || "tag"} size={26} color={accentColor} />
                  ) : (
                    <Feather name="calendar" size={26} color={accentColor} />
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 28, fontWeight: "800", color: accentColor, textAlign: isRTL ? "right" : "left" }}>
                    {formatCurrency(commitment.amount, currency, language)}
                  </Text>
                  <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 6, marginTop: 4 }}>
                    <View style={{ backgroundColor: sc.bg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, flexDirection: "row", alignItems: "center", gap: 5 }}>
                      <Feather name={sc.icon} size={12} color={sc.color} />
                      <Text style={{ fontSize: 12, fontWeight: "700", color: sc.color }}>
                        {t.commitments.status[commitment.status]}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Divider */}
              <View style={{ height: 1, backgroundColor: theme.border }} />

              {/* Details Grid */}
              <View style={{ gap: 12 }}>
                {/* Due Date */}
                <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", justifyContent: "space-between" }}>
                  <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 8 }}>
                    <View style={{ width: 32, height: 32, borderRadius: 9, backgroundColor: accentColor + "15", alignItems: "center", justifyContent: "center" }}>
                      <Feather name="calendar" size={14} color={accentColor} />
                    </View>
                    <Text style={{ fontSize: 13, color: theme.textMuted }}>{t.commitments.dueDate}</Text>
                  </View>
                  <Text style={{ fontSize: 14, fontWeight: "600", color: isOverdue ? theme.expense : theme.text }}>
                    {formatDateShort(commitment.due_date, language)}
                  </Text>
                </View>

                {/* Account */}
                {account && (
                  <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", justifyContent: "space-between" }}>
                    <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 8 }}>
                      <View style={{ width: 32, height: 32, borderRadius: 9, backgroundColor: account.color + "20", alignItems: "center", justifyContent: "center" }}>
                        <MaterialCommunityIcons name={(account.icon || "credit-card") as any} size={14} color={account.color} />
                      </View>
                      <Text style={{ fontSize: 13, color: theme.textMuted }}>{t.transactions.account}</Text>
                    </View>
                    <Text style={{ fontSize: 14, fontWeight: "600", color: theme.text }}>
                      {getDisplayName(account, language)}
                    </Text>
                  </View>
                )}

                {/* Category */}
                {category && (
                  <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", justifyContent: "space-between" }}>
                    <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 8 }}>
                      <View style={{ width: 32, height: 32, borderRadius: 9, backgroundColor: category.color + "20", alignItems: "center", justifyContent: "center" }}>
                        <CategoryIcon name={category.icon || "tag"} size={14} color={category.color} />
                      </View>
                      <Text style={{ fontSize: 13, color: theme.textMuted }}>{t.transactions.category}</Text>
                    </View>
                    <Text style={{ fontSize: 14, fontWeight: "600", color: theme.text }}>
                      {getDisplayName(category, language)}
                    </Text>
                  </View>
                )}

                {/* Note */}
                {!!commitment.note && (
                  <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                    <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 8 }}>
                      <View style={{ width: 32, height: 32, borderRadius: 9, backgroundColor: theme.border, alignItems: "center", justifyContent: "center" }}>
                        <Feather name="message-square" size={14} color={theme.textMuted} />
                      </View>
                      <Text style={{ fontSize: 13, color: theme.textMuted }}>{t.common.note}</Text>
                    </View>
                    <Text style={{ fontSize: 14, color: theme.text, flex: 1, textAlign: isRTL ? "left" : "right" }} numberOfLines={3}>
                      {commitment.note}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* ─── Reminder Toggle (native only) ─── */}
          {Platform.OS !== "web" && (
            <View
              style={{
                backgroundColor: theme.card,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: theme.border,
                padding: 14,
                flexDirection: isRTL ? "row-reverse" : "row",
                alignItems: "center",
                justifyContent: "space-between",
                ...cardShadow,
              }}
            >
              <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 12, flex: 1 }}>
                <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: "#F59E0B18", alignItems: "center", justifyContent: "center" }}>
                  <Feather name="bell" size={17} color="#F59E0B" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: "600", color: theme.text, textAlign: isRTL ? "right" : "left" }}>
                    {t.commitments.reminderToggle}
                  </Text>
                  <Text style={{ fontSize: 12, color: theme.textMuted, textAlign: isRTL ? "right" : "left" }}>
                    {t.commitments.reminderDesc}
                  </Text>
                </View>
              </View>
              <Switch
                value={reminderEnabled}
                onValueChange={handleReminderToggle}
                trackColor={{ true: theme.primary, false: theme.border }}
              />
            </View>
          )}

          {/* ─── Action Buttons ─── */}
          <View style={{ flexDirection: isRTL ? "row-reverse" : "row", gap: 10 }}>
            {!isPaid && (
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  setPaying(true);
                }}
                style={{ flex: 1, backgroundColor: accentColor, borderRadius: 14, paddingVertical: 15, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 8 }}
              >
                <Feather name="check" size={18} color="#fff" />
                <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>
                  {t.commitments.payNow}
                </Text>
              </Pressable>
            )}
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setConfirmDelete(true);
              }}
              style={{
                width: isPaid ? undefined : 48,
                flex: isPaid ? 1 : undefined,
                height: 48,
                borderRadius: 14,
                backgroundColor: theme.expenseBackground,
                borderWidth: 1,
                borderColor: "#EF444430",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "row",
                gap: 8,
              }}
            >
              <Feather name="trash-2" size={18} color={theme.expense} />
              {isPaid && (
                <Text style={{ color: theme.expense, fontSize: 15, fontWeight: "600" }}>
                  {t.commitments.delete}
                </Text>
              )}
            </Pressable>
          </View>

          {/* ─── Confirm Delete ─── */}
          {confirmDelete && (
            <View style={{ backgroundColor: theme.expenseBackground, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "#EF444430", gap: 12 }}>
              <Text style={{ color: theme.expense, fontWeight: "700", fontSize: 15, textAlign: isRTL ? "right" : "left" }}>
                {t.commitments.deleteConfirm}
              </Text>
              <View style={{ flexDirection: isRTL ? "row-reverse" : "row", gap: 10 }}>
                <Pressable
                  onPress={() => {
                    deleteCommitment(commitment.id);
                    import("@/utils/notifications").then(({ cancelCommitmentReminder }) => {
                      cancelCommitmentReminder(commitment.id).catch(() => {});
                    });
                    router.back();
                  }}
                  style={{ flex: 1, backgroundColor: theme.expense, borderRadius: 10, paddingVertical: 11, alignItems: "center" }}
                >
                  <Text style={{ color: "#fff", fontWeight: "700" }}>{t.common.delete}</Text>
                </Pressable>
                <Pressable
                  onPress={() => setConfirmDelete(false)}
                  style={{ flex: 1, backgroundColor: theme.card, borderRadius: 10, paddingVertical: 11, alignItems: "center", borderWidth: 1, borderColor: theme.border }}
                >
                  <Text style={{ color: theme.textSecondary, fontWeight: "600" }}>{t.common.cancel}</Text>
                </Pressable>
              </View>
            </View>
          )}

        </View>
      </ScrollView>

      {paying && (
        <PayNowModal commitmentId={commitment.id} onClose={() => setPaying(false)} />
      )}
    </View>
  );
}

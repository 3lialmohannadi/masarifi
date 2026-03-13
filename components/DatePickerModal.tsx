import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  Modal,
  StyleSheet,
  Platform,
  ScrollView,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp } from "@/store/AppContext";
import { dateToISO } from "@/utils/date";
import * as Haptics from "expo-haptics";

interface DatePickerModalProps {
  visible: boolean;
  value: string;
  onConfirm: (date: string) => void;
  onClose: () => void;
  minDate?: string;
  maxDate?: string;
}

const DAYS_AR = ["أحد", "اثن", "ثلا", "أرب", "خمي", "جمع", "سبت"];

const MONTHS_AR = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];
const MONTHS_EN = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

type PickerMode = "calendar" | "year" | "month";

function parseDate(str: string): Date | null {
  if (!str || !/^\d{4}-\d{2}-\d{2}$/.test(str)) return null;
  const d = new Date(str + "T00:00:00");
  return isNaN(d.getTime()) ? null : d;
}

function todayISO(): string {
  return dateToISO(new Date());
}

export function DatePickerModal({
  visible,
  value,
  onConfirm,
  onClose,
  minDate,
  maxDate,
}: DatePickerModalProps) {
  const { theme, language, isRTL, t } = useApp();
  const insets = useSafeAreaInsets();

  const initialDate = parseDate(value) || new Date();
  const [viewYear, setViewYear] = useState(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialDate.getMonth());
  const [selected, setSelected] = useState(value || todayISO());
  const [mode, setMode] = useState<PickerMode>("calendar");

  useEffect(() => {
    if (visible) {
      const d = parseDate(value) || new Date();
      setViewYear(d.getFullYear());
      setViewMonth(d.getMonth());
      setSelected(value || todayISO());
      setMode("calendar");
    }
  }, [visible, value]);

  const todayStr = todayISO();
  const minD = parseDate(minDate || "");
  const maxD = parseDate(maxDate || "");

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();

  const MONTHS = language === "ar" ? MONTHS_AR : MONTHS_EN;
  const monthName = MONTHS[viewMonth];

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const rows: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));

  const currentYear = new Date().getFullYear();
  const yearList = Array.from({ length: 30 }, (_, i) => currentYear - 10 + i);

  const prevMonth = () => {
    Haptics.selectionAsync();
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };

  const nextMonth = () => {
    Haptics.selectionAsync();
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const selectDay = (day: number) => {
    const iso = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const d = new Date(iso + "T00:00:00");
    if (minD && d < minD) return;
    if (maxD && d > maxD) return;
    Haptics.selectionAsync();
    setSelected(iso);
  };

  const selectYear = (year: number) => {
    Haptics.selectionAsync();
    setViewYear(year);
    setMode("month");
  };

  const selectMonth = (month: number) => {
    Haptics.selectionAsync();
    setViewMonth(month);
    setMode("calendar");
  };

  const confirm = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onConfirm(selected);
    onClose();
  };

  const goToday = () => {
    const today = new Date();
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    setSelected(todayISO());
    setMode("calendar");
    Haptics.selectionAsync();
  };

  const isDisabled = (day: number) => {
    const iso = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const d = new Date(iso + "T00:00:00");
    if (minD && d < minD) return true;
    if (maxD && d > maxD) return true;
    return false;
  };

  const selectedFormatted = (() => {
    const d = parseDate(selected);
    if (!d) return selected;
    const day = d.getDate();
    const mon = MONTHS[d.getMonth()];
    const yr = d.getFullYear();
    return language === "ar" ? `${day} ${mon} ${yr}` : `${mon} ${day}, ${yr}`;
  })();

  const renderYearPicker = () => (
    <View style={{ gap: 12 }}>
      <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", justifyContent: "space-between" }}>
        <Text style={{ fontSize: 16, fontWeight: "700", color: theme.text }}>
          {language === "ar" ? "اختر السنة" : "Select Year"}
        </Text>
        <Pressable onPress={() => setMode("calendar")} hitSlop={8}>
          <Feather name="x" size={20} color={theme.textMuted} />
        </Pressable>
      </View>
      <ScrollView style={{ maxHeight: 280 }} showsVerticalScrollIndicator={false}>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {yearList.map((yr) => {
            const isSelected = yr === viewYear;
            const isCurrent = yr === currentYear;
            return (
              <Pressable
                key={yr}
                onPress={() => selectYear(yr)}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: 12,
                  backgroundColor: isSelected ? theme.primary : isCurrent ? theme.primaryLight : theme.cardSecondary,
                  borderWidth: 1,
                  borderColor: isSelected ? theme.primary : isCurrent ? theme.primary + "50" : "transparent",
                  minWidth: 70,
                  alignItems: "center",
                }}
              >
                <Text style={{ fontSize: 15, fontWeight: isSelected ? "700" : "500", color: isSelected ? "#fff" : isCurrent ? theme.primary : theme.text }}>
                  {yr}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );

  const renderMonthPicker = () => (
    <View style={{ gap: 12 }}>
      <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", justifyContent: "space-between" }}>
        <Text style={{ fontSize: 16, fontWeight: "700", color: theme.text }}>
          {viewYear} — {language === "ar" ? "اختر الشهر" : "Select Month"}
        </Text>
        <Pressable onPress={() => setMode("calendar")} hitSlop={8}>
          <Feather name="x" size={20} color={theme.textMuted} />
        </Pressable>
      </View>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {MONTHS.map((name, idx) => {
          const isSelected = idx === viewMonth;
          return (
            <Pressable
              key={idx}
              onPress={() => selectMonth(idx)}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 10,
                borderRadius: 12,
                backgroundColor: isSelected ? theme.primary : theme.cardSecondary,
                borderWidth: 1,
                borderColor: isSelected ? theme.primary : "transparent",
                width: "30%",
                alignItems: "center",
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: isSelected ? "700" : "500", color: isSelected ? "#fff" : theme.text }}>
                {name}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );

  const renderCalendar = () => (
    <>
      <View style={[styles.navRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
        <Pressable
          onPress={isRTL ? nextMonth : prevMonth}
          hitSlop={12}
          style={[styles.navBtn, { backgroundColor: theme.cardSecondary }]}
        >
          <Feather name={isRTL ? "chevron-right" : "chevron-left"} size={18} color={theme.text} />
        </Pressable>

        <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 6 }}>
          <Pressable
            onPress={() => setMode("month")}
            style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: theme.cardSecondary }}
          >
            <Text style={[styles.monthTitle, { color: theme.text }]}>{monthName}</Text>
          </Pressable>
          <Pressable
            onPress={() => setMode("year")}
            style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: theme.cardSecondary }}
          >
            <Text style={[styles.monthTitle, { color: theme.primary }]}>{viewYear}</Text>
          </Pressable>
        </View>

        <Pressable
          onPress={isRTL ? prevMonth : nextMonth}
          hitSlop={12}
          style={[styles.navBtn, { backgroundColor: theme.cardSecondary }]}
        >
          <Feather name={isRTL ? "chevron-left" : "chevron-right"} size={18} color={theme.text} />
        </Pressable>
      </View>

      <View style={[styles.dayLabels, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
        {(isRTL ? [...DAYS_AR].reverse() : DAYS_AR).map((d, i) => (
          <View key={i} style={styles.dayCell}>
            <Text style={[styles.dayLabel, { color: theme.textMuted }]}>{d}</Text>
          </View>
        ))}
      </View>

      <View style={styles.grid}>
        {rows.map((row, ri) => (
          <View key={ri} style={[styles.row, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
            {row.map((day, ci) => {
              if (!day) return <View key={ci} style={styles.dayCell} />;
              const iso = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const isSel = iso === selected;
              const isToday = iso === todayStr;
              const disabled = isDisabled(day);
              return (
                <Pressable
                  key={ci}
                  onPress={() => !disabled && selectDay(day)}
                  style={[
                    styles.dayCell,
                    styles.dayBtn,
                    isSel && { backgroundColor: theme.primary },
                    !isSel && isToday && { backgroundColor: theme.primaryLight },
                    disabled && { opacity: 0.3 },
                  ]}
                >
                  <Text style={[styles.dayNum, { color: isSel ? "#fff" : isToday ? theme.primary : theme.text }, isSel && { fontWeight: "700" }]}>
                    {day}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>

      <View style={[styles.selectedRow, { backgroundColor: theme.primaryLight, borderColor: theme.primary + "30" }]}>
        <Feather name="calendar" size={14} color={theme.primary} />
        <Text style={[styles.selectedText, { color: theme.primary }]}>{selectedFormatted}</Text>
      </View>

      <View style={[styles.btnRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
        <Pressable
          onPress={goToday}
          style={[styles.todayBtn, { backgroundColor: theme.cardSecondary, borderColor: theme.border }]}
        >
          <Text style={{ fontSize: 14, fontWeight: "600", color: theme.textSecondary }}>
            {t.transactions.today}
          </Text>
        </Pressable>
        <Pressable onPress={confirm} style={[styles.confirmBtn, { backgroundColor: theme.primary, flex: 1 }]}>
          <Text style={styles.confirmText}>{t.common.confirm}</Text>
        </Pressable>
      </View>
    </>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose} />
      <View style={[styles.sheet, { backgroundColor: theme.card, paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 12 }]}>
        <View style={[styles.handle, { backgroundColor: theme.border }]} />
        {mode === "year"     && renderYearPicker()}
        {mode === "month"    && renderMonthPicker()}
        {mode === "calendar" && renderCalendar()}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)" },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 12, paddingHorizontal: 16, gap: 10 },
  handle: { width: 38, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 4 },
  navRow: { alignItems: "center", justifyContent: "space-between", paddingHorizontal: 4, marginBottom: 4 },
  navBtn: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  monthTitle: { fontSize: 16, fontWeight: "700" },
  dayLabels: { marginBottom: 2 },
  dayLabel: { fontSize: 11, fontWeight: "600", textAlign: "center" },
  grid: { gap: 2 },
  row: { gap: 2 },
  dayCell: { flex: 1, aspectRatio: 1, alignItems: "center", justifyContent: "center", maxHeight: 42 },
  dayBtn: { borderRadius: 10 },
  dayNum: { fontSize: 14, fontWeight: "500" },
  selectedRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderWidth: 1, marginTop: 2 },
  selectedText: { fontSize: 14, fontWeight: "600" },
  btnRow: { gap: 10, marginTop: 2 },
  todayBtn: { paddingHorizontal: 18, paddingVertical: 13, borderRadius: 14, alignItems: "center", borderWidth: 1 },
  confirmBtn: { paddingVertical: 13, borderRadius: 14, alignItems: "center" },
  confirmText: { color: "#fff", fontSize: 15, fontWeight: "700" },
});

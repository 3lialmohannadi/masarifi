import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  Modal,
  StyleSheet,
  Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp } from "@/store/AppContext";
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
const DAYS_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const MONTHS_AR = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];
const MONTHS_EN = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function parseDate(str: string): Date | null {
  if (!str || !/^\d{4}-\d{2}-\d{2}$/.test(str)) return null;
  const d = new Date(str + "T00:00:00");
  return isNaN(d.getTime()) ? null : d;
}

function toISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function todayISO(): string {
  return toISO(new Date());
}

export function DatePickerModal({
  visible,
  value,
  onConfirm,
  onClose,
  minDate,
  maxDate,
}: DatePickerModalProps) {
  const { theme, language, isRTL } = useApp();
  const insets = useSafeAreaInsets();

  const initialDate = parseDate(value) || new Date();
  const [viewYear, setViewYear] = useState(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialDate.getMonth());
  const [selected, setSelected] = useState(value || todayISO());

  useEffect(() => {
    if (visible) {
      const d = parseDate(value) || new Date();
      setViewYear(d.getFullYear());
      setViewMonth(d.getMonth());
      setSelected(value || todayISO());
    }
  }, [visible, value]);

  const todayStr = todayISO();
  const minD = parseDate(minDate || "");
  const maxD = parseDate(maxDate || "");

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();

  const days = DAYS_AR;
  const monthName = language === "ar" ? MONTHS_AR[viewMonth] : MONTHS_EN[viewMonth];

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const rows: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));

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
    const mon = language === "ar" ? MONTHS_AR[d.getMonth()] : MONTHS_EN[d.getMonth()];
    const yr = d.getFullYear();
    return language === "ar" ? `${day} ${mon} ${yr}` : `${mon} ${day}, ${yr}`;
  })();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose} />
      <View
        style={[
          styles.sheet,
          {
            backgroundColor: theme.card,
            paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 12,
          },
        ]}
      >
        {/* Handle */}
        <View style={[styles.handle, { backgroundColor: theme.border }]} />

        {/* Month nav */}
        <View
          style={[
            styles.navRow,
            { flexDirection: isRTL ? "row-reverse" : "row" },
          ]}
        >
          <Pressable
            onPress={isRTL ? nextMonth : prevMonth}
            hitSlop={12}
            style={[styles.navBtn, { backgroundColor: theme.cardSecondary }]}
          >
            <Feather
              name={isRTL ? "chevron-right" : "chevron-left"}
              size={18}
              color={theme.text}
            />
          </Pressable>
          <Pressable onPress={goToday}>
            <Text style={[styles.monthTitle, { color: theme.text }]}>
              {monthName} {viewYear}
            </Text>
          </Pressable>
          <Pressable
            onPress={isRTL ? prevMonth : nextMonth}
            hitSlop={12}
            style={[styles.navBtn, { backgroundColor: theme.cardSecondary }]}
          >
            <Feather
              name={isRTL ? "chevron-left" : "chevron-right"}
              size={18}
              color={theme.text}
            />
          </Pressable>
        </View>

        {/* Day labels */}
        <View
          style={[
            styles.dayLabels,
            { flexDirection: isRTL ? "row-reverse" : "row" },
          ]}
        >
          {(isRTL ? [...days].reverse() : days).map((d, i) => (
            <View key={i} style={styles.dayCell}>
              <Text style={[styles.dayLabel, { color: theme.textMuted }]}>{d}</Text>
            </View>
          ))}
        </View>

        {/* Calendar grid */}
        <View style={styles.grid}>
          {rows.map((row, ri) => (
            <View
              key={ri}
              style={[
                styles.row,
                { flexDirection: isRTL ? "row-reverse" : "row" },
              ]}
            >
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
                    <Text
                      style={[
                        styles.dayNum,
                        { color: isSel ? "#fff" : isToday ? theme.primary : theme.text },
                        isSel && { fontWeight: "700" },
                      ]}
                    >
                      {day}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ))}
        </View>

        {/* Selected date display */}
        <View
          style={[
            styles.selectedRow,
            { backgroundColor: theme.primaryLight, borderColor: theme.primary + "30" },
          ]}
        >
          <Feather name="calendar" size={14} color={theme.primary} />
          <Text style={[styles.selectedText, { color: theme.primary }]}>
            {selectedFormatted}
          </Text>
        </View>

        {/* Buttons */}
        <View style={[styles.btnRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
          <Pressable
            onPress={goToday}
            style={[styles.todayBtn, { backgroundColor: theme.cardSecondary, borderColor: theme.border }]}
          >
            <Text style={{ fontSize: 14, fontWeight: "600", color: theme.textSecondary }}>
              {language === "ar" ? "اليوم" : "Today"}
            </Text>
          </Pressable>
          <Pressable
            onPress={confirm}
            style={[styles.confirmBtn, { backgroundColor: theme.primary, flex: 1 }]}
          >
            <Text style={styles.confirmText}>
              {language === "ar" ? "تأكيد" : "Confirm"}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingHorizontal: 16,
    gap: 10,
  },
  handle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 4,
  },
  navRow: {
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 4,
    marginBottom: 4,
  },
  navBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  monthTitle: {
    fontSize: 17,
    fontWeight: "700",
  },
  dayLabels: {
    marginBottom: 2,
  },
  dayLabel: {
    fontSize: 11,
    fontWeight: "600",
    textAlign: "center",
  },
  grid: {
    gap: 2,
  },
  row: {
    gap: 2,
  },
  dayCell: {
    flex: 1,
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    maxHeight: 42,
  },
  dayBtn: {
    borderRadius: 10,
  },
  dayNum: {
    fontSize: 14,
    fontWeight: "500",
  },
  selectedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 2,
  },
  selectedText: {
    fontSize: 14,
    fontWeight: "600",
  },
  btnRow: {
    gap: 10,
    marginTop: 2,
  },
  todayBtn: {
    paddingHorizontal: 18,
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: "center",
    borderWidth: 1,
  },
  confirmBtn: {
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: "center",
  },
  confirmText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
});

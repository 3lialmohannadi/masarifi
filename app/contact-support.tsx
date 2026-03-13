import React, { useState } from "react";
import type { Theme } from "@/theme/colors";
import {
  View,
  Text,
  Pressable,
  TextInput,
  ScrollView,
  Platform,
  Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { useApp } from "@/store/AppContext";
import { apiRequest } from "@/services/api";

type RequestType = "suggestion" | "technical_issue" | "other";

export default function ContactSupportScreen() {
  const insets = useSafeAreaInsets();
  const { theme, t, isRTL, showToast } = useApp();

  const [requestType, setRequestType] = useState<RequestType | "">("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showTypePicker, setShowTypePicker] = useState(false);

  const typeOptions: { key: RequestType; label: string }[] = [
    { key: "suggestion", label: t.contact.suggestion },
    { key: "technical_issue", label: t.contact.technicalIssue },
    { key: "other", label: t.contact.other },
  ];

  const getTypeLabel = (key: RequestType | "") =>
    typeOptions.find((o) => o.key === key)?.label || t.contact.selectType;

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!requestType) errs.type = t.contact.typeRequired;
    if (!subject.trim()) errs.subject = t.contact.subjectRequired;
    if (!message.trim()) errs.message = t.contact.messageRequired;
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSend = async () => {
    if (!validate()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const res = await apiRequest("POST", "/api/contact", {
        type: requestType,
        subject: subject.trim(),
        message: message.trim(),
        email: email.trim() || null,
      });
      if (res.ok) {
        setSent(true);
      } else {
        showToast(t.toast.error, "error");
      }
    } catch {
      showToast(t.toast.error, "error");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = (hasError: boolean) => ({
    backgroundColor: theme.input,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: hasError ? "#EF4444" : theme.inputBorder,
    padding: 13,
    color: theme.text,
    fontSize: 15,
    textAlign: (isRTL ? "right" : "left") as "left" | "right",
    ...(Platform.OS === "web" ? ({ outlineStyle: "none" } as object) : {}),
  });

  if (sent) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.background, justifyContent: "center", alignItems: "center", padding: 32 }}>
        <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: theme.primary + "20", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
          <Feather name="check-circle" size={40} color={theme.primary} />
        </View>
        <Text style={{ fontSize: 20, fontWeight: "800", color: theme.text, textAlign: "center", marginBottom: 12 }}>
          {t.contact.success.split(".")[0]}
        </Text>
        <Text style={{ fontSize: 14, color: theme.textSecondary, textAlign: "center", lineHeight: 22, marginBottom: 32 }}>
          {t.contact.success.split(".").slice(1).join(".").trim()}
        </Text>
        <Pressable
          onPress={() => router.back()}
          style={{ backgroundColor: theme.primary, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 14 }}
        >
          <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>{t.common.done}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <View
        style={{
          flexDirection: isRTL ? "row-reverse" : "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingTop: Platform.OS === "web" ? insets.top + 67 : insets.top + 16,
          paddingHorizontal: 16,
          paddingBottom: 14,
          backgroundColor: theme.card,
          borderBottomWidth: 1,
          borderBottomColor: theme.border,
        }}
      >
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Feather name="x" size={24} color={theme.textSecondary} />
        </Pressable>
        <Text style={{ fontSize: 17, fontWeight: "700", color: theme.text }}>{t.contact.title}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: insets.bottom + 32 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={{ backgroundColor: theme.primary + "12", borderRadius: 14, padding: 14, flexDirection: isRTL ? "row-reverse" : "row", gap: 10, alignItems: "center" }}>
          <Feather name="mail" size={18} color={theme.primary} />
          <Text style={{ color: theme.primary, fontSize: 13, fontWeight: "600", flex: 1, textAlign: isRTL ? "right" : "left" }}>
            admin@masarifiapp.com
          </Text>
        </View>

        <Field label={t.contact.requestType} error={errors.type} required isRTL={isRTL} theme={theme}>
          <Pressable
            onPress={() => setShowTypePicker(true)}
            style={{
              backgroundColor: theme.input,
              borderRadius: 12,
              borderWidth: 1.5,
              borderColor: errors.type ? "#EF4444" : theme.inputBorder,
              padding: 13,
              flexDirection: isRTL ? "row-reverse" : "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Text style={{ color: requestType ? theme.text : theme.textMuted, fontSize: 15 }}>
              {getTypeLabel(requestType)}
            </Text>
            <Feather name="chevron-down" size={16} color={theme.textMuted} />
          </Pressable>
        </Field>

        <Field label={t.contact.subject} error={errors.subject} required isRTL={isRTL} theme={theme}>
          <TextInput
            value={subject}
            onChangeText={(v) => { setSubject(v); if (errors.subject) setErrors((e) => ({ ...e, subject: "" })); }}
            placeholder={t.contact.subjectPlaceholder}
            placeholderTextColor={theme.textMuted}
            style={inputStyle(!!errors.subject)}
          />
        </Field>

        <Field label={t.contact.message} error={errors.message} required isRTL={isRTL} theme={theme}>
          <TextInput
            value={message}
            onChangeText={(v) => { setMessage(v); if (errors.message) setErrors((e) => ({ ...e, message: "" })); }}
            placeholder={t.contact.messagePlaceholder}
            placeholderTextColor={theme.textMuted}
            multiline
            numberOfLines={6}
            style={[inputStyle(!!errors.message), { minHeight: 130, textAlignVertical: "top" }]}
          />
        </Field>

        <Field label={`${t.contact.email} (${t.common.optional})`} isRTL={isRTL} theme={theme}>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder={t.contact.emailPlaceholder}
            placeholderTextColor={theme.textMuted}
            keyboardType="email-address"
            autoCapitalize="none"
            style={inputStyle(false)}
          />
        </Field>

        <Pressable
          onPress={handleSend}
          disabled={loading}
          style={({ pressed }) => ({
            backgroundColor: loading ? theme.primary + "80" : pressed ? theme.primaryDark : theme.primary,
            borderRadius: 14,
            padding: 16,
            alignItems: "center",
            marginTop: 8,
          })}
        >
          {loading ? (
            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>{t.common.loading}</Text>
          ) : (
            <View style={{ flexDirection: isRTL ? "row-reverse" : "row", gap: 8, alignItems: "center" }}>
              <Feather name="send" size={18} color="#fff" />
              <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>{t.contact.send}</Text>
            </View>
          )}
        </Pressable>
      </ScrollView>

      <Modal visible={showTypePicker} transparent animationType="slide" statusBarTranslucent>
        <Pressable
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}
          onPress={() => setShowTypePicker(false)}
        >
          <Pressable
            style={{ backgroundColor: theme.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 12, paddingBottom: insets.bottom + 16 }}
            onPress={() => {}}
          >
            <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: theme.border, alignSelf: "center", marginBottom: 16 }} />
            {typeOptions.map((opt) => (
              <Pressable
                key={opt.key}
                onPress={() => {
                  setRequestType(opt.key);
                  setShowTypePicker(false);
                  if (errors.type) setErrors((e) => ({ ...e, type: "" }));
                  Haptics.selectionAsync();
                }}
                style={({ pressed }) => ({
                  padding: 16,
                  paddingHorizontal: 20,
                  backgroundColor: requestType === opt.key ? theme.primary + "15" : pressed ? theme.cardSecondary : "transparent",
                  flexDirection: isRTL ? "row-reverse" : "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                })}
              >
                <Text style={{ fontSize: 16, color: requestType === opt.key ? theme.primary : theme.text, fontWeight: requestType === opt.key ? "700" : "400" }}>
                  {opt.label}
                </Text>
                {requestType === opt.key && <Feather name="check" size={18} color={theme.primary} />}
              </Pressable>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function Field({
  label,
  children,
  error,
  required,
  isRTL,
  theme,
}: {
  label: string;
  children: React.ReactNode;
  error?: string;
  required?: boolean;
  isRTL: boolean;
  theme: Theme;
}) {
  return (
    <View style={{ gap: 6 }}>
      <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 4 }}>
        <Text style={{ fontSize: 13, fontWeight: "600", color: theme.textSecondary }}>{label}</Text>
        {required && <Text style={{ fontSize: 12, color: "#EF4444" }}>*</Text>}
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

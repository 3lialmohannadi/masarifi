import { Link, Stack } from "expo-router";
import { View, Text, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useApp } from "@/store/AppContext";

export default function NotFoundScreen() {
  const { theme, language, isRTL } = useApp();
  const insets = useSafeAreaInsets();

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={{
        flex: 1,
        backgroundColor: theme.background,
        alignItems: "center",
        justifyContent: "center",
        padding: 32,
        paddingTop: insets.top + 32,
        paddingBottom: insets.bottom + 32,
      }}>
        <View style={{
          width: 80,
          height: 80,
          borderRadius: 40,
          backgroundColor: theme.card,
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 24,
        }}>
          <Feather name="alert-triangle" size={36} color={theme.textMuted} />
        </View>

        <Text style={{
          fontSize: 22,
          fontWeight: "800",
          color: theme.text,
          textAlign: "center",
          marginBottom: 10,
        }}>
          {language === "ar" ? "الصفحة غير موجودة" : "Page Not Found"}
        </Text>

        <Text style={{
          fontSize: 15,
          color: theme.textSecondary,
          textAlign: "center",
          marginBottom: 32,
          lineHeight: 22,
        }}>
          {language === "ar"
            ? "عذراً، الصفحة التي تبحث عنها غير موجودة."
            : "Sorry, the page you're looking for doesn't exist."}
        </Text>

        <Link href="/" asChild>
          <Pressable
            style={({ pressed }) => ({
              backgroundColor: pressed ? theme.primaryDark : theme.primary,
              paddingHorizontal: 28,
              paddingVertical: 14,
              borderRadius: 14,
              flexDirection: isRTL ? "row-reverse" : "row",
              alignItems: "center",
              gap: 8,
            })}
          >
            <Feather name="home" size={18} color="#fff" />
            <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>
              {language === "ar" ? "الرئيسية" : "Go Home"}
            </Text>
          </Pressable>
        </Link>
      </View>
    </>
  );
}

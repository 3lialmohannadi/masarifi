import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  Pressable,
  FlatList,
  StyleSheet,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useApp } from "@/store/AppContext";
import { useAccounts } from "@/store/AccountsContext";
import { getDisplayName } from "@/utils/display";
import { formatCurrency } from "@/utils/currency";
import * as Haptics from "expo-haptics";

export function AccountSelector() {
  const { theme, language, t, selectedAccountId, setSelectedAccountId } = useApp();
  const { accounts } = useAccounts();
  const [visible, setVisible] = useState(false);

  const selectedAccount = accounts.find((a) => a.id === selectedAccountId);

  const handleSelect = (id: string) => {
    Haptics.selectionAsync();
    setSelectedAccountId(id);
    setVisible(false);
  };

  return (
    <>
      <Pressable
        onPress={() => setVisible(true)}
        style={[
          styles.selector,
          { backgroundColor: theme.card, borderColor: theme.border },
        ]}
      >
        {selectedAccount ? (
          <View
            style={[styles.dot, { backgroundColor: selectedAccount.color }]}
          />
        ) : (
          <Feather name="layers" size={16} color={theme.textSecondary} />
        )}
        <Text style={{ color: theme.text, fontSize: 15, fontWeight: "600", flex: 1 }}>
          {selectedAccount
            ? getDisplayName(selectedAccount, language)
            : t.dashboard.selectAccount}
        </Text>
        <Feather name="chevron-down" size={16} color={theme.textSecondary} />
      </Pressable>

      <Modal visible={visible} transparent animationType="fade">
        <Pressable style={styles.overlay} onPress={() => setVisible(false)}>
          <View style={[styles.modal, { backgroundColor: theme.card }]}>
            <Text style={[styles.title, { color: theme.text }]}>
              {t.dashboard.selectAccount}
            </Text>
            <FlatList
              data={accounts.filter((a) => a.is_active)}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => handleSelect(item.id)}
                  style={[
                    styles.accountItem,
                    {
                      backgroundColor:
                        item.id === selectedAccountId
                          ? theme.primaryLight
                          : "transparent",
                    },
                  ]}
                >
                  <View style={[styles.dot, { backgroundColor: item.color }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: theme.text, fontWeight: "600", fontSize: 15 }}>
                      {getDisplayName(item, language)}
                    </Text>
                    <Text style={{ color: theme.textSecondary, fontSize: 13 }}>
                      {formatCurrency(item.balance, item.currency, language)}
                    </Text>
                  </View>
                  {item.id === selectedAccountId && (
                    <Feather name="check" size={18} color={theme.primary} />
                  )}
                </Pressable>
              )}
              ListEmptyComponent={
                <Text style={{ color: theme.textMuted, textAlign: "center", padding: 20 }}>
                  {t.accounts.noAccounts}
                </Text>
              }
            />
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  selector: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 20,
  },
  modal: {
    borderRadius: 20,
    padding: 4,
    maxHeight: 400,
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
    padding: 16,
    paddingBottom: 8,
  },
  accountItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    marginHorizontal: 8,
    marginVertical: 2,
    borderRadius: 12,
  },
});

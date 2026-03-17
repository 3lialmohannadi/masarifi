import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";
import type { Transaction, Transfer, Account, Category } from "@/types";
import type { TranslationKeys } from "@/i18n/ar";

const BOM = "\uFEFF";

function escapeCsv(value: string | number | undefined | null): string {
  if (value === undefined || value === null) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function row(cells: (string | number | undefined | null)[]): string {
  return cells.map(escapeCsv).join(",");
}

export function buildTransactionsCSV(
  transactions: Transaction[],
  transfers: Transfer[],
  accounts: Account[],
  categories: Category[],
  t: TranslationKeys,
  language: "ar" | "en"
): string {
  const getAccountName = (id: string) => {
    const acc = accounts.find((a) => a.id === id);
    if (!acc) return id;
    return language === "ar" ? acc.name_ar : acc.name_en;
  };

  const getCategoryName = (id?: string) => {
    if (!id) return "";
    const cat = categories.find((c) => c.id === id);
    if (!cat) return id;
    return language === "ar" ? cat.name_ar : cat.name_en;
  };

  const txHeader = [
    "Date / التاريخ",
    "Type / النوع",
    "Category / التصنيف",
    "Account / الحساب",
    "Amount / المبلغ",
    "Currency / العملة",
    "Note / الملاحظة",
  ];

  const txTypeLabel = (type: string) => {
    if (type === "income") return language === "ar" ? "دخل / Income" : "Income / دخل";
    if (type === "expense") return language === "ar" ? "مصروف / Expense" : "Expense / مصروف";
    return type;
  };

  const txRows = transactions.map((tx) =>
    row([
      tx.date.slice(0, 10),
      txTypeLabel(tx.type),
      getCategoryName(tx.category_id),
      getAccountName(tx.account_id),
      tx.amount,
      tx.currency,
      tx.note || "",
    ])
  );

  const tfHeader = [
    "Date / التاريخ",
    "From / من",
    "To / إلى",
    "Amount / المبلغ",
    "Currency / العملة",
    "Note / الملاحظة",
  ];

  const tfRows = transfers.map((tf) =>
    row([
      tf.date.slice(0, 10),
      getAccountName(tf.source_account_id),
      getAccountName(tf.destination_account_id),
      tf.source_amount,
      accounts.find((a) => a.id === tf.source_account_id)?.currency || "",
      tf.note || "",
    ])
  );

  const lines: string[] = [
    language === "ar"
      ? "المعاملات / Transactions"
      : "Transactions / المعاملات",
    row(txHeader),
    ...txRows,
    "",
    language === "ar"
      ? "التحويلات / Transfers"
      : "Transfers / التحويلات",
    row(tfHeader),
    ...tfRows,
  ];

  return BOM + lines.join("\r\n");
}

export async function shareCSV(
  csvContent: string,
  filename: string
): Promise<void> {
  if (Platform.OS === "web") {
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return;
  }

  const fileUri = (FileSystem.cacheDirectory ?? "") + filename;
  await FileSystem.writeAsStringAsync(fileUri, csvContent, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(fileUri, {
      mimeType: "text/csv",
      dialogTitle: filename,
      UTI: "public.comma-separated-values-text",
    });
  }
}

export function buildCSVFilename(prefix = "masarifi-transactions"): string {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);
  return `${prefix}-${dateStr}.csv`;
}

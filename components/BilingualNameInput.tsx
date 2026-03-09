import React, { useState } from "react";
import { View } from "react-native";
import { AppInput } from "@/components/ui/AppInput";
import { useApp } from "@/store/AppContext";
import { autoTranslate } from "@/utils/translate";

interface BilingualNameInputProps {
  nameAr: string;
  nameEn: string;
  onChangeAr: (v: string) => void;
  onChangeEn: (v: string) => void;
  errorAr?: string;
  errorEn?: string;
}

export function BilingualNameInput({
  nameAr,
  nameEn,
  onChangeAr,
  onChangeEn,
  errorAr,
  errorEn,
}: BilingualNameInputProps) {
  const { t } = useApp();
  const [translatingToEn, setTranslatingToEn] = useState(false);
  const [translatingToAr, setTranslatingToAr] = useState(false);

  const handleFillEnglish = async () => {
    const source = nameAr.trim() || nameEn.trim();
    if (!source) return;
    setTranslatingToEn(true);
    try {
      const result = await autoTranslate(source, "en");
      if (result) onChangeEn(result);
    } finally {
      setTranslatingToEn(false);
    }
  };

  const handleFillArabic = async () => {
    const source = nameEn.trim() || nameAr.trim();
    if (!source) return;
    setTranslatingToAr(true);
    try {
      const result = await autoTranslate(source, "ar");
      if (result) onChangeAr(result);
    } finally {
      setTranslatingToAr(false);
    }
  };

  return (
    <View style={{ gap: 12 }}>
      <AppInput
        label={t.common.nameAr}
        value={nameAr}
        onChangeText={onChangeAr}
        placeholder="الاسم بالعربية"
        fieldDirection="rtl"
        error={errorAr}
        translateButton
        onTranslate={handleFillEnglish}
        isTranslating={translatingToEn}
      />
      <AppInput
        label={t.common.nameEn}
        value={nameEn}
        onChangeText={onChangeEn}
        placeholder="Name in English"
        fieldDirection="ltr"
        error={errorEn}
        translateButton
        onTranslate={handleFillArabic}
        isTranslating={translatingToAr}
      />
    </View>
  );
}

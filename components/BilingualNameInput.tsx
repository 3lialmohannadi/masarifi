import React, { useState } from "react";
import { View } from "react-native";
import { AppInput } from "@/components/ui/AppInput";
import { useApp } from "@/store/AppContext";
import { autoTranslate, detectLanguage } from "@/utils/translate";

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
  const [translatingAr, setTranslatingAr] = useState(false);
  const [translatingEn, setTranslatingEn] = useState(false);

  const handleTranslateAr = async () => {
    const source = nameAr.trim() || nameEn.trim();
    if (!source) return;
    setTranslatingEn(true);
    try {
      const result = await autoTranslate(source, "en");
      if (result) onChangeEn(result);
    } finally {
      setTranslatingEn(false);
    }
  };

  const handleTranslateEn = async () => {
    const source = nameEn.trim() || nameAr.trim();
    if (!source) return;
    setTranslatingAr(true);
    try {
      const result = await autoTranslate(source, "ar");
      if (result) onChangeAr(result);
    } finally {
      setTranslatingAr(false);
    }
  };

  return (
    <View style={{ gap: 12 }}>
      <AppInput
        label={t.common.nameAr}
        value={nameAr}
        onChangeText={onChangeAr}
        placeholder="الاسم بالعربية"
        textAlign="right"
        error={errorAr}
        translateButton
        onTranslate={handleTranslateEn}
        isTranslating={translatingAr}
      />
      <AppInput
        label={t.common.nameEn}
        value={nameEn}
        onChangeText={onChangeEn}
        placeholder="Name in English"
        textAlign="left"
        error={errorEn}
        translateButton
        onTranslate={handleTranslateAr}
        isTranslating={translatingEn}
      />
    </View>
  );
}

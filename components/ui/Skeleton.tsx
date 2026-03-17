import React, { useEffect, useRef } from "react";
import { Animated, View, ViewStyle, DimensionValue } from "react-native";
import { useApp } from "@/store/AppContext";

interface SkeletonProps {
  width?: DimensionValue;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({ width = "100%", height = 16, borderRadius = 8, style }: SkeletonProps) {
  const { isDark } = useApp();
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 800, useNativeDriver: true }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: isDark ? "#2A2A3A" : "#E5E7EB",
          opacity,
        },
        style,
      ]}
    />
  );
}

export function SkeletonCard({ children }: { children: React.ReactNode }) {
  const { theme } = useApp();
  return (
    <View style={{ backgroundColor: theme.card, borderRadius: 16, padding: 16, gap: 10, borderWidth: 1, borderColor: theme.border }}>
      {children}
    </View>
  );
}

export function TransactionSkeleton() {
  const { theme, isRTL } = useApp();
  return (
    <View style={{ backgroundColor: theme.card, borderRadius: 16, padding: 14, gap: 10, borderWidth: 1, borderColor: theme.border }}>
      {[0, 1, 2, 3].map((i) => (
        <View key={i} style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 12, paddingVertical: 4 }}>
          <Skeleton width={42} height={42} borderRadius={12} />
          <View style={{ flex: 1, gap: 6 }}>
            <Skeleton width="60%" height={13} borderRadius={6} />
            <Skeleton width="40%" height={11} borderRadius={5} />
          </View>
          <Skeleton width={70} height={13} borderRadius={6} />
        </View>
      ))}
    </View>
  );
}

export function DashboardSkeleton() {
  return (
    <View style={{ paddingHorizontal: 20, gap: 14, paddingTop: 20 }}>
      <Skeleton height={180} borderRadius={24} />
      <SkeletonCard>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <Skeleton height={50} borderRadius={14} style={{ flex: 1 }} />
          <Skeleton height={50} borderRadius={14} style={{ flex: 1 }} />
        </View>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <Skeleton height={60} borderRadius={12} style={{ flex: 1 }} />
          <Skeleton height={60} borderRadius={12} style={{ flex: 1 }} />
          <Skeleton height={60} borderRadius={12} style={{ flex: 1 }} />
        </View>
      </SkeletonCard>
      <TransactionSkeleton />
    </View>
  );
}

export function StatisticsSkeleton() {
  return (
    <View style={{ flex: 1 }}>
      <View style={{ paddingHorizontal: 20, paddingTop: 20, gap: 14 }}>
        <Skeleton height={120} borderRadius={20} />
        <View style={{ flexDirection: "row", gap: 10 }}>
          <Skeleton height={70} borderRadius={14} style={{ flex: 1 }} />
          <Skeleton height={70} borderRadius={14} style={{ flex: 1 }} />
        </View>
      </View>
      <View style={{ paddingHorizontal: 20, gap: 14, paddingTop: 20 }}>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
          <Skeleton height={70} borderRadius={14} style={{ flex: 1, minWidth: "44%" }} />
          <Skeleton height={70} borderRadius={14} style={{ flex: 1, minWidth: "44%" }} />
          <Skeleton height={70} borderRadius={14} style={{ flex: 1, minWidth: "44%" }} />
          <Skeleton height={70} borderRadius={14} style={{ flex: 1, minWidth: "44%" }} />
        </View>
        <SkeletonCard>
          <Skeleton height={180} borderRadius={12} />
        </SkeletonCard>
        <SkeletonCard>
          <Skeleton height={120} borderRadius={12} />
        </SkeletonCard>
      </View>
    </View>
  );
}

export function SavingsSkeleton() {
  return (
    <View style={{ paddingHorizontal: 20, gap: 14, paddingTop: 16 }}>
      <Skeleton height={160} borderRadius={24} />
      <Skeleton height={20} width="40%" borderRadius={8} />
      {[0, 1, 2].map((i) => (
        <SkeletonCard key={i}>
          <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
            <Skeleton width={48} height={48} borderRadius={14} />
            <View style={{ flex: 1, gap: 8 }}>
              <Skeleton width="60%" height={14} borderRadius={6} />
              <Skeleton width="40%" height={11} borderRadius={5} />
              <Skeleton height={6} borderRadius={4} />
            </View>
          </View>
        </SkeletonCard>
      ))}
    </View>
  );
}

export function AccountsSkeleton() {
  return (
    <View style={{ paddingHorizontal: 20, gap: 12, paddingTop: 16 }}>
      <Skeleton height={100} borderRadius={18} />
      {[0, 1, 2, 3].map((i) => (
        <SkeletonCard key={i}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <Skeleton width={44} height={44} borderRadius={12} />
            <View style={{ flex: 1, gap: 6 }}>
              <Skeleton width="55%" height={14} borderRadius={6} />
              <Skeleton width="35%" height={11} borderRadius={5} />
            </View>
            <View style={{ gap: 5, alignItems: "flex-end" }}>
              <Skeleton width={80} height={14} borderRadius={6} />
              <Skeleton width={30} height={10} borderRadius={4} />
            </View>
          </View>
        </SkeletonCard>
      ))}
    </View>
  );
}

export function CommitmentsSkeleton() {
  return (
    <View style={{ paddingHorizontal: 20, gap: 12, paddingTop: 16 }}>
      <View style={{ flexDirection: "row", gap: 8 }}>
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} width={80} height={32} borderRadius={20} />
        ))}
      </View>
      {[0, 1, 2, 3].map((i) => (
        <SkeletonCard key={i}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <Skeleton width={42} height={42} borderRadius={12} />
            <View style={{ flex: 1, gap: 6 }}>
              <Skeleton width="60%" height={14} borderRadius={6} />
              <Skeleton width="40%" height={11} borderRadius={5} />
            </View>
            <View style={{ gap: 5, alignItems: "flex-end" }}>
              <Skeleton width={70} height={14} borderRadius={6} />
              <Skeleton width={50} height={10} borderRadius={4} />
            </View>
          </View>
        </SkeletonCard>
      ))}
    </View>
  );
}

export function DebtsSkeleton() {
  return (
    <View style={{ paddingHorizontal: 20, gap: 12, paddingTop: 16 }}>
      <View style={{ flexDirection: "row", gap: 10 }}>
        <Skeleton height={80} borderRadius={14} style={{ flex: 1 }} />
        <Skeleton height={80} borderRadius={14} style={{ flex: 1 }} />
      </View>
      {[0, 1, 2].map((i) => (
        <SkeletonCard key={i}>
          <View style={{ gap: 10 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <Skeleton width={44} height={44} borderRadius={12} />
              <View style={{ flex: 1, gap: 6 }}>
                <Skeleton width="65%" height={14} borderRadius={6} />
                <Skeleton width="40%" height={11} borderRadius={5} />
              </View>
              <Skeleton width={80} height={14} borderRadius={6} />
            </View>
            <Skeleton height={6} borderRadius={4} />
          </View>
        </SkeletonCard>
      ))}
    </View>
  );
}

export function CategoriesSkeleton() {
  return (
    <View style={{ paddingHorizontal: 20, gap: 12, paddingTop: 16 }}>
      <View style={{ flexDirection: "row", gap: 8 }}>
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} width={80} height={32} borderRadius={20} />
        ))}
      </View>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <View key={i} style={{ width: "30%", gap: 8, alignItems: "center", padding: 12, borderRadius: 16 }}>
            <Skeleton width={48} height={48} borderRadius={14} />
            <Skeleton width="80%" height={11} borderRadius={5} />
          </View>
        ))}
      </View>
    </View>
  );
}

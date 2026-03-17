import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const NOTIF_ID_MAP_KEY = "commitment_notif_ids";

type PermissionStatus = "granted" | "denied" | "undetermined";

async function getPermissions(): Promise<{ status: PermissionStatus }> {
  if (Platform.OS === "web") return { status: "denied" };
  try {
    const Notifications = await import("expo-notifications");
    const { status } = await Notifications.getPermissionsAsync();
    return { status: status as PermissionStatus };
  } catch {
    return { status: "undetermined" };
  }
}

export async function requestPermission(): Promise<PermissionStatus> {
  if (Platform.OS !== "ios") return "granted";
  try {
    const Notifications = await import("expo-notifications");
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    if (existingStatus === "granted") return "granted";
    const { status } = await Notifications.requestPermissionsAsync();
    return status as PermissionStatus;
  } catch {
    return "undetermined";
  }
}

export async function getNotificationPermissionStatus(): Promise<PermissionStatus> {
  const { status } = await getPermissions();
  return status;
}

async function loadNotifIdMap(): Promise<Record<string, string>> {
  try {
    const raw = await AsyncStorage.getItem(NOTIF_ID_MAP_KEY);
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

async function saveNotifIdMap(map: Record<string, string>): Promise<void> {
  try {
    await AsyncStorage.setItem(NOTIF_ID_MAP_KEY, JSON.stringify(map));
  } catch {
    // silent — non-critical
  }
}

export async function scheduleCommitmentReminder(
  commitmentId: string,
  commitmentName: string,
  dueDateISO: string
): Promise<void> {
  if (Platform.OS === "web") return;
  try {
    const Notifications = await import("expo-notifications");
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== "granted") return;

    const dueDate = new Date(dueDateISO);
    const reminderDate = new Date(dueDate);
    reminderDate.setDate(reminderDate.getDate() - 1);
    reminderDate.setHours(9, 0, 0, 0);

    if (reminderDate <= new Date()) return;

    await cancelCommitmentReminder(commitmentId);

    const notifId = await Notifications.scheduleNotificationAsync({
      content: {
        title: "تذكير بالتزام",
        body: `${commitmentName} — مستحق غداً`,
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: reminderDate,
      },
    });

    const map = await loadNotifIdMap();
    map[commitmentId] = notifId;
    await saveNotifIdMap(map);
  } catch {
    // silent — notifications are optional
  }
}

export async function cancelCommitmentReminder(commitmentId: string): Promise<void> {
  if (Platform.OS === "web") return;
  try {
    const Notifications = await import("expo-notifications");
    const map = await loadNotifIdMap();
    const existingId = map[commitmentId];
    if (existingId) {
      await Notifications.cancelScheduledNotificationAsync(existingId);
      delete map[commitmentId];
      await saveNotifIdMap(map);
    }
  } catch {
    // silent
  }
}

let _lastAlertedAt80: string | null = null;
let _lastAlertedAt100: string | null = null;

export async function checkDailyLimitAlert(
  todaySpend: number,
  dailyLimit: number
): Promise<void> {
  if (Platform.OS === "web") return;
  if (dailyLimit <= 0) return;

  try {
    const Notifications = await import("expo-notifications");
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== "granted") return;

    const todayKey = new Date().toISOString().slice(0, 10);
    const pct = (todaySpend / dailyLimit) * 100;

    if (pct >= 100 && _lastAlertedAt100 !== todayKey) {
      _lastAlertedAt100 = todayKey;
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "تجاوزت حدك اليومي",
          body: "لقد تجاوزت الحد اليومي للإنفاق",
          sound: true,
        },
        trigger: null,
      });
    } else if (pct >= 80 && pct < 100 && _lastAlertedAt80 !== todayKey) {
      _lastAlertedAt80 = todayKey;
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "تنبيه الإنفاق",
          body: "اقتربت من حدك اليومي",
          sound: true,
        },
        trigger: null,
      });
    }
  } catch {
    // silent
  }
}

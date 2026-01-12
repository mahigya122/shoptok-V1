// services/analytics.ts
import { supabase } from "../lib/supabaseClient";
import * as Device from "expo-device";

// ✅ Define analytics row type
export interface AnalyticsEventRow {
  id?: string;
  event_type: string;
  user_id: string | null;
  payload: Record<string, any>;
  created_at?: string;
}

// ---------------- TRACK FUNCTION ----------------
export async function track(
  event_type: string,
  userId: string | null,
  payload: Record<string, any> = {}
) {
  const enriched = {
    ...payload,
    device: {
      model: Device.modelName ?? "unknown",
      osName: Device.osName ?? "unknown",
      osVersion: Device.osVersion ?? "unknown",
    },
    ts: new Date().toISOString(),
  };

  try {
    // ✅ Cast insert array instead of using generic
    const { error } = await supabase
      .from("analytics_events")
      .insert([{ event_type, user_id: userId, payload: enriched }] as AnalyticsEventRow[]);

    if (error) console.error("Analytics track error:", error.message);
  } catch (err) {
    console.error("Analytics track exception:", err);
  }
}

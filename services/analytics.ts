import { supabase } from "./api";
import * as Device from "expo-device";

export async function track(event_type: string, user_id: string | null, payload: Record<string, any> = {}) {
  const enriched = {
    ...payload,
    device: { model: Device.modelName, osName: Device.osName, osVersion: Device.osVersion },
    ts: new Date().toISOString()
  };
  await supabase.from("analytics_events").insert({ event_type, user_id, payload: enriched });
}

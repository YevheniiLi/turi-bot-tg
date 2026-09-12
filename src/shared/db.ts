import { createClient } from "@supabase/supabase-js";
import type { Itinerary } from "./planTrip.js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Adjust table/column names here to match your existing Wanderplan schema.
 * Expected table: trips (id, telegram_id, city, start_date, end_date, itinerary jsonb, created_at)
 */
export async function saveTrip(telegramId: number, itinerary: Itinerary) {
  const { data, error } = await supabase
    .from("trips")
    .insert({
      telegram_id: telegramId,
      city: itinerary.city,
      start_date: itinerary.days[0]?.date,
      end_date: itinerary.days.at(-1)?.date,
      itinerary,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getTripsForUser(telegramId: number) {
  const { data, error } = await supabase
    .from("trips")
    .select("*")
    .eq("telegram_id", telegramId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

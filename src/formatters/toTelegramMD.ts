import type { Itinerary } from "../shared/planTrip.js";

// Telegram MarkdownV2 requires escaping these characters outside of code blocks
const SPECIAL_CHARS = /[_*[\]()~`>#+\-=|{}.!]/g;

function escapeMD(text: string): string {
  return text.replace(SPECIAL_CHARS, (char) => `\\${char}`);
}

/**
 * Renders an Itinerary as a Telegram-safe MarkdownV2 string.
 * Kept separate from planTrip.ts because Telegram's formatting rules
 * are specific to this interface — the web app renders the same
 * Itinerary object as React components instead.
 */
export function toTelegramMD(itinerary: Itinerary): string {
  const lines: string[] = [];

  lines.push(`🌍 *${escapeMD(itinerary.city)}*`);
  lines.push(escapeMD(itinerary.summary));
  lines.push("");

  for (const day of itinerary.days) {
    lines.push(`*Day ${day.day} — ${escapeMD(day.date)}*`);
    for (const activity of day.activities) {
      lines.push(`  🕐 ${escapeMD(activity.time)} — *${escapeMD(activity.title)}*`);
      lines.push(`     ${escapeMD(activity.description)}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

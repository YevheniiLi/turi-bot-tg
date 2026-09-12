import type { Conversation } from "@grammyjs/conversations";
import { InlineKeyboard } from "grammy";
import type { MyContext } from "../bot.js";
import { planTrip } from "../shared/planTrip.js";
import { saveTrip } from "../shared/db.js";
import { toTelegramMD } from "../formatters/toTelegramMD.js";

type MyConversation = Conversation<MyContext>;

const BUDGET_KEYBOARD = new InlineKeyboard()
  .text("💸 Low", "budget_low")
  .text("💰 Medium", "budget_medium")
  .text("💎 High", "budget_high");

export async function planTripConversation(
  conversation: MyConversation,
  ctx: MyContext
) {
  await ctx.reply("Where would you like to go? (just type the city name)");
  const cityCtx = await conversation.waitFor("message:text");
  const city = cityCtx.message.text.trim();

  await ctx.reply(
    "What are your travel dates? Send them as: start - end\ne.g. 2026-10-12 - 2026-10-15"
  );
  const datesCtx = await conversation.waitFor("message:text");
  const [startDate, endDate] = datesCtx.message.text
    .split("-")
    .map((s) => s.trim());

  await ctx.reply("What's your budget level?", {
    reply_markup: BUDGET_KEYBOARD,
  });
  const budgetCtx = await conversation.waitForCallbackQuery([
    "budget_low",
    "budget_medium",
    "budget_high",
  ]);
  await budgetCtx.answerCallbackQuery();
  const budget = budgetCtx.callbackQuery.data!.replace("budget_", "") as
    | "low"
    | "medium"
    | "high";

  await ctx.reply(
    "Any specific interests? (food, museums, hiking...) Send 'skip' to move on."
  );
  const interestsCtx = await conversation.waitFor("message:text");
  const interestsRaw = interestsCtx.message.text.trim();
  const interests = interestsRaw.toLowerCase() === "skip" ? undefined : interestsRaw;

  await ctx.reply("Planning your trip... 🧳");

  try {
    // conversation.external wraps side-effecting/async calls so grammY
    // can safely replay the conversation on restarts without re-calling the API
    const itinerary = await conversation.external(() =>
      planTrip({ city, startDate, endDate, budget, interests })
    );

    await ctx.reply(toTelegramMD(itinerary), { parse_mode: "MarkdownV2" });

    await conversation.external(() =>
      saveTrip(ctx.from!.id, itinerary)
    );

    await ctx.reply("Saved! Use /mytrips anytime to see your past plans.");
  } catch (err) {
    console.error(err);
    await ctx.reply(
      "Something went wrong while planning your trip. Try again with /plan."
    );
  }
}

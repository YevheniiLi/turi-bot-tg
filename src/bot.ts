import "dotenv/config";
import { Bot, Context, session } from "grammy";
import {
  type ConversationFlavor,
  conversations,
  createConversation,
} from "@grammyjs/conversations";
import { planTripConversation } from "./conversations/planTripConversation.js";
import { getTripsForUser } from "./shared/db.js";

export type MyContext = Context & ConversationFlavor;

const bot = new Bot<MyContext>(process.env.BOT_TOKEN!);

bot.use(session({ initial: () => ({}) }));
bot.use(conversations());
bot.use(createConversation(planTripConversation, "planTrip"));

bot.command("start", async (ctx) => {
  await ctx.reply(
    "👋 Hi! I'm Wanderplan — I'll help you plan a trip right here in chat.\n\n" +
      "Use /plan to start a new trip, or /mytrips to see your saved plans."
  );
});

bot.command("plan", async (ctx) => {
  await ctx.conversation.enter("planTrip");
});

bot.command("mytrips", async (ctx) => {
  const trips = await getTripsForUser(ctx.from!.id);

  if (!trips.length) {
    await ctx.reply("You don't have any saved trips yet. Try /plan!");
    return;
  }

  const list = trips
    .map((t) => `📍 ${t.city} (${t.start_date} → ${t.end_date})`)
    .join("\n");

  await ctx.reply(`Your saved trips:\n\n${list}`);
});

bot.catch((err) => {
  console.error("Bot error:", err);
});

bot.start();
console.log("Wanderplan bot is running...");

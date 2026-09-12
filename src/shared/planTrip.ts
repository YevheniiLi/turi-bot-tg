import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface TripRequest {
  city: string;
  startDate: string; // ISO date, e.g. "2026-10-12"
  endDate: string; // ISO date
  budget: "low" | "medium" | "high";
  interests?: string; // free text, e.g. "food, museums, hiking"
}

export interface ItineraryDay {
  day: number;
  date: string;
  activities: {
    time: string; // e.g. "09:00"
    title: string;
    description: string;
  }[];
}

export interface Itinerary {
  city: string;
  summary: string;
  days: ItineraryDay[];
}

/**
 * Fallback itinerary used when the Claude API is unavailable — no API key
 * configured, or the account has no credit balance. Lets the bot stay fully
 * demoable (e.g. for a portfolio) without a live, funded API key.
 */
function buildDemoItinerary(request: TripRequest): Itinerary {
  const { city, startDate, endDate, interests } = request;

  return {
    city,
    summary: `⚠️ Demo mode: this is a sample itinerary, not a live Claude response. Add Anthropic API credits to generate real plans.${
      interests ? ` (Requested interests: ${interests})` : ""
    }`,
    days: [
      {
        day: 1,
        date: startDate || "day 1",
        activities: [
          {
            time: "09:00",
            title: `Morning walk in ${city}`,
            description: "Explore the historic center and grab coffee at a local cafe.",
          },
          {
            time: "13:00",
            title: "Lunch at a local spot",
            description: "Try a well-reviewed restaurant serving regional dishes.",
          },
          {
            time: "16:00",
            title: "Main landmark visit",
            description: `See ${city}'s most famous sight — book tickets ahead if needed.`,
          },
        ],
      },
      {
        day: 2,
        date: endDate || "day 2",
        activities: [
          {
            time: "10:00",
            title: "Museum or gallery",
            description: "Visit a museum matching your interests.",
          },
          {
            time: "14:00",
            title: "Neighborhood exploration",
            description: "Wander a lesser-known district for a local feel.",
          },
        ],
      },
    ],
  };
}

/** True for errors that mean "the API can't be reached/paid for", not a real planning failure. */
function isApiUnavailableError(err: unknown): boolean {
  if (!process.env.ANTHROPIC_API_KEY) return true;
  const message = err instanceof Error ? err.message : String(err);
  return (
    message.includes("credit balance is too low") ||
    message.includes("invalid_request_error") ||
    message.includes("authentication_error") ||
    message.includes("401") ||
    message.includes("400")
  );
}

/**
 * Core business logic shared between the web app and the Telegram bot.
 * Asks Claude for a structured itinerary and parses it as JSON.
 * Falls back to a demo itinerary if the API key is missing or unfunded,
 * so the bot stays demoable without a live billing setup.
 */
export async function planTrip(request: TripRequest): Promise<Itinerary> {
  const { city, startDate, endDate, budget, interests } = request;

  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn("[planTrip] No ANTHROPIC_API_KEY set — returning demo itinerary.");
    return buildDemoItinerary(request);
  }

  const systemPrompt = `You are a travel planning assistant. You must respond with ONLY valid JSON, no markdown fences, no preamble, matching exactly this TypeScript type:

{
  "city": string,
  "summary": string, // 1-2 sentence overview of the trip
  "days": [
    {
      "day": number,
      "date": string, // ISO date
      "activities": [
        { "time": string, "title": string, "description": string }
      ]
    }
  ]
}`;

  const userPrompt = `Plan a trip to ${city} from ${startDate} to ${endDate}.
Budget level: ${budget}.
${interests ? `Interests: ${interests}.` : ""}
Include 3-4 activities per day, realistic timing, and a mix of well-known and local spots.`;

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 2000,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    const textBlock = response.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      throw new Error("No text response from Claude");
    }

    const cleaned = textBlock.text.replace(/```json|```/g, "").trim();
    return JSON.parse(cleaned) as Itinerary;
  } catch (err) {
    if (isApiUnavailableError(err)) {
      console.warn(
        "[planTrip] Claude API unavailable (no credits or bad key) — returning demo itinerary.",
        err instanceof Error ? err.message : err
      );
      return buildDemoItinerary(request);
    }
    throw err;
  }
}

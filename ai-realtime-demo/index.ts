import { config } from "dotenv";
import { generateText } from "ai";

config({ path: ".env.local" });

async function main() {
  if (!process.env.AI_GATEWAY_API_KEY) {
    throw new Error(
      "AI_GATEWAY_API_KEY is missing. Add it to ai-realtime-demo/.env.local",
    );
  }

  const { text } = await generateText({
    model: "anthropic/claude-opus-5",
    prompt: "What is the capital of France?",
  });

  console.log(text);
}

main().catch(console.error);

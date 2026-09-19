import { runMapAbleHfAgent } from "@/lib/agent/mapable-hf-speech-agent";

function argValue(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function hasFlag(name: string): boolean {
  return process.argv.includes(name);
}

async function main() {
  const prompt = argValue("--prompt");
  if (!prompt) {
    throw new Error(
      'Usage: pnpm agent:mapable-hf -- --prompt "your question" [--save] [--speak] [--label name]',
    );
  }

  const result = await runMapAbleHfAgent({
    prompt,
    saveText: hasFlag("--save"),
    speak: hasFlag("--speak"),
    label: argValue("--label"),
  });

  process.stdout.write(JSON.stringify(result, null, 2) + "\n");
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : "Agent run failed";
  console.error(message);
  process.exitCode = 1;
});

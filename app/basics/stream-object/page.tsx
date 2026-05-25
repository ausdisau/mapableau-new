import { SkipToContent } from "@/components/core/SkipToContent";
import { StreamObjectDemo } from "@/components/ai/StreamObjectDemo";

export const metadata = {
  title: "Stream structured objects | MapAble",
  description:
    "Demo of AI SDK streamText with Output.object and useObject for live typed streaming.",
};

export default function StreamObjectBasicsPage() {
  return (
    <div className="min-h-screen bg-background">
      <SkipToContent />
      <main id="main-content" className="mx-auto max-w-2xl px-4 py-10">
        <header className="mb-8">
          <h1 className="font-heading text-3xl font-bold">
            Stream structured output
          </h1>
          <p className="mt-2 text-muted-foreground">
            Server: <code className="text-sm">streamText</code> with{" "}
            <code className="text-sm">Output.object</code> and a Zod schema.
            Client: <code className="text-sm">useObject</code> renders partial
            results in real time.
          </p>
        </header>
        <StreamObjectDemo />
      </main>
    </div>
  );
}

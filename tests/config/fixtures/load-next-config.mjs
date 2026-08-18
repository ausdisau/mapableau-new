/**
 * Child-process helper: import next.config.ts so assertDeployedProductionEnv runs.
 * Prints NEXT_CONFIG_OK on success; non-zero exit on validation failure.
 */
try {
  const mod = await import("../../../next.config.ts");
  const config = mod.default;
  process.stdout.write("NEXT_CONFIG_OK\n");
  process.stdout.write(
    `${JSON.stringify({
      ignoreBuildErrors: config?.typescript?.ignoreBuildErrors === true,
      ignoreDuringBuilds: config?.eslint?.ignoreDuringBuilds === true,
    })}\n`,
  );
  process.exit(0);
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`${message}\n`);
  process.exit(1);
}

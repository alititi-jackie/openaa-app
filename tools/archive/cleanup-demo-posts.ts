type EnvName = "local" | "staging" | "production";

type CliOptions = {
  env: EnvName;
  apply: boolean;
  confirmProduction: boolean;
};

const DEMO_METADATA = {
  source: "legacy_demo_import",
  origin: "openaa-ny",
  imported_for: "visual_testing",
};

function main() {
  const options = parseArgs(process.argv.slice(2));
  enforceSafety(options);

  console.log("Demo post cleanup plan");
  console.log(`Environment: ${options.env}`);
  console.log(`Mode: ${options.apply ? "apply" : "dry-run"}`);
  console.log(`Target metadata: ${JSON.stringify(DEMO_METADATA)}`);
  console.log("");
  console.log("Would count and clean only records where metadata->>'source' = 'legacy_demo_import'.");
  console.log("Would not clean legacy_official_import navigation, news, ads, ticker, top links, or home sections.");
  console.log("");
  console.log("Planned counts are placeholders in Seed-A because database deletion is not implemented:");
  console.log("- posts: 0");
  console.log("- post_contacts: 0");
  console.log("- post_images: 0");
  console.log("- image_assets: 0");

  if (options.apply) {
    console.error("Apply mode is intentionally not implemented in Seed-A. Add deletion logic in Seed-C after review.");
    process.exit(1);
  }

  console.log("Dry-run complete. No database writes were performed.");
}

function parseArgs(args: string[]): CliOptions {
  const values = new Set(args.filter((arg) => arg.startsWith("--")).map((arg) => arg.slice(2)));
  const envArg = args.find((arg) => arg.startsWith("--env="));
  const envValue = envArg?.split("=", 2)[1];
  const env = isEnvName(envValue) ? envValue : isEnvName(process.env.npm_config_env) ? process.env.npm_config_env : undefined;
  if (!env) fail("Missing or invalid --env. Use local, staging, or production.");

  return {
    env,
    apply: values.has("apply") || process.env.npm_config_apply === "true",
    confirmProduction: values.has("confirm-production") || process.env.npm_config_confirm_production === "true",
  };
}

function enforceSafety(options: CliOptions) {
  if (options.env === "production" && !options.confirmProduction) {
    fail("Production cleanup requires --confirm-production, even for dry-run.");
  }
}

function isEnvName(value: unknown): value is EnvName {
  return value === "local" || value === "staging" || value === "production";
}

function fail(message: string): never {
  console.error(message);
  process.exit(1);
}

main();

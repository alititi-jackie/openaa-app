/* eslint-disable @typescript-eslint/no-require-imports */
// Compile the small set of pure TypeScript modules exercised by node:test.
// Keep this loader local to tests; Next.js remains the production compiler.
const fs = require("node:fs");
const ts = require("typescript");

require.extensions[".ts"] = (module, filename) => {
  const source = fs.readFileSync(filename, "utf8");
  const result = ts.transpileModule(source, {
    fileName: filename,
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  module._compile(result.outputText, filename);
};

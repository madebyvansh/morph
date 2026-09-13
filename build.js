const esbuild = require("esbuild");

esbuild.build({
  entryPoints: ["supabase-entry.js"],
  bundle: true,
  outfile: "extension/supabase-client.js",
  format: "iife",
  platform: "browser",
  minify: false,
}).catch(() => process.exit(1));
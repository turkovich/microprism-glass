import * as esbuild from "esbuild";

const shared = {
  bundle: true,
  platform: "browser",
  target: ["es2020"],
  // This is where .glsl becomes a JS string right inside the package bundle.
  loader: { ".glsl": "text" },
  sourcemap: true,
  legalComments: "none",
  logLevel: "info",
};

const entry = "src/index.ts";

await Promise.all([
  esbuild.build({ ...shared, entryPoints: [entry], format: "esm", outfile: "dist/index.mjs" }),
  esbuild.build({ ...shared, entryPoints: [entry], format: "cjs", outfile: "dist/index.cjs" }),
]);
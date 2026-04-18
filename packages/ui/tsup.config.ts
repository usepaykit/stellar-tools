import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/**/*.{ts,tsx}", "!src/**/*.stories.{ts,tsx}"],
  format: ["esm"],
  dts: true,
  clean: true,
  external: ["react", "react-dom", "react/jsx-runtime", "next", "next/*"],
  outDir: "dist",
  splitting: false,
  treeshake: true,
  sourcemap: false,
});

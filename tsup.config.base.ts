import { Options, defineConfig } from "tsup";

export function createTsupConfig(
  options: Options = {}
): ReturnType<typeof defineConfig> {
  return defineConfig({
    entry: ["src/**/*.ts"],
    format: ["cjs", "esm"],
    dts: true,
    clean: true,
    splitting: false,
    treeshake: true,
    outDir: "dist",
    outExtension({ format }) {
      return {
        js: format === "cjs" ? ".js" : ".mjs",
      };
    },
    ...options,
  });
}

// Default export for packages that don't need customization
export default createTsupConfig();

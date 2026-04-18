import type { StorybookConfig } from "@storybook/react-vite";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// Root of packages/ui — always resolved relative to this config file
const packageRoot = path.resolve(__dirname, "..");

const config: StorybookConfig = {
  stories: ["../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
  addons: ["@storybook/addon-essentials"],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  // No static dir needed; public assets live in apps/web
  staticDirs: [],
  async viteFinal(config) {
    return {
      ...config,
      // Add Tailwind v4 Vite plugin (replaces PostCSS approach for Vite)
      plugins: [...(config.plugins ?? []), tailwindcss()],
      define: {
        ...config.define,
        // Next.js Link expects process in the browser; Vite doesn't provide it
        process: {
          env: {
            NODE_ENV: "development",
            __NEXT_ROUTER_BASEPATH: "",
          },
        },
      },
      resolve: {
        ...config.resolve,
        alias: {
          ...config.resolve?.alias,
          // @/* maps to packages/ui/src/* to match tsconfig paths
          "@": path.join(packageRoot, "src"),
          "lucide-react": path.resolve(packageRoot, "node_modules/lucide-react/dist/cjs/lucide-react.js"),
        },
      },
      server: {
        ...config.server,
        fs: {
          ...config.server?.fs,
          allow: [packageRoot],
        },
      },
    };
  },
};

export default config;

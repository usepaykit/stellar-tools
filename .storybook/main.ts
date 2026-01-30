import type { StorybookConfig } from "@storybook/react-vite";
import path from "path";

const projectRoot = path.resolve(process.cwd());

const config: StorybookConfig = {
  stories: ["../components/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
  addons: ["@storybook/addon-essentials"],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  staticDirs: ["../public"],
  async viteFinal(config) {
    return {
      ...config,
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
          "@": projectRoot,
          "lucide-react": path.resolve(projectRoot, "node_modules/lucide-react/dist/cjs/lucide-react.js"),
        },
      },
      server: {
        ...config.server,
        fs: {
          ...config.server?.fs,
          allow: [projectRoot],
        },
      },
    };
  },
};

export default config;

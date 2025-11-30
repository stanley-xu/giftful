// https://docs.expo.dev/guides/using-eslint/
import { defineConfig } from "eslint/config";
import expoConfig from "eslint-config-expo/flat.js";
import reactHooksPlugin from "eslint-plugin-react-hooks";

export default defineConfig([
  expoConfig,
  {
    ignores: ["dist/*"],
    plugins: {
      "react-hooks": reactHooksPlugin,
    },
    rules: {
      "import/no-unresolved": "off", // TypeScript handles path resolution
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
    },
  },
]);

/**
 * Dynamic config file that wraps the static one (`app.json`)
 * Acts like "middleware", as it calls the default export function passing in the static config.
 */

import { config } from "dotenv";
import { ConfigContext, ExpoConfig } from "expo/config";

const envFile = process.env.APP_VARIANT;

if (envFile) {
  config({
    path: `.env.${envFile}`,
    override: true,
    quiet: true,
  });
}

/**
 * APP_VARIANT variable will be set either:
 * - by npm scripts that set it `APP_VARIANT=... npx expo start`
 * - by `eas` (see eas.json)
 */
const IS_DEV = process.env.APP_VARIANT === "development";
const IS_PREVIEW = process.env.APP_VARIANT === "preview";

/**
 * Support unique app installs per app variant (i.e. development and preview).
 * Requires unique bundle identifiers, since the app stores only allow one per app.
 * @link https://docs.expo.dev/tutorial/eas/multiple-app-variants/
 */
const getUniqueIdentifier = () => {
  if (IS_DEV) {
    return "io.giftful.dev";
  }

  if (IS_PREVIEW) {
    return "io.giftful.preview";
  }

  return "io.giftful";
};

const getAppName = () => {
  if (IS_DEV) {
    return "Giftful (Dev)";
  }

  if (IS_PREVIEW) {
    return "Giftful (Preview)";
  }

  return "Giftful";
};

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: getAppName(),
  slug: "giftful",
  ios: {
    ...config.ios,
    bundleIdentifier: getUniqueIdentifier(),
  },
  extra: {
    ...config.extra,
    // Add Expo constants with dotenv
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
    supabaseKey: process.env.SUPABASE_PUBLISHABLE_KEY,
    webUrl: process.env.EXPO_PUBLIC_WEB_URL,
  },
});

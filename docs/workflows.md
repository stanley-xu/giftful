# Workflows

- [Dev loop](#development-loop)
- [Submission](#submit-the-app-for-release)

See the guide [here](https://docs.expo.dev/workflow/overview/)

# Distributing the app

Submit the app binary (which you previously built) to the App Store.

**Note:** submitting an app to the App Store is a multi-step process, and this is just the beginning. Some parts (i.e. TestFlight) can be automated, but App Store reviews are always manual

TL;DR

```sh
eas build --platform ios --profile production # first, trigger build if you haven't
eas submit --platform ios # prompts you to select a production build on EAS
```

### TestFlight

To distribute with TestFlight, either

- Use the App Store Connect website > Apps > setup Groups and ensure build is assigned to the group, OR
- use `eas build --platform ios --auto-submit` (this does not submit to App Store for review)

### App Store

Must manually promote a TestFlight build to App Store review.

# Development loop

TL;DR

- Development builds should be the **main** build option
  - It gives us access to the native bundle
  - But still gives us good DX with `expo-dev-client` that helps with Fast Refresh and other DX
- To create a development build, EITHER:
  - build it locally: `npx expo run:ios` or `npx expo run:ios --device`
  - build it with EAS: `eas build -p ios --profile development` (profile modes are configurable)
- Expo Go is only for prototyping without native features (e.g. push notifications)

## Development builds

Uses the underlying IDEs meant for mobile development for each platform: Xcode and Android Studio. When you trigger a dev build, you'll require these tools to essentially compile your app binary on your local machine.

**Note**: while `expo-dev-client` helps rebuild JS instantly, when the native part of the app changes, you must **rebuild** it

### Build locally

Use the locally installed Xcode / Android Studio dev environments for compiling locally.

```sh
npx expo run:ios
npx expo run:android
```

These are actually shorthands that trigger the steps

- Installs a dev build of the app on your simulator
- Generates native directories `/ios` and `/android` project directory (if it **does not** exist yet)
  - Uses `expo prebuild --platform <platform>`
  - You can directly develop with these if you want in Xcode (open with `xed ios`)
- Runs the dev server with `expo start`

You can also target locally configured devices / simulators by passing `--device`, or device variants:

```sh
npx expo run:ios --device
npx expo run:ios --device --configuration Release # Production build
```

#### Continuous Native Generation (CNG)

An iterative build step that Expo supports.

```sh
npx expo prebuild --clean
npx expo run:ios
```

> When do I need to prebuild?

If you add a new native dependency to your project or change the project configuration in Expo app config (app.json/app.config.js), you can run npx expo prebuild --clean to re-generate the native project directories.

### Build with EAS

The build / release / update workflows are handled by EAS.

- This triggers upload of your project into EAS build servers for compilation
- EAS builds can be downloaded via
  - QR code (from CLI),
  - the (equivalent) EAS web link,
  - or Expo Orbit (macOS app that helps you manage EAS builds and build targets)

With the CLI tool

```sh
eas build --platform ios --profile development
eas build --platform android --profile development
```

- Installs a dev build of the app on simulator or physical device
- Note that you need to setup for iOS
  1. Apple Developer account setup
  2. Device needs to be provisioned with an ad hoc profile (registers your device with developer account)
  3. Device needs to be in Developer mode (disables some default security features)

## Expo Go

| Pros                                                     | Cons                                                    |
| -------------------------------------------------------- | ------------------------------------------------------- |
| Expo Go abstracts away native bundle                     | Limited to whatever native environment Expo Go provides |
| Easily build for cross platform (i.e. no need for Xcode) |                                                         |

---

# Setup details

There is a _lot_ that goes into building apps and distributing them. EAS really helps to streamline this process. See the [tutorial](https://docs.expo.dev/tutorial/eas/introduction/)

Very roughly, building and submitting with EAS from scratch looks like

1. Installing the CLI, authenticating via `eas login`
2. Configuring builds via `eas.json`
3. For dev builds, configuring iOS devices via `eas device:create` to provision an ad-hoc profile (iOS requires this and Developer Mode enabled to install on a device)
4. You can build with `eas build -p ios --profile development`. This also does a _bunch_ [^1] of other stuff.
5. The builds can be downloaded from EAS' web platform itself (or via the convenient Expo Orbit)

[^1]: it configures your build with your `app.json` and authenticates with your Apple Developer account (and Team), your provisioned devices, and an Apple Distribution Certificate (which it can auto-generate for you)

## App versioning

It's useful to have different versions of apps, per type of profile you define in `eas.json`.
This way you can differentiate your `bundleIdentifier` so that you can install multiple versions of your app.

e.g. Giftful, Giftful (Preview), and Giftful (Dev) are all different apps that can be built and distributed

## Environment variables

It's important to set different values for your environment variables, per environment.

e.g. You want your production app to hit your production API URL, but not in development

- EAS allows you to define env vars from the platform's side for usage during EAS builds
- You can also define `env` objects in `eas.json` to supply these env vars during `eas build`

---

# Resources

- [Create and run cloud build for iOS](https://docs.expo.dev/tutorial/eas/ios-development-build-for-devices/)
- [Local app development guide](https://docs.expo.dev/guides/local-app-development/#local-builds-with-expo-dev-client)

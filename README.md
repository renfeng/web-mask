# Angular Mask Chrome Extension

The Angular Mask Chrome Extension allows you to inject a local build of an Angular Frontend into any test or production environment.

This gives us the following possibilities:

- testing of local changes on Vega and PreProd while these environments are reserved for other releases
- Hotfix testing directly on the PROD environment with actual PROD data
- Feature branch integration testing before creating a pull request

## Build

Run `bin/build.sh`

## Install

1. Open `chrome://extensions` in your Chrome browser
2. Enable `Developer mode`
3. Click `Load unpacked` and point it to `dist/unpacked`
4. A grayscale Swisscom icon appears in the upper right corner of Chrome, click it and press "Enable" to activate the plugin
5. The Swisscom logo is now colorful, meaning the plugin is active

## How to run it

1.  `npm run start:extension`
2.  Open the frontend where you want the scripts injected on any environment, e.g. Vega
3.  Open the console - you should now see a message `Injected Local Angular Scripts!`
4.  Perform integration tests

## Disabling plugin

1. When done you can disable the plugin by clicking the colorful Swisscom logo in the upper right corner of chrome and press "disable".
2. The plugin is now inactive and the normal environment scripts will be loaded when navigating
3. If you want you can also disable or remove the plugin entirely under `chrome://extensions`

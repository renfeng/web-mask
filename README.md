# Angular Mask Chrome Extension

The Angular Mask Chrome Extension allows you to inject a local build of an Angular Frontend into any test or production environment.

This gives us the following possibilities:

- testing of local changes on Vega and PreProd while these environments are reserved for other releases
- Hotfix testing directly on the PROD environment with actual PROD data
- Feature branch integration testing before creating a pull request

## Build

Run `bin/build.sh ${path_to_dist} ${domain1} ${domain2}... ${domainN}`

## Install and run

1. Open `chrome://extensions` in your Chrome browser
2. Enable `Developer mode`
3. Click `Load unpacked` and point it to `dist/unpacked`
4. A grayscale Swisscom icon appears in the upper right corner of Chrome, which indicates the plugin is disable for current tab.
5. Open a tab with the given domain, the Swisscom logo is now colorful, meaning the plugin is active.

## Uninstall or disable

When done you can uninstall the plugin by clicking the colorful Swisscom logo in the upper right corner of chrome and press "Remove from Chrome..."

You can also disable the plugin under `chrome://extensions`

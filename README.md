# Angular Mask Chrome Extension

The Angular Mask Chrome Extension allows you to inject a local build of an Angular Frontend into any test or production environment.

This gives us the following possibilities:

- testing of local changes on Vega and PreProd while these environments are reserved for other releases
- Hotfix testing directly on the PROD environment with actual PROD data
- Feature branch integration testing before creating a pull request

## Build

```shell
cd ${directory_for_angular_json}
npm run ${you_npm_script_to_start_angular_dev_server}
```

```shell
cd ${directory_for_package_json_of_your_web_app}
${base}/bin/build.sh ${domain1} ${domain2}... ${domainN}
```

Tips: put the command line into a shell script file, and include in source control

## Install and run

1. Follow the instruction printed by the command line above.
2. A grayscale Swisscom icon appears in the upper right corner of Chrome, which indicates the plugin is disable for current tab.
3. Open a tab with the given domain, the Swisscom logo is now colorful, meaning the plugin is active.

## Uninstall or disable

When done you can uninstall the plugin by clicking the colorful Swisscom logo in the upper right corner of chrome and press "Remove from Chrome..."

You can also disable the plugin under `chrome://extensions`

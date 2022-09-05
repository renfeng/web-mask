# Angular Mask Chrome Extension

The Angular Mask Chrome Extension allows you to inject a local build of an Angular Frontend into any server environment.

This gives us the following possibilities:

- testing of local changes on servers while these environments are reserved for other releases
- Hotfix testing directly on server environment with actual data
- Feature branch integration testing before creating a pull request

## Build

```shell
${base}/bin/build.sh
```

## Install and run

1. Follow the instruction printed by the command line above.
2. Open a tab, click on the extension icon once to request access.
3. Click on the extension icon again to open a popup.
4. Choose local port and context path, and click on enable button.

## Uninstall or disable

When done you can uninstall the plugin, or disable it under `chrome://extensions`

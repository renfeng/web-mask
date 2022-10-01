# Web Mask Chrome Extension

See also [chrome-web-store/README.md](chrome-web-store/README.md)

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

## Troubleshooting: redirect doesn't work

Enable the option, DevTools >> Application >> Service Workers >> Bypass for network

Ref. https://crbug.com/1012977

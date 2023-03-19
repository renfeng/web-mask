# Store listing

## Description

It enables you to

- Debug a remote web site, for which source map is usually disabled, with your local web server
- Test your local changes with actual data from remote servers - integration test before pull request

The idea and its implementation are based on HTTP and HTML. They are independent to the above frameworks, and SHOULD work for all web technologies. Known issue:
* How a javascript library renders content, e.g. reactjs
* Service worker. See screenshots for instruction.

It's similar to "Resource Override", but it requires a minimum configuration, it is built for Manifest V3, and it is test automation friendly. See
* https://chrome.google.com/webstore/detail/resource-override/pkoacgokdfckfpndoffpifphamojphii
* https://developer.chrome.com/docs/extensions/mv3/mv2-sunset/

Tests (in alphabetic order)
* Successful. Manual.
  * Target website: https://angular.io/
  * Source code: https://github.com/angular/angular
* Successful. Automated.
  * Target website: https://material.angular.io/
  * Source code: https://github.com/angular/material.angular.io
* Failing. Work in progress...
  * Target website: https://reactjs.org/
  * Source code: https://github.com/reactjs/reactjs.org
* Successful. Automated.
  * Target website: https://vuejs.org/
  * Source code: https://github.com/vuejs/docs

## Category

Developer Tools

## Language

English (United Kingdom)

## Store icon

![Angular logo 128x128](../src/vanilla/icon128.png)

## Screenshots

![Angular live development server 1280x800](1-angular-live-development-server.png)
![An Angular website 1280x800](2-disabled.png)
![Resources overridden 1280x800](3-enabled.png)
![Working with service worker enabled websites 1280x800](4-redirect-bypassing-service-worker.png)

## Homepage URL

https://github.com/renfeng/web-mask

## Support URL

https://github.com/renfeng/web-mask

# Privacy practices

## Single Purpose Description

It overrides resources, JS, CSS, Image, and fonts, of a website with the copies from a local web server.

## declarativeNetRequestWithHostAccess justification

Redirect HTTP requests for javascript, css, image, ... files to local web server.

## webRequest justification

Detect network idle, similar to https://pptr.dev/api/puppeteer.page.waitfornetworkidle/

## Host permission justification

Redirect HTTP requests for javascript, css, image, ... files to local web server.

## Are you using remote code?

No, I am not using remote code

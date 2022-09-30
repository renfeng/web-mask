# Store listing

## Description

It overrides resources, JS, CSS, Image, and fonts, of a website with the copies from a local dev server.

It enables you to

- Debug a remote web site where source map is usually disabled with your local frontend dev server
- Test your local changes with actual data from remote servers - integration test before pull request

It's similar to "Resource Override", but requires minimum configuration and is built for Manifest V3. See
* https://chrome.google.com/webstore/detail/resource-override/pkoacgokdfckfpndoffpifphamojphii
* https://developer.chrome.com/docs/extensions/mv3/mv2-sunset/

## Category

Developer Tools

## Language

English (United Kingdom)

## Store icon

![Angular logo 128x128](../src/vanilla/icon128.png 'Angular logo 128x128')

## Screenshots

![Redirect without service worker 1280x800](redirect-without-service-worker.png 'Redirect without service worker 1280x800')

# Privacy practices

## Single Purpose Description

Debug frontend project locally with data from a remote server.

## declarativeNetRequestWithHostAccess justification

Redirect HTTP requests for javascript, css, image, ... files to local frontend dev server.

## storage justification

Manifest v3 "... service worker will ... get terminated repeatedly throughout a user's browser session ... treating the Storage APIs as our source of truth"
https://developer.chrome.com/docs/extensions/mv3/migrating_to_service_workers/#state

## Host permission justification

Redirect HTTP requests for javascript, css, image, ... files to local frontend dev server.

## Are you using remote code?

No, I am not using remote code

# Store listing

## Description

The Angular Mask Chrome Extension allows you to inject a local build of an Angular Frontend into any server environment.

This gives us the following possibilities:

- Testing of local changes on servers while the servers are reserved for major release
- Hotfix testing directly on server environment with actual data
- Feature branch integration testing before creating a pull request

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

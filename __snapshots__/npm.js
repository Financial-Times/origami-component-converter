exports['createManifest without a repository parameter creates the same manifest as last time 1'] = {
  "browser": "browser.js",
  "module": "module.js",
  "eslintIgnore": [
    "module.js",
    "browser.js",
    "dist/",
    "dist-esm/"
  ],
  "keywords": [
    "origami",
    "component",
    "ft"
  ],
  "name": "@financial-times/o-test-component",
  "component": "o-test-component",
  "aliases": {
    "ft-date-format": "@financial-times/ft-date-format",
    "fticons": "@financial-times/fticons",
    "n-map-content-to-topper": "@financial-times/n-map-content-to-topper",
    "prism": "prismjs",
    "pusher": "pusher-js",
    "hogan": "hogan.js"
  }
}

exports['createManifest with a repository parameter creates the same manifest as last time 1'] = {
  "browser": "browser.js",
  "module": "module.js",
  "eslintIgnore": [
    "module.js",
    "browser.js",
    "dist/",
    "dist-esm/"
  ],
  "keywords": [
    "origami",
    "component",
    "ft"
  ],
  "name": "@financial-times/o-test-component",
  "component": "o-test-component",
  "aliases": {
    "ft-date-format": "@financial-times/ft-date-format",
    "fticons": "@financial-times/fticons",
    "n-map-content-to-topper": "@financial-times/n-map-content-to-topper",
    "prism": "prismjs",
    "pusher": "pusher-js",
    "hogan": "hogan.js"
  },
  "repository": {
    "type": "git",
    "url": "https://origami.ft.com"
  }
}

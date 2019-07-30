exports['createManifest creates the same manifest as last time 1'] = {
  "browser": "browser.js",
  "files": [
    "svg/",
    "dist/",
    "browser.js",
    "src/",
    "!src/**/*.js",
    "main.scss",
    "img",
    "*.json",
    "scss",
    "!bower.json",
    "!.bower.json"
  ],
  "eslintIgnore": [
    "browser.js",
    "dist/"
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
    "prism": "prismjs",
    "pusher": "pusher-js",
    "hogan": "hogan.js"
  }
}

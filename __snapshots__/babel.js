exports['babel config'] = {
  "presets": [],
  "plugins": [
    [
      "module:babel-plugin-module-resolver",
      {
        "alias": {
          "alice": "banana",
          "charlie": "delta"
        }
      }
    ]
  ],
  "overrides": [
    {
      "presets": [
        [
          "@babel/preset-env",
          {
            "useBuiltIns": false
          }
        ]
      ],
      "plugins": [
        "module:babel-plugin-add-module-exports",
        [
          "module:babel-plugin-import-redirect",
          {
            "redirect": {
              "alice/src/(.*)": "banana/dist/$1",
              "charlie/src/(.*)": "delta/dist/$1"
            }
          }
        ]
      ],
      "exclude": "./test.src/**"
    },
    {
      "presets": [],
      "plugins": [
        [
          "module:babel-plugin-import-redirect",
          {
            "redirect": {
              "./src/(.*)": "./dist/$1",
              "alice/src/(.*)": "banana/dist/$1",
              "charlie/src/(.*)": "delta/dist/$1"
            }
          }
        ]
      ],
      "test": "./main.js"
    },
    {
      "presets": [],
      "plugins": [
        [
          "module:babel-plugin-import-redirect",
          {
            "root": "test",
            "redirect": {
              "../src/(.*)": "../dist/$1",
              "./fixture/main": "./fixture/main",
              "../main": "../browser.js",
              "alice/src/(.*)": "banana/dist/$1",
              "charlie/src/(.*)": "delta/dist/$1"
            }
          }
        ]
      ],
      "test": "./test.src/**"
    }
  ]
}

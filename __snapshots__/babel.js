exports['babel config'] = {
  "filename": "",
  "presets": [],
  "plugins": [
    [
      "~root~/node_modules/babel-plugin-module-resolver",
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
          "~root~/node_modules/@babel/preset-env",
          {
            "useBuiltIns": false,
            "targets": {
              "esmodules": true
            },
            "modules": "commonjs"
          }
        ]
      ],
      "plugins": [
        "~root~/node_modules/babel-plugin-add-module-exports",
        [
          "~root~/node_modules/babel-plugin-import-redirect",
          {
            "redirect": {
              "alice/src/(.*)": "banana/dist/$1",
              "charlie/src/(.*)": "delta/dist/$1"
            },
            "suppressResolveWarning": true
          }
        ]
      ],
      "exclude": "./test.src/**"
    },
    {
      "presets": [],
      "plugins": [
        "~root~/node_modules/babel-plugin-add-module-exports",
        [
          "~root~/node_modules/babel-plugin-import-redirect",
          {
            "redirect": {
              "./src/(.*)": "./dist/$1",
              "alice/src/(.*)": "banana/dist/$1",
              "charlie/src/(.*)": "delta/dist/$1"
            },
            "suppressResolveWarning": true
          }
        ]
      ],
      "test": "./main.js"
    },
    {
      "presets": [],
      "plugins": [
        [
          "~root~/node_modules/babel-plugin-import-redirect",
          {
            "root": "test",
            "redirect": {
              "../src/(.*)": "../dist/$1",
              "./fixture/main": "./fixture/main",
              "../main": "../browser",
              "alice/src/(.*)": "banana/dist/$1",
              "charlie/src/(.*)": "delta/dist/$1"
            },
            "suppressResolveWarning": true
          }
        ]
      ],
      "test": "./test.src/**"
    }
  ]
}

exports['babel config'] = {
  "filename": "",
  "presets": [],
  "plugins": [
    null
  ],
  "overrides": [
    {
      "presets": [
        [
          "/Users/chee/Projects/Origami/occ/node_modules/@babel/preset-env",
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
        "/Users/chee/Projects/Origami/occ/node_modules/babel-plugin-add-module-exports",
        null
      ],
      "exclude": "./test.src/**"
    },
    {
      "presets": [],
      "plugins": [
        "/Users/chee/Projects/Origami/occ/node_modules/babel-plugin-add-module-exports",
        null
      ],
      "test": "./main.js"
    },
    {
      "presets": [],
      "plugins": [
        null
      ],
      "test": "./test.src/**"
    }
  ]
}

exports['babel config'] = {
  "filename": "",
  "presets": [],
  "plugins": [
    "/Users/chee/Projects/Origami/occ/node_modules/babel-plugin-add-module-exports",
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
      "plugins": [],
      "exclude": "./test.src/**"
    }
  ]
}

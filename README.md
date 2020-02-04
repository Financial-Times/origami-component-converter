# Origami Component Converter

## What is this?

This is a tool used during build process of Origami components, to prepare them for publish on npm.

### how does it do that?

It gets run in the project directory of a component.

First, it converts the [bower.json](https://github.com/bower/spec/blob/59c8f0e8f8444cbdd71a091919d28d0fa29d56fe/json.md) to an npm-ready [package.json](https://docs.npmjs.com/files/package.json) and writes it to disk.

* append `@financial-times/` to the name, to place it under our npm organisation
* rewrite dependencies from the `bower.json` to their npm names
* create a map of aliases for the upcoming compile step

Then, it compiles the javascript to esm using babel. The [babel-plugin-import-rewrite](./lib/babel-plugin-import-rewrite.js) plugin uses the generated aliases field to rewrite any dependencies whose names differ between bower and npm.

We remove the aliases field, and then the package is ready to publish.

## How do I use it?

Oh? You've got an Origami component you want to put on npm?

Great! 😊

```sh
$ cd o-component
$ latest_version=$(git tag | sort -V | tail -1 | grep -Eo '\d+\.\d+\.\d+')
$ npx occ $latest
$ npm publish --access public
```

If the above code does not work for your component, please contact Origami via Slack (#origami-support) or opening an issue on this repository.

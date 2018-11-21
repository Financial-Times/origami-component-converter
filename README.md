# origami npm module maker

## usage

```sh
$ npm install -g sinopia
$ sinopia
$ npm install -g @chee/o-npm
$ on --working-directory /tmp/origami
```

this will:

1. create /tmp/origami containing:
  - `.bowerrc` pointing to the origami registry
  - `.npmrc` pointing to the local sinopia registry
  - `package.json` depending on babel for building the components
2. fetch the latest versions of all the components (you can pass targets like `--components o-typography,o-colors`
3. create `package.json` files for all the components
4. build the components
5. clean the `package.json`
6. publish to your local `npm` registry


## notes

you can pass `--components o-typography,o-table` to build only those components.

sinopia doesn't fall back to the npm registry by default for scoped packages, so
you might need to edit `$HOME/.config/sinopia/config.yaml` and add
`proxy: npmjs` to the `'@*/*':` section.


## todo

* run the obt tests on the node module version of a component
* write literally any tests for this code

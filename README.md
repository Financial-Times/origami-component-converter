# origami npm module maker

## usage

```sh
$ git clone git@github.com:chee/origami
$ cd origami
$ npm install
$ npm run-script build
$ node . -veryverbose
```

this will:

1. write a `.bowerrc` file to point at the origami bower registry
2. fetch the latest versions of all the components listed in the `bower.json`,
3. generate a `.lerna.json`
4. generate `package.json` files for all the components
5. link them up to one another
6. build them
7. run the `obt` tests

you can publish them modules with

```sh
$ npx lerna publish
```

NOTES

* currently not all the modules can be built
* the tests are not run yet
* the bundling will not work without using the fork of microbundle that exists
		only on the laptop of chee
* the entire `src` directory needs to be compiled to a `dist` directory too

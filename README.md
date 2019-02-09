# OCC
the **o**rigami **c**omponent **c**onverter

## usage

```sh
$ npm install --global occ
$ cd o-table
$ latest=$(git tag | sort -V | tail -1 | grep -Eo '\d+\.\d+\.\d+')
$ occ build --semver=$latest
```

this will:

1. create a `package.json` file for `o-table`
2. compile a commonjs `o-table`

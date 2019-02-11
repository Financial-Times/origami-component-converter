# OCC
the **o**rigami **c**omponent **c**onverter

## usage

```sh
$ cd o-table
$ latest_version=$(git tag | sort -V | tail -1 | grep -Eo '\d+\.\d+\.\d+')
$ npx occ $latest
```

this will:

1. create a `package.json` file for `o-table`
2. compile a commonjs `o-table`
3. yay

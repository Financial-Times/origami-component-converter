# OCC
the *o*rigami *c*omponent *c*onverter

## usage

```sh
$ npm install --global @chee/occ
$ occ create --component o-table --branch master --semver 7.0.6
```

this will:

1. create `~/tmp/origami` containing a `package.json` with babel deps for building the components
2. extract the `master` tarball to `~/tmp/origami/components/o-table`
3. create a `package.json` file for `o-table`
4. compile an es3 `o-table`
5. clean the `package.json`

## notes

if you are being rate-limited, [generate a github read token](https://github.com/settings/tokens)
and add it to your environment as `OCC_GITHUB_TOKEN`.

## todo
* write literally any tests for this code

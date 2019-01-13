// @flow
import yargs from 'yargs'
import createResolver from './create-resolver.js'
import * as fs from 'fs-extra'
import * as root from './root.js'

export let resolve = (...paths: string[]) => createResolver(yargs.argv.workingDirectory)(...paths)

export let copyPackageJson = async () => {
	let rootManifest = await fs.readJson(root.resolve('package.json'))
	rootManifest.name = '~nothing~'
	return fs.outputJson(resolve('package.json'), rootManifest)
}

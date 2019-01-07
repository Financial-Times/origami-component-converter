// @flow
import yargs from 'yargs'
import createResolver from './create-resolver.js'
import write from './write-object.js'
import read from './read-object.js'
import * as root from './root.js'

export let copyPackageJson = async () => {
	let rootManifest = await read(root.resolve('package.json'))
	rootManifest.name = Math.random().toString(36).slice(2)
	return write(yargs.argv.workingDirectory, 'package.json', rootManifest)
}

export let resolve = createResolver(yargs.argv.workingDirectory)

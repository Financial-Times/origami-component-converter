#!/usr/bin/env node
// @flow
import spawn from '../library/spawn.js'
import * as components from '../library/components.js'
import * as npm from '../library/npm.js'
import * as babel from '../library/babel.js'
import * as fs from 'fs-extra'
import * as github from '../library/github.js'
import type {
	Argv
} from 'yargs'
import chalk from 'chalk-animation'
import origamiComponentNames from '../library/component-names.js'
import * as workingDirectory from '../library/working-directory.js'

let parseComponentsArgument = (components: string | Array<string>): string[] =>
	Array.isArray(components)
		? components
		: components.split(/,/)

export let command = 'bootstrap'
export let describe = 'download, convert and publish all origami components'

export let options = {
	cleanFirst: {
		global: false,
		describe: 'delete old components/ directory',
		alias: 'c',
		default: false,
		type: 'boolean'
	},
	publish: {
		global: false,
		alias: 'p',
		describe: 'publish to npm registry',
		default: true,
		type: 'boolean'
	},
	unpublish: {
		global: false,
		alias: 'u',
		describe: 'remove from npm registry',
		default: false,
		type: 'boolean'
	},
	npmRegistry: {
		default: 'http://localhost:4873',
		type: 'string',
		describe: 'the npm registry to use'
	},
	components: {
		global: false,
		describe: 'the components to use',
		default: origamiComponentNames,
		coerce: parseComponentsArgument
	}
}

export let builder = (yargs: Argv) => yargs.options(options)

export let handler = async function ဪ (args: Argv) {
	args.components && components.setTargets(args.components)
	await workingDirectory.copyPackageJson()

	let registryArgument = npm.createRegistryArgument(args.npmRegistry)

	await spawn(`npm install ${registryArgument}`)
	args.cleanFirst && await fs.remove(components.resolve())
	await args.components.reduce(
		(promise, name) => promise.then(() => github.getLatestRelease(name)),
		Promise.resolve()
	)
	await components.sequence(npm.createAndWriteManifest)

	await components.sequence(component => babel.compile(component, args))
	await components.sequence(npm.cleanAndWriteManifest)
	args.test && await components.batch('obt t', undefined, 1)
	args.unpublish && await components.batch(`npm unpublish --force ${registryArgument}`)
	args.publish && await components.batch(`npm publish ${registryArgument}`)

	let hooray = chalk.rainbow('oh good')
	hooray.start()
	setTimeout(hooray.stop.bind(hooray), 2222)
}

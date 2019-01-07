#!/usr/bin/env node
// @flow
import spawn from '../library/spawn.js'
import * as components from '../library/components.js'
import * as npm from '../library/npm.js'
import * as root from '../library/root.js'
import * as babel from '../library/babel.js'
import read from '../library/read-object.js'
import write from '../library/write-object.js'
import * as fs from 'fs-extra'
import * as github from '../library/github.js'
import type {
	Argv
} from 'yargs'
import chalk from 'chalk-animation'
import unary from '../library/unary.js'
import convertOptions from '../library/convert-options.js'

export let command = ['convert', '$0']
export let desc = 'convert origami components to npm modules and publish'
export let builder = (yargs: Argv) => yargs.options(convertOptions).help()

let copyPackageJson = async () => {
	let rootManifest = await read(root.resolve('package.json'))
	rootManifest.name = Math.random().toString(36).slice(2)
	return write('package.json', rootManifest)
}

export let handler = async function ဪ (args: Argv) {
	if (args.workingDirectory) {
		await fs.mkdirp(args.workingDirectory)
		process.chdir(args.workingDirectory)
	}
	args.initialise && await copyPackageJson()

	let registryArgument = args.npmRegistry
		? `--registry=${String(args.npmRegistry)}`
		: ''


	let npmInstallCommand =
		[
			'npm install',
			'--no-package-lock',
			registryArgument
		].join(' ')

	args.initialise && await spawn(npmInstallCommand)
	args.fresh && await fs.remove(components.componentsDirectory)
	args.download && await components.targetEntries.reduce(
		(promise, [name, version]) => promise.then(() => version
			? github.getLatestRelease(name, version)
			: github.getLatestRelease(name)
		),
		Promise.resolve()
	)
	args.createManifests && await components.sequence(npm.createAndWriteManifest)
	args.npmInstall && await components.batch(npmInstallCommand, undefined, 2)
	args.createLinks && await components.batch('npm link')
	args.createLinks && await components.sequence(async name => {
		if (!name) return false

		let names = (
			await components.sort([name])
		)
			.map(unary(npm.createComponentName))
			.join(' ')

		return Boolean(names.length) &&
			`npm link ${names}`
	})
	args.build && await components.sequence(babel.compile)
	args.cleanManifests && await components.sequence(npm.cleanAndWriteManifest)
	args.test && await components.batch('obt t', undefined, 1)
	args.unpublish && await components.batch(`npm unpublish --force ${registryArgument}`)
	args.publish && await components.batch(`npm publish ${registryArgument}`)
	args.hokeyCokey && await components.batch('npm unpublish --force')

	let hooray = chalk.rainbow('oh good')
	hooray.start()
	setTimeout(hooray.stop.bind(hooray), 1000)
}

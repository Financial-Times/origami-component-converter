#!/usr/bin/env node
// @flow
require('dotenv').config()
import log from './library/log.js'
import spawn from './library/spawn.js'
import args from './library/args.js'
import * as components from './library/components.js'
import * as npm from './library/npm.js'
import * as root from './library/root.js'
import * as babel from './library/babel.js'
import read from './library/read-object.js'
import write from './library/write-object.js'
import * as fs from 'fs-extra'
import * as github from './library/github.js'

let copyPackageJson = async () => {
	let rootManifest = await read(root.resolve('package.json'))
	rootManifest.name = Math.random().toString(36).slice(2)
	return write('package.json', rootManifest)
}

void async function ဪ () {
	args.printComponents &&
		(log((await components.sort()).join('\n'), 0), process.exit())

	if (args.exec) {
		await components.batch(args.exec)
		process.exit(0)
	}

	args.initialise && await copyPackageJson()

	let registryArgument = args.npmRegistry
		? `--registry=${args.npmRegistry}`
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
			.map(npm.createComponentName)
			.join(' ')

		return Boolean(names.length) &&
			`npm link ${names}`
	})
	args.build && await components.sequence(babel.compile)
	args.cleanManifests && await components.sequence(npm.cleanAndWriteManifest)
	args.test && await components.batch('npx obt t', undefined, 1)
	args.unpublish && await components.batch(`npm unpublish --force ${registryArgument}`)
	args.publish && await components.batch(`npm publish ${registryArgument}`)
	args.hokeyCokey && await components.batch('npm unpublish --force')

	log('oh good'.rainbow, 0)
}().catch(error => {
	log(error, 0)
	process.exit(22)
})

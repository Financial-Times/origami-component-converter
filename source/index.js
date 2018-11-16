#!/usr/bin/env node
// @flow
import log from './library/log.js'
import spawn from './library/spawn.js'
import compose from './library/compose.js'
import args from './library/args.js'
import * as components from './library/components.js'
import * as npm from './library/npm.js'
import * as bower from './library/bower.js'
import * as bowerrc from './library/bowerrc.js'
import read from './library/read-object.js'
import write from './library/write-object.js'

let createAndWriteBowerrc = compose(
	bowerrc.write,
	// eslint-disable-next-line no-unused-vars
	_ => bowerrc.create()
)

let copy = async (from: string, to: string) => {
	return write(to, await read(from))
}

let copyPackageJson = async () => {
	let rootManifest = await read(root.resolve('package.json'))
	rootManifest.name = Math.random().toString(36).slice(2)
	return write('package.json', rootManifest)
}

void async function ဪ () {
	args.printComponents &&
		(log((await components.sort()).join('\n'), 0), process.exit())

	args.initialise && await copyPackageJson()
	args.initialise && await copy(
		root.resolve('npmrc'),
		'.npmrc'
	)
	args.initialise && await spawn('npm install --no-package-lock')
	await createAndWriteBowerrc()
	args.b && await spawn('bower install -F')
	args.n && await components.map(createAndWriteNpmManifest)
	args.i && await components.batch('npm install')
	args.l && await components.batch('npm link')
	args.l && await components.batch(name => {
		if (!name) return false

		let names = components
			.sort([name])
			.map(npm.createComponentName)
			.join(' ')

		return Boolean(names.length) &&
			`npm link ${names}`
	}, 1)
	args.m && await components.batch('npm run-script build')
	args.p && await components.batch('npm publish --access public')

	log('oh good', 0)
}().catch(error => {
	log(error, 0)
	process.exit(22)
})

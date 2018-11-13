// @flow
import log from './library/log.js'
import spawn from './library/spawn.js'
import compose from './library/compose.js'
import args from './library/args.js'
import * as components from './library/components.js'
import * as npm from './library/npm.js'
import * as bower from './library/bower.js'
import * as bowerrc from './library/bowerrc.js'

let createAndWriteBowerrc = compose(
	bowerrc.write,
	// eslint-disable-next-line no-unused-vars
	_ => bowerrc.create()
)

let createAndWriteNpmManifest = compose(
	npm.writeManifest,
	npm.createManifest,
	bower.getManifest
)

void async function ဪ () {
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

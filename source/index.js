// @flow
import log from './library/log.js'
import spawn from './library/spawn.js'
import compose from './library/compose.js'
import componentNames from './library/component-names'
import * as lerna from './library/lerna.js'
import * as npm from './library/npm.js'
import * as bower from './library/bower.js'
import * as bowerrc from './library/bowerrc.js'
import * as buble from './library/buble.js'

let createAndWriteBowerrc = compose(
	bowerrc.write,
	_ => bowerrc.create()
)

let createAndWriteLernaManifest = compose(
	lerna.writeManifest,
	lerna.createManifest
)

let createAndWriteNpmManifest = compose(
	npm.writeManifest,
	npm.createManifest,
	bower.getManifest
)

void async function ဪ () {
	await createAndWriteBowerrc()
	await spawn('bower install -F')
	await createAndWriteLernaManifest(bower.manifest)
	await Promise.all(componentNames.map(createAndWriteNpmManifest))
	await spawn('lerna bootstrap')
	await spawn('lerna run build')

	log('oh good', 0)
}().catch(error => {
	log(error, 0)
	process.exit(22)
})

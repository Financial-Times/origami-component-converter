// @flow
import type {
	LernaManifest,
	BowerManifest
} from '../types/manifest.types'

import * as components from './components.js'
import * as root from './root.js'
import write from './write-object.js'
import unary from './unary.js'
import {
	lerna as skeleton
} from './skeletons.js'

export let createManifest = (bowerManifest: BowerManifest): LernaManifest => {
	let {
		dependencies
	} = bowerManifest

	let packages = Object
		.keys(dependencies)
		.map(unary(components.resolve))

	return {
		...skeleton,
		packages
	}
}

export let writeManifest = (lernaManifest: LernaManifest): Promise<void> =>
	write(
		root.resolve('lerna.json'),
		lernaManifest
	)

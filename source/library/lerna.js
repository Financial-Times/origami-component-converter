// @flow
import type {
	LernaManifest,
	BowerManifest
} from '../types/manifest.types'

import {
	root,
	getComponentDirectory
} from './directories.js'

import write from './write-object.js'

import {
	lerna as skeleton
} from './skeletons.js'

export let createManifest = (bowerManifest: BowerManifest): LernaManifest => {
	let {
		dependencies
	} = bowerManifest

	let packages = Object
		.keys(dependencies)
		.map(getComponentDirectory)

	return {
		...skeleton,
		packages
	}
}

export let writeManifest = (lernaManifest: LernaManifest): Promise<void> =>
	write(
		root('lerna.json'),
		lernaManifest
	)

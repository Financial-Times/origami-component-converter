// @flow
import type {
	BowerManifest
} from '../types/manifest.types'

import checkFileIsAccessible from './check-file-is-accessible.js'
import read from './read-object.js'
import compose from './compose.js'
import * as components from './components.js'
import {
	keys,
	merge
} from './dictionary.js'

export let getAllDependencyNames = (manifest: BowerManifest): string[] =>
	keys(merge(
		manifest.devDependencies || {},
		manifest.dependencies
	))

export let getManifestPath = (componentName: string): string =>
	components.resolve(
		componentName,
		'bower.json'
	)

export let getManifest: (string => Promise<BowerManifest>) =
	compose(
		read,
		getManifestPath
	)

export let checkHasManifest: (string => Promise<boolean>) =
	compose(
		checkFileIsAccessible,
		getManifestPath
	)

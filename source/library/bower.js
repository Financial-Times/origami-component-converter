// @flow
import type {
	BowerManifest
} from '../types/manifest.types'

import importJson from './import-json.js'
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
		'.bower.json'
	)

export let getManifest: (string => BowerManifest) =
	compose(
		importJson,
		getManifestPath
	)

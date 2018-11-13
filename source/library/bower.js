// @flow
import type {
	BowerManifest
} from '../types/manifest.types'

import importJson from './import-json.js'
import * as components from './components.js'

export let manifest: BowerManifest = importJson('bower.json')

export let componentNames: string[] = Object.keys(manifest.dependencies)

export let getManifestPath = (componentName: string): string =>
	components.resolve(
		componentName,
		'.bower.json'
	)

export let getManifest = (componentName: string): BowerManifest =>
	importJson(getManifestPath(componentName))

// @flow
import type {
	BowerManifest,
	Bowerrc
} from '../types/manifest.types'

import type {
	Settings
} from '../types/settings.types'

import {
	root,
	getComponentDirectory
} from './directories.js'

import path from 'path'
import importJson from './import-json.js'
import write from './write-object.js'

export let manifest: BowerManifest = importJson('bower.json')

export let componentNames: string[] = Object.keys(manifest.dependencies)

export let getManifestPath = (componentName: string): string =>
	path.resolve(
		getComponentDirectory(componentName),
		'.bower.json'
	)

export let getManifest = (componentName: string): BowerManifest =>
	importJson(getManifestPath(componentName))

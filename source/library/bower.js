// @flow
import type {
	BowerManifest
} from '../types/manifest.types'

import {
	getComponentDirectory
} from './directories.js'

import path from 'path'
import importJson from './import-json.js'

export let manifest: BowerManifest = importJson('bower.json')

export let componentNames: string[] = Object.keys(manifest.dependencies)

export let getManifestPath = (componentName: string): string =>
	path.resolve(
		getComponentDirectory(componentName),
		'.bower.json'
	)

export let getManifest = (componentName: string): BowerManifest =>
	importJson(getManifestPath(componentName))

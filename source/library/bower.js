// @flow
import type {
	BowerManifest
} from '../types/manifest.types'

import BowerRegistryClient from 'bower-registry-client'
import checkFileIsAccessible from './check-file-is-accessible.js'
import read from './read-object.js'
import compose from './compose.js'
import * as components from './components.js'
import {
	keys,
	merge
} from './dictionary.js'
import * as bowerrc from './bowerrc.js'

let registry = new BowerRegistryClient(bowerrc.create())

export let getUri = (componentName: string): Promise<string> =>
	new Promise((yay, nay) => {
		registry.lookup(componentName, (error, {url}) =>
			error
				? nay(error)
				: yay(url)
		)
	})

export let getUris = (componentNames: string[]): Promise<string[]> =>
	Promise.all(componentNames.map(getUri))

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

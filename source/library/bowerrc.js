// @flow
import type {
	BowerManifest,
	Bowerrc
} from '../types/manifest.types'

import settings, {
	type Settings
} from './settings.js'

import {
	root
} from './directories.js'

import path from 'path'
import importJson from './import-json.js'
import writeObject from './write-object.js'

export let create = (): Bowerrc => {
	let {
		componentsDirectory: directory,
		registries: search
	} = settings

	return {
		directory,
		registries: {search}
	}
}

export let write = (bowerrc: Bowerrc): Promise<void> =>
	writeObject(
		root('.bowerrc'),
		bowerrc
	)

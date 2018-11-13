// @flow
import type {
	Bowerrc
} from '../types/manifest.types'

import settings from './settings.js'

import * as root from './root.js'

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
		root.resolve('.bowerrc'),
		bowerrc
	)

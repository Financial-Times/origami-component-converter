// @flow
import type {
	Bowerrc
} from '../types/manifest.types'

import settings from './settings.js'

import write from './write-object.js'

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

let writeBowerrc = (bowerrc: Bowerrc): Promise<void> =>
	write(
		'.bowerrc',
		bowerrc
	)

export {writeBowerrc as write}

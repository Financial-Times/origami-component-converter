// @flow
import type {
	Bowerrc
} from '../types/manifest.types'

import settings from './settings.js'

import write from './write-object.js'

export let create = (): Bowerrc => {
	let {
		componentsDirectory: directory,
		bowerRegistries: search
	} = settings

	return {
		directory,
		registry: {search},
		ca: {
			search: []
		},
		cache: '/tmp'
	}
}

let writeBowerrc = (bowerrc: Bowerrc): Promise<void> =>
	write(
		'.bowerrc',
		bowerrc
	)

export {writeBowerrc as write}

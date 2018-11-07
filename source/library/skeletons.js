// @flow
import type {
	NpmManifest,
	LernaManifest
} from '../types/manifest.types'

import importJson from './import-json.js'

let npm: NpmManifest = importJson('skeletons/package.json')
let lerna: LernaManifest = importJson('skeletons/lerna.json')

export {
	npm,
	lerna
}

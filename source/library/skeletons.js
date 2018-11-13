// @flow
import type {
	NpmManifest
} from '../types/manifest.types'

import importJson from './import-json.js'

let npm: NpmManifest = importJson('skeletons/package.json')

export {
	npm
}

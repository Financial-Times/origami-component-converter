// @flow
import type {
	NpmManifest
} from '../types/manifest.types'

import importJson from './import-json.js'

export let componentManifest: NpmManifest = importJson('skeletons/component/package.json')
export let builderManifest: NpmManifest = importJson('skeletons/builder/package.json')

// @flow
import type {
	Dictionary
} from './dictionary.js'

import importJson from './import-json.js'

let mappings: Dictionary = importJson('mappings.json')

export default mappings

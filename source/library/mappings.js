// @flow
import type {
	Dictionary
} from '../types/dictionary.types'

import importJson from './import-json.js'

let mappings: Dictionary = importJson('mappings.json')

export default mappings

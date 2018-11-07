// @flow
import type {
	Settings
} from '../types/settings.types'

import importJson from './import-json.js'

let settings: Settings = importJson('settings.json')

export type {Settings}

export default settings

// @flow

import importJson from './import-json'
import * as root from './root'

export default importJson(root.resolve('bower.json'))

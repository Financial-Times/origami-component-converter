// @flow
import {promises as fs} from 'fs'
import stringify from './stringify.js'

export default (path: string, object: any): Promise<void> =>
	fs.writeFile(path, stringify(object))

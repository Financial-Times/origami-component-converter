// @flow
import * as fs from 'fs-extra'
import stringify from './stringify.js'

export default (filename: string, object: any): Promise<void> =>
	fs.outputFile(
		filename,
		stringify(object)
	)

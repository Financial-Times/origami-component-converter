// @flow
import * as fs from 'fs-extra'
import stringify from './stringify.js'
import path from 'path'
import args from './args.js'

export default (filename: string, object: any): Promise<void> =>
	fs.outputFile(
		path.resolve(args.workingDirectory, filename),
		stringify(object)
	)

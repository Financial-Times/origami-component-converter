// @flow
import {promises as fs} from 'fs'
import stringify from './stringify.js'
import path from 'path'
import args from './args.js'

export default (filename: string, object: any): Promise<void> =>
	fs.writeFile(
		path.resolve(args.workingDirectory, filename),
		stringify(object)
	)

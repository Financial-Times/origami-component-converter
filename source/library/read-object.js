// @flow
import {promises as fs} from 'fs'

import compose from './compose.js'
import path from 'path'
import args from './args.js'

let parse = async (json: Promise<string>): Promise<any> =>
	JSON.parse(await json)

let read = async (filename: string): Promise<string> =>
	(await fs.readFile(
		path.resolve(args.workingDirectory, filename),
		{encoding: 'utf-8'}
	)).toString()

let readObject: (string => Promise<any>) =
	compose(parse, read)

export default readObject

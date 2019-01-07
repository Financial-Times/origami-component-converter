// @flow
import * as fs from 'fs-extra'

import compose from './compose.js'
import * as workingDirectory from './working-directory.js'

let parse = async (json: Promise<string>): Promise<any> =>
	JSON.parse(await json)

let read = async (filename: string): Promise<string> =>
	(await fs.readFile(
		workingDirectory.resolve(filename),
		{encoding: 'utf-8'}
	)).toString()

let readObject: (string => Promise<any>) =
	compose(parse, read)

export default readObject

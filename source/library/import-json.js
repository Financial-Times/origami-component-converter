// @flow
import {
	readFileSync
} from 'fs'

import root from './root.js'

import compose from './compose.js'

let parse = (json: string): any =>
	JSON.parse(json)

let encoding = 'utf-8'

let read = (filename: string): string =>
	readFileSync(
		root(filename),
		{encoding}
	)

export default (compose(parse, read): any)

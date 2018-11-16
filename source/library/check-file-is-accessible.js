// @flow

import {
	promises as fs,
	constants
} from 'fs'

export default async (path: string): Promise<boolean> =>
	fs
		.access(path, constants.W_OK | constants.R_OK)
		.then(() => true)
		.catch(() => false)

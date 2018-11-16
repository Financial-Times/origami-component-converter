// @flow

import {access} from 'fs-extra'
import {constants} from 'fs'

export default (path: string): Promise<boolean> =>
	access(
		path,
		constants.W_OK | constants.R_OK
	)
		.then(() => true)
		.catch(() => false)

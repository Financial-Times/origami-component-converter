// @flow
import path from 'path'

export let resolve = (filename?: string, ...filenames?: string[]): string => {
	let root = path.resolve(
		__dirname,
		'..',
		'..'
	)

	if (filename) {
		return path.resolve(
			root,
			filename,
			...filenames || []
		)
	}

	return root
}

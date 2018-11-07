// @flow
import path from 'path'

export default (filename?: string): string => {
	let root = path.resolve(
		__dirname,
		'..',
		'..'
	)

	if (filename) {
		return path.resolve(root, filename)
	}

	return root
}

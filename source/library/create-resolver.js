// @flow
import path from 'path'

export default (root: string) => (filename?: string, ...filenames?: string[]): string => {
	if (filename) {
		return path.resolve(
			root,
			filename,
			...filenames || []
		)
	}

	return root
}

import path from "path"

export default root => (filename, ...filenames) => {
	if (filename) {
		return path.resolve(root, filename, ...(filenames || []))
	}

	return root
}

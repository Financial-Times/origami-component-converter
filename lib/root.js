import path from "path"

let root = path.resolve(__dirname, "..")

export let resolve = (...paths) =>
	path.resolve(root, ...paths)

export default root

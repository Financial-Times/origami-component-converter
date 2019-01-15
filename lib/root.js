import path from "path"
import createResolver from "./create-resolver.js"

let root = path.resolve(__dirname, "..")

export let resolve = createResolver(root)
export default root

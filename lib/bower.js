import fs from "fs-extra"
import read from "./read-object.js"
import compose from "./compose.js"
import * as components from "./components.js"
import merge from "just-merge"

/**
 * get all dependency & devDependency names
 * @param {{dependencies: Object.<string, string>, devDependencies: Object.<string, string>}} manifest a bower manifest
 * @returns {string[]} dependency names
 */
export let getAllDependencyNames = manifest =>
	Object.keys(merge(manifest.devDependencies || {}, manifest.dependencies))

export let getManifestPath = componentName =>
	components.resolve(componentName, "bower.json")

export let getManifest = compose(
	read,
	getManifestPath
)

export let checkHasManifest = compose(
	fs.pathExists,
	getManifestPath
)

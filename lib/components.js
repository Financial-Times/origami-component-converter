import * as fs from "fs-extra"
import toposort from "toposort"
import * as workingDirectory from "./working-directory.js"
import spawn from "./spawn.js"
import * as bower from "./bower.js"
let origamiComponentNames = require("../config/components.json")

/**
 * @typedef {string[]} Names
 * @type {{targets: Names, all: Names, origami: Names}}
 */
export let names = {
	targets: origamiComponentNames,
	origami: origamiComponentNames,
	all: origamiComponentNames
}

/**
 * Set the targets used by the other components functions
 * @param {Names} componentNames the components to set as targets
 * @returns {Names} targets as passed in
 */
export let setTargets = componentNames => {
	names.targets = componentNames
	names.all = Array.from(new Set([...names.targets, ...names.origami]))
	return componentNames
}

/**
 * Check if a component is a current target or origami component
 * @param {string} componentName The component's name
 * @returns {boolean} Whether or not the given component is a current target or
 * origami component
 */
export let includes = componentName => names.all.includes(componentName)

/**
 * Resolve a component's directory within in the components
 * Returns the root component directory if it gets no args
 * @param {string} [componentName] The name of the component
 * @param {...string} files path chunks to resolve in that component's directory
 * @returns {string} a complete path
 */
export let resolve = (componentName, ...files) =>
	componentName
		? workingDirectory.resolve("components", componentName, ...files)
		: workingDirectory.resolve("components")


export async function map (fn, componentNames) {
	componentNames = componentNames || await sort()
	let perform = name => fn(name)
	return Promise.all(componentNames.map(perform))
}

export async function sequence (task, componentNames) {
	componentNames = componentNames || await sort()

	let perform = (promise, name) =>
		promise.then(() =>
			typeof task === "function"
				? task(name)
				: spawn(task, {cwd: resolve(name)})
		)

	return componentNames.reduce(perform, Promise.resolve())
}

export let sort = async (componentNames = names.targets) => {
	let manifests = await Promise.all(componentNames.map(bower.getManifest))
	let graph = manifests.reduce(
		(graph, manifest) =>
			graph.concat(
				bower
					.getAllDependencyNames(manifest)
					.filter(name => names.all.includes(name))
					.map(dependencyName => [
						manifest.name,
						dependencyName
					])
	), [])

	return toposort.array(names.all, graph).reverse()
}

export let getVersionFilePath = componentName =>
	resolve(componentName, "version")

export let getVersion = async componentName => {
	let versionFilePath = getVersionFilePath(componentName)
	let exists = await fs.pathExists(versionFilePath)

	if (exists) {
		return fs.readFile(versionFilePath, "utf-8")
	}

	return null
}

import * as fs from "fs-extra"
import toposort from "toposort"
import * as workingDirectory from "./working-directory.js"
import spawn from "./spawn.js"
import * as bower from "./bower.js"
import splitEvery from "./split-every.js"
import origamiComponentNames from "./component-names.js"
import checkFileIsAccessible from "./check-file-is-accessible.js"

/**
 * @typedef {string[]} Names
 */

/**
 * @typedef {{targets: Names, all: Names, origami: Names}} NameCollection
 */

/**
 * @type NameCollection
 */
export let names = {
	targets: origamiComponentNames,
	origami: origamiComponentNames,
	all: origamiComponentNames
}

/**
 * Set the targets used by the other components functions
 * @param {Names} componentNames
 */
export let setTargets = componentNames => {
	names.targets = componentNames
	names.all = Array.from(new Set([...names.targets, ...componentNames]))
}

/**
 * Set the targets used by the other components functions
 * @param {string} componentName
 * @returns {boolean}
 */
export let includes = componentName => names.all.includes(componentName)

/**
 * Resolve a component's directory within in the components
 * @param {string} [componentName]
 * @param {...string} files
 * @returns {string}
 */
export let resolve = (componentName, ...files) =>
	componentName
		? workingDirectory.resolve("components", componentName, ...files)
		: workingDirectory.resolve("components")

export async function batch(command, componentNames, batchSize = 8) {
	componentNames = componentNames || (await sort())
	let getCommand = name =>
		typeof command == "function" ? command(name) : command

	let batches = splitEvery(batchSize, componentNames)

	return batches.reduce(
		(promise, batch) =>
			promise.then(() =>
				map(name => {
					let command = getCommand(name)
					let cwd = resolve(name)
					return command !== false && spawn(command, {cwd})
				}, batch)
			),
		Promise.resolve()
	)
}

export let sort = async (componentNames = names.targets) => {
	let manifests = await Promise.all(componentNames.map(bower.getManifest))
	let graph = manifests.reduce(
		(graph, component) =>
			graph.concat(
				bower
					.getAllDependencyNames(component)
					.filter(name => names.targets.includes(name))
					.map(dependencyName => [dependencyName, component.name])
			),
		[]
	)

	return Array.from(new Set([...toposort(graph), ...names.targets]))
}

export let getVersionFilePath = componentName =>
	resolve(componentName, "version")

export let getVersion = async componentName => {
	let versionFilePath = getVersionFilePath(componentName)
	let exists = await checkFileIsAccessible(versionFilePath)

	if (exists) {
		return fs.readFile(versionFilePath, "utf-8")
	}

	return null
}

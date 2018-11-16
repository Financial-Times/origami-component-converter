// @flow

import settings from './settings.js'
import spawn from './spawn.js'
import compose from './compose.js'
import args from './args.js'
import * as bower from './bower.js'
import toposort from 'toposort'
import unary from './unary.js'
import splitEvery from './split-every.js'
import path from 'path'
import componentNames from './component-names.js'
import * as workingDirectory from './working-directory.js'

export let targetNames: string[] = args.components

type Names = {
	targets: string[],
	all: string[],
	origami: string[]
}

export let names: Names = {
	targets: args.components,
	origami: componentNames,
	all: Array.from(new Set([...targetNames, ...componentNames]))
}

export let includes = (componentName: string): boolean =>
	names.all.includes(componentName)

export let componentsDirectory = workingDirectory.resolve(
	settings.componentsDirectory
)

export let resolve = (componentName: string, ...files?: string[]): string =>
	path.resolve(
		componentsDirectory,
		componentName,
		...files || []
	)

export async function map (fn: string => any, componentNames?: string[]): Promise<void | any> {
	componentNames = componentNames || await sort()
	let perform = name => fn(name)
	return Promise.all(componentNames.map(perform))
}

export async function sequence (fn: string => any, componentNames?: string[]): Promise<void | any> {
	componentNames = componentNames || await sort()
	let perform = (promise: Promise<void>, name) =>
		promise.then(() => fn(name))

	return componentNames.reduce(perform, Promise.resolve())
}

export async function mapDirectories (fn: string => any, componentNames?: string[]): Promise<void | any> {
	componentNames = componentNames || await sort()
	let perform = compose(fn, unary(resolve))
	return Promise.all(componentNames.map(perform))
}

export async function batch (command: string | ?string => string | false, componentNames?: string[], batchSize?: number = 8): Promise<void | any> {
	componentNames = componentNames || await sort()
	let getCommand = (name?: string) =>
		typeof command == 'function'
			? command(name)
			: command

	let batches = splitEvery(batchSize, componentNames)

	return batches.reduce((promise: Promise<void | any>, batch) =>
		promise.then(() =>
			map(name => {
				let command = getCommand(name)
				let cwd = resolve(name)
				return command !== false && spawn(command, {cwd})
			}, batch)
		), Promise.resolve()
	)
}

export let sort = async (componentNames?: string[] = names.targets): Promise<string[]> => {
	let manifests = await Promise.all(componentNames.map(bower.getManifest))
	let graph = manifests.reduce((graph, component) =>
		graph.concat(
			bower.getAllDependencyNames(component)
				.filter(name => names.targets.includes(name))
				.map(dependencyName => [dependencyName, component.name])
		), []
	)

	return Array.from(new Set([
		...toposort(graph),
		...names.targets
	]))
}

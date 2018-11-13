// @flow

import settings from './settings.js'
import spawn from './spawn.js'
import compose from './compose.js'
import rootManifest from './root-manifest.js'
import * as root from './root.js'
import * as bower from './bower.js'
import toposort from 'toposort'
import {keys} from './dictionary.js'
import unary from './unary.js'
import splitEvery from './split-every.js'

export let names: string[] = keys(rootManifest.dependencies)

export let componentsDirectory = root.resolve(settings.componentsDirectory)

export let resolve = (componentName: string, ...files?: string[]): string => {
	return root.resolve(
		componentsDirectory,
		componentName,
		...files || []
	)
}

export function map (fn: string => any, componentNames: string[] = sort()): Promise<void | any> {
	let perform = name => unary(fn)(name)
	return Promise.all(componentNames.map(perform))
}

export function mapDirectories (fn: string => any, componentNames: string[] = sort()): Promise<void | any> {
	let perform = compose(fn, unary(resolve))
	return Promise.all(componentNames.map(perform))
}

export function batch (command: string | ?string => string | false, componentNames?: string[] = sort(), batchSize?: number = 8): Promise<void | any> {
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

export let sort = (componentNames?: string[] = names): string[] =>
	toposort(componentNames.reduce((graph, componentName) =>
		graph.concat(
			bower.getAllDependencyNames(bower.getManifest(componentName))
				.filter(componentName => names.includes(componentName))
				.map(dependencyName => [dependencyName, componentName])
		), []
	))

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

export function spawnEach (command: string): Promise<void | any> {
	return mapDirectories(cwd => spawn(command, {cwd}))
}

export let sort = (componentNames?: string[] = names): string[] =>
	toposort(componentNames.reduce((graph, componentName) =>
		graph.concat(
			bower.getAllDependencyNames(bower.getManifest(componentName))
				.filter(componentName => names.includes(componentName))
				.map(dependencyName => [dependencyName, componentName])
		), []
	))

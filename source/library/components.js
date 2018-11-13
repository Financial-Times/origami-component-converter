// @flow

import settings from './settings.js'
import spawn from './spawn.js'
import compose from './compose.js'
import rootManifest from './root-manifest.js'
import * as root from './root.js'

export let names: string[] = Object.keys(rootManifest.dependencies)

export let componentsDirectory = root.resolve(settings.componentsDirectory)

export let resolve = (componentName: string, ...files?: string[]): string => {
	return root.resolve(
		componentsDirectory,
		componentName,
		...files || []
	)
}

export function map (fn: string => any): Promise<void | any> {
	let perform = name => fn(name)
	return Promise.all(names.map(perform))
}

export function mapDirectories (fn: string => any): Promise<void | any> {
	let perform = compose(fn, resolve)
	return Promise.all(names.map(perform))
}

export function spawnEach (command: string): Promise<void | any> {
	return mapDirectories(cwd => spawn(command, {cwd}))
}

export function sort () {
	return names
}

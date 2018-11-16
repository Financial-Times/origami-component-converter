// @flow
import type {
	NpmManifest,
	BowerManifest
} from '../types/manifest.types'

import type {
	Dependency
} from '../types/dependency.types'

import {existsSync} from 'fs'
import libnpm from 'libnpm'
import semver from 'semver'
import hashVersionRegex from './hash-version-regex.js'
import importJson from './import-json.js'
import write from './write-object.js'
import settings from './settings.js'
import * as components from './components.js'
import mappings from './mappings.js'
import log from './log.js'
import * as bower from './bower.js'
import * as babel from './babel.js'
import {
	entries,
	keys,
	merge,
	type Dictionary
} from './dictionary.js'
import {npm as skeleton} from './skeletons.js'
import compose from './compose.js'

export let getManifestPath = (componentName: string): string =>
	components.resolve(componentName, 'package.json')

export let checkHasManifest: (string => boolean) =
	compose(
		existsSync,
		getManifestPath
	)

export let getManifest: (string => NpmManifest) =
	compose(
		importJson,
		getManifestPath
	)

export let mergeManifests = (existing: NpmManifest, generated: NpmManifest) => {
	let dependencies = merge(existing.dependencies || {}, generated.dependencies || {})
	// let devDependencies = merge(existing.devDependencies || {}, generated.devDependencies || {})
	let scripts = merge(existing.scripts || {}, generated.scripts || {})

	return {
		...generated,
		scripts,
		dependencies,
		// devDependencies
	}
}

export let getAllDependencyNames = (manifest: NpmManifest): string[] =>
	keys(merge(
		manifest.optionalDependencies || {},
		manifest.peerDependencies || {},
		manifest.devDependencies || {},
		manifest.dependencies
	))

export let createComponentName = (componentName: string): string =>
	`@${settings.organisation}/${componentName}`

export let createDependencyName = (name: string): string => {
	let isOrigamiComponent = components.names.includes(name)

	if (isOrigamiComponent) {
		return createComponentName(name)
	}

	let mapping = mappings[name]

	if (mapping) {
		return mapping
	}

	return name
}

export let createDependencyVersion = ([name, version]: Dependency): string => {
	if (components.names.includes(name)) {
		return 'latest'
	}

	// if it is a valid semver range, use that
	let validRange = semver.validRange(version)

	if (validRange) {
		return version
	}

	// or, if there is a hash location in the version
	let hashMatch = hashVersionRegex.exec(version)

	if (hashMatch) {
		let [, hash] = hashMatch

		// and it's a valid semver range, use that
		let validHashRange = semver.validRange(hash)

		if (validHashRange) {
			return hash
		}
	}

	// or, try getting the version bower resolved to
	let bowerVersion = bower.getManifest(name).version

	if (bowerVersion) {
		return bowerVersion
	}

	// or, if there's a package json there, use that version
	let packageJsonVersion = getManifest(name).version

	if (packageJsonVersion) {
		return packageJsonVersion
	}

	// or die
	throw Error(
		`oh no, i couldn't turn ${name}'s '${version} into a suitable npm version`
	)
}

let stringifyDependency = ([name, version]: Dependency): string => {
	return JSON.stringify({[name]: version})
}

let logChange = (one: Dependency, two: Dependency): string =>
	log(
		`${stringifyDependency(one)} -> ${stringifyDependency(two)}`,
		2
	)

export let createDependency = ([name, version]: Dependency): Dependency => {
	let npmName = createDependencyName(name)
	let npmVersion = createDependencyVersion([name, version])

	logChange([name, version], [npmName, npmVersion])

	return [
		npmName,
		npmVersion
	]
}

export let createDependencies = (dependencies: Dependency[]) =>
	dependencies.reduce((dependencies: Dictionary, dependency: Dependency) => {
		let [
			name,
			version
		] = createDependency(dependency)

		dependencies[name] = version

		return dependencies
	}, {})

let createAliases = (dependencies: Dictionary): Dictionary => {
	let dependencyNames = keys(dependencies || {})

	return components.names.reduce((aliases, componentName) => {
		if (dependencyNames.includes(componentName)) {
			aliases[componentName] = createComponentName(componentName)
		}

		return aliases
	}, {...mappings})
}

export let createManifest = (bowerManifest: BowerManifest): NpmManifest => {
	let {
		name,
		version,
		description,
		homepage,
		license
	} = bowerManifest

	let dependencies: Dictionary = bowerManifest.dependencies

	let npmName = createComponentName(name)
	let npmDependencies = dependencies &&
		createDependencies(entries(dependencies))

	log(`created ${name} as ${npmName}`)

	return {
		...skeleton,
		name: npmName,
		version: `${version}${settings.prerelease}`,
		description,
		homepage,
		dependencies: npmDependencies,
		component: name,
		babel: babel.createConfiguration({
			aliases: createAliases(dependencies)
		}),
		license
	}
}

export let mergeManifestWithExistingManifest = (manifest: NpmManifest): NpmManifest =>
	checkHasManifest(manifest.component)
		? mergeManifests(getManifest(manifest.component), manifest)
		: manifest

export let writeManifest = (manifest: NpmManifest): Promise<void> =>
	write(
		getManifestPath(manifest.component),
		manifest
	)
let logProxy = new Proxy({}, {get: () => log})

export let run = async (componentName: string, scriptName: string): Promise<void> => {
	return libnpm.runScript(
		await getLibnpmStyleManifest(componentName),
		scriptName,
		components.resolve(componentName),
		{
			log: logProxy,
			unsafePerm: true,
			dir: path.resolve('node_modules'),
			config: {}
		}
	)
}

export let build = (componentName: string) =>
	run(componentName, 'build-component')

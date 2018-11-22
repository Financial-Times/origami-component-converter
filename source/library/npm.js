// @flow
import type {
	NpmManifest,
	BowerManifest
} from '../types/manifest.types'

import type {
	Dependency
} from '../types/dependency.types'

import libnpm from 'libnpm'
import semver from 'semver'
import hashVersionRegex from './hash-version-regex.js'
import read from './read-object.js'
import write from './write-object.js'
import args from './args.js'
import * as components from './components.js'
import mappings from './mappings.js'
import log from './log.js'
import * as bower from './bower.js'
import * as babel from './babel.js'
import path from 'path'
import {
	entries,
	keys,
	merge,
	type Dictionary
} from './dictionary.js'
import {npm as skeleton} from './skeletons.js'
import compose from './compose.js'
import checkFileIsAccessible from './check-file-is-accessible.js'

export let getManifestPath = (componentName: string): string =>
	components.resolve(
		componentName,
		'package.json'
	)

export let checkHasManifest: (string => Promise<boolean>) =
	compose(
		checkFileIsAccessible,
		getManifestPath
	)

export let getManifest: (string => Promise<NpmManifest>) =
	compose(
		read,
		getManifestPath
	)

export let getLibnpmStyleManifest: (string => Promise<NpmManifest>) =
	compose(
		libnpm.readJSON,
		getManifestPath
	)

export let mergeManifests = (existing: NpmManifest, generated: NpmManifest) => {
	let dependencies = merge(existing.dependencies || {}, generated.dependencies || {})
	let devDependencies = merge(existing.devDependencies || {}, generated.devDependencies || {})
	let scripts = merge(existing.scripts || {}, generated.scripts || {})

	return {
		...generated,
		scripts,
		dependencies,
		devDependencies
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
	`@${args.npmOrganisation}/${componentName}`

export let createDependencyName = (name: string): string => {
	if (components.includes(name)) {
		return createComponentName(name)
	}

	let mapping = mappings.name[name]

	if (mapping) {
		return mapping
	}

	return name
}

export let createDependencyVersion = async ([name, version]: Dependency): Promise<string> => {
	// if there is a mapping, use that
	let mappingVersion = mappings.version[version]

	if (mappingVersion) {
		return mappingVersion
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
	let bowerVersion = (await bower.checkHasManifest(name)) &&
		(await bower.getManifest(name)).version

	if (bowerVersion) {
		return bowerVersion
	}

	// or, if there's a package json there, use that version
	let packageJsonVersion = (await checkHasManifest(name)) &&
		(await getManifest(name)).version

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

export let createDependency = async ([name, version]: Dependency): Promise<Dependency> => {
	let npmName = await createDependencyName(name)
	let npmVersion = await createDependencyVersion([name, version])

	logChange([name, version], [npmName, npmVersion])

	return [
		npmName,
		npmVersion
	]
}

export let createDependencies = async (bowerDependencies: Dependency[]): Promise<Dictionary> => {
	let npmDependencies = await Promise.all(bowerDependencies.map(createDependency))

	return npmDependencies.reduce((dependencies, dependency: Dependency) => {
		let [
			name,
			version
		] = dependency

		dependencies[name] = version
		return dependencies
	}, {})
}

let createAliases = (dependencies: Dictionary): Dictionary => {
	let dependencyNames = keys(dependencies || {})

	return components.names.all.reduce((aliases, componentName) => {
		if (dependencyNames.includes(componentName)) {
			aliases[componentName] = createComponentName(componentName)
		}

		return aliases
	}, {...mappings.name})
}

export let createManifest = async (bowerManifest: BowerManifest): Promise<NpmManifest> => {
	let {
		name,
		version: bowerVersion,
		description,
		homepage,
		license
	} = bowerManifest

	let version = (await components.getVersion(name)) || bowerVersion

	let dependencies: Dictionary = bowerManifest.dependencies

	let npmName = createComponentName(name)
	let npmDependencies = dependencies &&
		await createDependencies(entries(dependencies))

	log(`creating ${name}@${version} as ${npmName}@${version}`)

	return {
		...skeleton,
		name: npmName,
		version,
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

export let mergeManifestWithExistingManifest = async (manifestPromise: Promise<NpmManifest>): Promise<NpmManifest> => {
	let manifest = await manifestPromise
	let hasManifest = await checkHasManifest(manifest.component)

	if (!hasManifest) {
		return manifest
	}

	let existingManifest = await getManifest(manifest.component)
	return mergeManifests(existingManifest, manifest)
}

export let writeManifest = async (manifestPromise: Promise<NpmManifest> | NpmManifest, path?: string): Promise<void> => {
	let manifest = await manifestPromise

	path = path || getManifestPath(manifest.component)

	return write(
		path,
		manifest
	)
}

export let cleanManifest = async (manifestPromise: Promise<NpmManifest>): Promise<NpmManifest> => {
	let manifest = {...await manifestPromise}

	manifest.babel && delete manifest.babel
	manifest.browserslist && delete manifest.browserlist

	return manifest
}

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

export let createAndWriteManifest = async (componentName: string): Promise<void> => {
	let bowerManifest = await bower.getManifest(componentName)

	return compose(
		writeManifest,
		mergeManifestWithExistingManifest,
		createManifest
	)(bowerManifest)
}

export let cleanAndWriteManifest: (string => Promise<void>) = compose(
	writeManifest,
	cleanManifest,
	getManifest
)

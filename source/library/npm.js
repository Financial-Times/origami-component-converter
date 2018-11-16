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
import packlist from 'npm-packlist'
import tar from 'tar'
import hashVersionRegex from './hash-version-regex.js'
import read from './read-object.js'
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
	`@${settings.organisation}/${componentName}`

export let createDependencyName = (name: string): string => {
	if (components.includes(name)) {
		return createComponentName(name)
	}

	let mapping = mappings[name]

	if (mapping) {
		return mapping
	}

	return name
}

export let createDependencyVersion = async ([name, version]: Dependency): Promise<string> => {
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
export let pack = async (componentName: string): Promise<stream$Readable> => {
	let componentPath = components.resolve(componentName)
	let files = await packlist({path: componentPath})

	log(`${componentName} gets ${files.join()}`, 1)

	return tar.create({
		cwd: componentPath,
		gzip: true
	}, files)
}

export let publish = async (componentName: string): Promise<any> => {
	let token = process.env.NPM_TOKEN

	return libnpm.publish(
		await getManifest(componentName),
		await pack(componentName),
		{
			npmVersion: 'chee-rabbits-o@0.0.0',
			token,
			access: 'public'
		}
	)
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

import * as semver from "semver"
import hashVersionRegex from "./hash-version-regex.js"
import write from "./write-object.js"
import * as components from "./components.js"
import log from "./log.js"
import * as bower from "./bower.js"
import * as babel from "./babel.js"
import merge from "just-merge"
let {entries, keys} = Object
import {componentManifest as skeleton} from "./skeletons.js"
import compose from "compose-tiny"
import * as fs from "fs-extra"
import chalk from "chalk"
import * as root from "./root.js"
let settings = fs.readJsonSync(root.resolve("config/settings.json"))
let mappings = fs.readJsonSync(root.resolve("config/mappings.json"))

export let getManifestPath = componentName =>
	components.resolve(componentName, "package.json")

export let checkHasManifest = compose(
	fs.pathExists,
	getManifestPath
)

export let getManifest = compose(
	fs.readJson,
	getManifestPath
)

export let mergeManifests = (existing, generated) => {
	let dependencies = merge(
		existing.dependencies || {},
		generated.dependencies || {}
	)
	let devDependencies = merge(
		existing.devDependencies || {},
		generated.devDependencies || {}
	)
	let scripts = merge(existing.scripts || {}, generated.scripts || {})
	let {main} = existing

	let result = {
		...generated,
		scripts,
		dependencies,
		devDependencies
	}

	main && (result.main = main)

	return result
}

export let createComponentName = (
	componentName,
	npmOrganisation = settings.npmOrganisation
) => `@${npmOrganisation}/${componentName}`

export let createDependencyName = name => {
	if (components.includes(name)) {
		return createComponentName(name)
	}

	let mapping = mappings.name[name]

	if (mapping) {
		return mapping
	}

	return name
}

export let createDependencyVersion = async ([name, version]) => {
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
	let bowerVersion =
		(await bower.checkHasManifest(name)) &&
		(await bower.getManifest(name)).version

	if (bowerVersion) {
		return bowerVersion
	}

	// or, if there's a package json there, use that version
	let packageJsonVersion =
		(await checkHasManifest(name)) && (await getManifest(name)).version

	if (packageJsonVersion) {
		return packageJsonVersion
	}

	// or die
	throw Error(
		`oh no, i couldn't turn ${name}'s '${version} into a suitable npm version`
	)
}

export let createDependency = async ([name, version]) => {
	let npmName = await createDependencyName(name)
	let npmVersion = await createDependencyVersion([name, version])

	return [npmName, npmVersion]
}

export let createDependencies = async bowerDependencies => {
	let npmDependencies = await Promise.all(
		bowerDependencies.map(createDependency)
	)

	return npmDependencies.reduce((dependencies, dependency) => {
		let [name, version] = dependency

		dependencies[name] = version
		return dependencies
	}, {})
}

let createAliases = dependencies => {
	let dependencyNames = keys(dependencies || {})

	return components.names.all.reduce(
		(aliases, componentName) => {
			if (dependencyNames.includes(componentName)) {
				aliases[componentName] = createComponentName(componentName)
			}

			return aliases
		},
		{...mappings.name}
	)
}

export let createManifest = async bowerManifest => {
	let {
		name,
		version: bowerVersion,
		description,
		homepage,
		license
	} = bowerManifest

	let version = (await components.getVersion(name)) || bowerVersion

	let dependencies = bowerManifest.dependencies

	let npmName = createComponentName(name)
	let npmDependencies =
		dependencies && (await createDependencies(entries(dependencies)))

	let aliases = createAliases(dependencies)

	return {
		...skeleton,
		name: npmName,
		version,
		description,
		homepage,
		dependencies: npmDependencies,
		component: name,
		babel: babel.createConfiguration({
			aliases
		}),
		aliases,
		license
	}
}

export let mergeManifestWithExistingManifest = async manifestPromise => {
	let manifest = await manifestPromise
	let hasManifest = await checkHasManifest(manifest.component)

	if (!hasManifest) {
		return manifest
	}

	let existingManifest = await getManifest(manifest.component)
	return mergeManifests(existingManifest, manifest)
}

export let writeManifest = async (manifestPromise, path) => {
	let manifest = await manifestPromise

	path = path || getManifestPath(manifest.component)

	return write(path, manifest)
}

export let cleanManifest = async manifestPromise => {
	let manifest = {...(await manifestPromise)}

	delete manifest.babel
	delete manifest.aliases

	return manifest
}

export let removeLockfile = async componentName => {
	return fs.remove(components.resolve(componentName, "package-lock.json"))
}

export let createAndWriteManifest = async componentName => {
	let bowerManifest = await bower.getManifest(componentName)

	return compose(
		writeManifest,
		mergeManifestWithExistingManifest,
		createManifest
	)(bowerManifest)
}

export let createRegistryArgument = registry =>
	registry
		? `--registry=${String(registry)}`
		: ""

export let cleanAndWriteManifest = compose(
	writeManifest,
	cleanManifest,
	getManifest
)

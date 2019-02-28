import * as semver from "semver"
import * as fs from "fs-extra"
import merge from "just-merge"
let {entries, keys} = Object
import {componentManifest as skeleton} from "./skeletons.js"
import settings from "../config/settings.js"
import mappings from "../config/mappings.js"
import origamiComponentNames from "../config/components.js"

let hashVersionRegex = /#([=<>.^0-9a-zA-Z|% *~-]+)/

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

	let result = {
		...generated,
		scripts,
		dependencies,
		devDependencies
	}

	return result
}

export let createComponentName = (
	componentName,
	npmOrganisation = settings.npmOrganisation
) => `@${npmOrganisation}/${componentName}`

export let createDependencyName = name => {
	if (origamiComponentNames.includes(name)) {
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

export let createAliases = dependencies => {
	let dependencyNames = keys(dependencies || {})

	return origamiComponentNames.reduce(
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

	let version = bowerVersion

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
		aliases,
		license
	}
}

export let cleanManifest = async manifestPromise => {
	let manifest = {...(await manifestPromise)}

	delete manifest.aliases

	return manifest
}

export let writeManifest = async (manifestPromise, path) =>
	fs.outputJson(
		path,
		await manifestPromise,
		{
			spaces: "\t"
		}
	)

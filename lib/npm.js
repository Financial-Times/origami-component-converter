import * as semver from "semver"
import * as fs from "fs-extra"
import merge from "just-merge"
let {entries: getEntries, keys: getKeys} = Object
import {componentManifest as skeleton} from "./skeletons.js"
import settings from "../config/settings.js"
import mappings from "../config/mappings.js"
import origamiComponentNames from "../config/components.js"

/**
 * @typedef {Object.<string, string>} Dictionary a key value string store
 */

/**
 * @typedef {Object.<string, any>} ComponentManifest
 * @property {string} name the name of the component
 * @property {string} description a little something about the component
 * @property {string} version the version string
 * @property {string} homepage the component's canonical homepage
 * @property {Dictionary} dependencies all the component's dependencies
 * @property {Dictionary} devDependencies all the component's developer dependencies
 * @property {string=} license the license the code is released under
 */

/**
 * @typedef {Object<string, any>} BowerManifestExtras
 * @property {string | string[]} main the component's entry point(s)
 */

/**
 * @typedef {Object<string, any>} NpmManifestExtras
 * @property {string=} main the component's javascript entry point
 * @property {string=} browser the component's browser entry point
 * @property {Dictionary=} scripts scripts that can be run with `npm run-script`
 * @property {string} component the component's origami name
 * @property {Dictionary=} aliases aliases for `babel-plugin-import-rewrite`
 * @property {Dictionary=} optionalDependencies optional dependencies
 * @property {Dictionary=} peerDependencies peer dependencies
 * @property {babel.BabelConfiguration=} babel babel config
 * @property {string=} browserslist browsers to target
 */

/**
 * @typedef {ComponentManifest & BowerManifestExtras} BowerManifest
 */

/**
 * @typedef {ComponentManifest & NpmManifestExtras} NpmManifest
 */


let hashVersionRegex = /#([=<>.^0-9a-zA-Z|% *~-]+)/

/**
 * Merge an existing package.json with the new one
 * @param {NpmManifest} existing the manifest on disk
 * @param {NpmManifest} generated the manifest you've made
 * @returns {NpmManifest} the merged manifest
 */
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

/**
 * Create the component's npm name from its bower name
 * @param {string} componentName the name of the component
 * @param {string} npmOrganisation the organisation to use (default: `financial-times`)
 * @returns {string} the new name: `@org-name/component-name`
 */
export let createComponentName = (
	componentName,
	npmOrganisation = settings.npmOrganisation
) => `@${npmOrganisation}/${componentName}`

/**
 * Get an npm package name for a bower package name. if it's an origami component,
 * then add the `@`, otherwise return a mapping or the original name. (Sloppy)
 * @param {string} name the name of a single dependency
 * @returns {string} the correct target version for the package on npm
 */
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

/**
 * Get an npm version for a bower package/version
 * @param {[string, string]} packageEntry the [name, version] of a single dependency
 * @returns {string} the correct target version for the package on npm
 */
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

/**
 * Get an npm package entry for a bower package entry
 * @param {[string, string]} packageEntry the `[name, version]` of a single dependency
 * @returns {[string, string]} the correct target `[name, version]` for the package on npm
 */
export let createDependency = async ([name, version]) => {
	let npmName = await createDependencyName(name)
	let npmVersion = await createDependencyVersion([name, version])

	return [npmName, npmVersion]
}

/**
 * Get an npm dependencies object for entries of bower dependencies
 * @param {[string, string][]} bowerDependencies the `[name, version]` of the dependencies
 * @returns {Dictionary} the dependencies object for the npm manifest
 */
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

/**
 * Get an aliases object for bower dependencies
 * Ensures the built and published javascript points at the npm names for things
 * @param {Dictionary} dependencies the dependencies object for the bower manifest
 * @returns {Dictionary} the aliases object for the babel import-rewrite plugin
 */
export let createAliases = dependencies => {
	let dependencyNames = getKeys(dependencies || {})

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

/**
 * Create an npm manifest from a bower manifest
 * @param {BowerManifest} bowerManifest the source manifest
 * @returns {NpmManifest} the npm manifest
 */
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
		dependencies && (await createDependencies(getEntries(dependencies)))

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

/**
 * Clean an npm manifest before publish
 * @param {Promise.<NpmManifest>} manifestPromise a promise resolving to the manifest
 * @returns {NpmManifest} the clean npm manifest manifest
 */
export let cleanManifest = async manifestPromise => {
	let manifest = {...(await manifestPromise)}

	delete manifest.aliases

	return manifest
}

/**
 * Output an npm manifest printed pretty and tabby
 * @param {Promise.<NpmManifest>} manifestPromise a promise resolving to the manifest
 * @param {string} path the target path
 * @returns {Promise.<void>} resolves on hooray
 */
export let writeManifest = async (manifestPromise, path) =>
	fs.outputJson(
		path,
		await manifestPromise,
		{
			spaces: "\t"
		}
	)

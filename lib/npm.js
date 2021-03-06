import * as semver from "semver"
import * as fs from "fs-extra"
import merge from "just-merge"
let {entries: getEntries, keys: getKeys} = Object
import {componentManifest as skeleton} from "./skeletons.js"
import settings from "../config/settings.js"
import mappings from "../config/mappings.js"
import RepoDataClient from "@financial-times/origami-repo-data-client"

const origamiComponentNames = (async function () {
	const repoData = new RepoDataClient()
	const components = await repoData.listRepos({
		type: "module",
	})
	const componentNames = components.map(component => component.name)
	return componentNames
})()
/**
 * @typedef {Object.<string, string>} Dictionary a key value string store
 */

/**
 * @typedef {Object} ComponentManifest
 * @property {string} name the name of the component
 * @property {string} version the version string
 * @property {string=} description a little something about the component
 * @property {string=} homepage the component's canonical homepage
 * @property {Dictionary=} dependencies all the component's dependencies
 * @property {Dictionary=} devDependencies all the component's developer dependencies
 * @property {string=} license the license the code is released under
 * @property {string[]} ignore a list of files to be ignored when installing/publishing package.
 */

/**
 * @typedef {Object} BowerManifestExtras
 * @property {string | string[]} main the component's entry point(s)
 */

/**
 * @typedef {Object} NpmManifestExtras
 * @property {string=} main the component's javascript entry point
 * @property {string=} browser the component's browser entry point
 * @property {Dictionary=} scripts scripts that can be run with `npm run-script`
 * @property {string=} component the component's origami name
 * @property {Dictionary=} aliases aliases for `babel-plugin-import-rewrite`
 * @property {Dictionary=} optionalDependencies optional dependencies
 * @property {Dictionary=} peerDependencies peer dependencies
 * @property {import("./babel").BabelConfiguration=} babel babel config
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
		devDependencies,
	}

	return result
}

/**
 * Create the component's npm name from its bower name
 * @param {string} componentName the name of the component
 * @param {string} [npmOrganisation="financial-times"] the organisation to use
 * @returns {string} the new name: `@org-name/component-name`
 */
export let createComponentName = (
	componentName,
	npmOrganisation = settings.npmOrganisation
) => {
	// ftdomdelegate is special. It is not published under any org.
	if (componentName === "ftdomdelegate") {
		return "ftdomdelegate"
	}
	return `@${npmOrganisation}/${componentName}`
}

/**
 * Get an npm package name for a bower package name. if it's an origami component,
 * then add the `@`, otherwise return a mapping or the original name. (Sloppy)
 * @param {string} name the name of a single dependency
 * @returns {Promise.<string>} the correct target version for the package on npm
 */
export let createDependencyName = async name => {
	if ((await origamiComponentNames).includes(name)) {
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
 * @returns {Promise.<string>} the correct target version for the package on npm
 */
// eslint-disable-next-line require-await
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
 * @returns {Promise.<[string, string]>} the correct target `[name, version]` for the package on npm
 */
export let createDependency = async ([name, version]) => {
	let npmName = await createDependencyName(name)
	let npmVersion = await createDependencyVersion([name, version])

	return [npmName, npmVersion]
}

/**
 * Get an npm dependencies object for entries of bower dependencies
 * @param {[string, string][]} bowerDependencies the `[name, version]` of the dependencies
 * @returns {Promise.<Dictionary>} the dependencies object for the npm manifest
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
 * @returns {Promise.<Dictionary>} the aliases object for the babel import-rewrite plugin
 */
export let createAliases = async dependencies => {
	let dependencyNames = getKeys(dependencies || {})

	return (await origamiComponentNames).reduce(
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
 * @param {String=} repository the repository url to use in the npm manifest
 * @returns {Promise.<NpmManifest>} the npm manifest
 */
export let createManifest = async (bowerManifest, repository) => {
	let {
		name,
		version: bowerVersion,
		description,
		homepage,
		ignore,
		license,
	} = bowerManifest

	let version = bowerVersion

	let dependencies = bowerManifest.dependencies

	let npmName = createComponentName(name)
	let npmDependencies =
		dependencies && (await createDependencies(getEntries(dependencies)))

	let aliases = await createAliases(dependencies)

	let repositoryManifest = {}
	if (repository) {
		repositoryManifest.repository = {
			type: "git",
			url: repository,
		}
	}

	return {
		...skeleton,
		name: npmName,
		version,
		description,
		homepage,
		dependencies: npmDependencies,
		component: name,
		ignore,
		aliases,
		license,
		...repositoryManifest,
	}
}

/**
 * Clean an npm manifest before publish
 * @param {Promise.<NpmManifest>|NpmManifest} manifestPromise a promise resolving to the manifest
 * @returns {Promise.<NpmManifest>} the clean npm manifest manifest
 */
export let cleanManifest = async manifestPromise => {
	let manifest = {...(await manifestPromise)}

	delete manifest.ignore
	delete manifest.aliases

	return manifest
}

/**
 * Output an npm manifest printed pretty and tabby
 * @param {Promise.<NpmManifest>|NpmManifest} manifestPromise a promise resolving to the manifest
 * @param {string} path the target path
 * @returns {Promise.<void>} resolves on hooray
 */
export let writeManifest = async (manifestPromise, path) =>
	fs.outputJson(path, await manifestPromise, {
		spaces: "\t",
	})

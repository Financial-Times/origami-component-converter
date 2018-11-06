import * as path from 'path'
import {promises as fs} from 'fs'
import {promisify} from 'util'
import * as ChildProcess from 'child_process'
import log from './log'

let semverRegex: RegExp = require('semver-regex')()

declare global {
	interface Array<T> {
		last: T
	}
}

Object.defineProperty(
	Array.prototype,
	'last',
	{
		get () {
			return this[this.length - 1]
		}
	}
)

interface Dictionary {
	[key: string]: string
}

interface ComponentManifest {
	/** the name of the component */
	name: string,
	/** a little something about the component */
	description: string,
	/** version string */
	version: string,
	/** all the component's dependencies */
	dependencies: Dictionary
}

interface BowerManifest extends ComponentManifest {
	/** the component's entry points */
	main: string[]
}

interface NpmManifest extends ComponentManifest {
	/** the component's javascript entry point */
	main: string,
	/** the component's es6 entry point */
	module: string,
	/** the component's precompiled entry point */
	source: string,
	/** scripts that can be run with `npm run-script` */
	scripts: Dictionary,
	/** the component's origami name */
	component: string
}

interface Settings {
	/** the name of the npm organisation to publish under) */
	organisation: string
}

type Dependency = [string, string]

let argv = require('minimist')(process.argv.slice(2))

let spawn = promisify(ChildProcess.spawn)

let createExit = (exitCode: number) => (reason: any) => {
	console.error(reason)
	process.exit(exitCode)
}

let stringify = (thing: any) =>
	JSON.stringify(
		thing,
		null,
		2
	) + '\n'

let root = path.resolve(
	__dirname,
	'..'
)

let myBowerManifest: BowerManifest = require('../bower.json')
let packageSkeleton: NpmManifest = require('../skeletons/package.json')
let settings: Settings = require('../settings.json')
let mappings: Dictionary = require('../mappings.json')

let componentNames = Object.keys(myBowerManifest.dependencies)

let componentsDirectory = path.resolve(
	root,
	'bower_components'
)

let getComponentDirectory = (componentName: string) =>
	path.resolve(
		componentsDirectory,
		componentName
	)

let getBowerManifestPath = (componentName: string) =>
	path.resolve(
		getComponentDirectory(componentName),
		'.bower.json'
	)

let getNpmManifestPath = (componentName: string) =>
	path.resolve(
		getComponentDirectory(componentName),
		'package.json'
	)

let getBowerManifest = (componentName: string) : BowerManifest =>
	require(getBowerManifestPath(componentName))

let getNpmManifest = (componentName: string) : NpmManifest =>
	require(getNpmManifestPath(componentName))

let createNpmComponentName = (componentName: string) : string =>
	`@${settings.organisation}/${componentName}`

let createNpmDependencyName = (name: string): string => {
	let isOrigamiComponent = componentNames.includes(name)

	if (isOrigamiComponent) {
		return createNpmComponentName(name)
	}

	let mapping = mappings[name]

	if (mapping) {
		return mapping
	}

	return name
}

let createNpmDependencyVersion = ([name, version]: Dependency) : string => {
	// if it's an origami component then use a relative path for version
	let isOrigamiComponent = componentNames.includes(name)

	if (isOrigamiComponent) {
		return `../${name}`
	}

	// try getting the version bower resolved to
	let bowerVersion = getBowerManifest(name).version

	if (bowerVersion) {
		return bowerVersion
	}

	// or if there's a package json there, use that version
	let packageJsonVersion = getNpmManifest(name).version

	if (packageJsonVersion) {
		return packageJsonVersion
	}

	// if that doesn't work, but it's a valid semver then use that
	let isValidSemver = semverRegex.test(version)

	if (isValidSemver) {
		return version
	}

	// or, if it isn't a semver but contains any, use the last one
	// (last one because the common case is uri://component#semver)
	let matches = version.match(semverRegex)

	if (matches) {
		return matches.last
	}

	// or die
	throw Error(
		`oh no, i couldn't turn ${name}'s '${version} into a suitable npm version`
	)
}

function stringifyDependency ([name, version]: Dependency): string {
	return JSON.stringify({[name]: version})
}

let createNpmDependency = ([name, version]: Dependency): Dependency => {
	let npmName = createNpmDependencyName(name)
	let npmVersion = createNpmDependencyVersion([name, version])

	log(
		`${stringifyDependency([name, version])} -> ${stringifyDependency([npmName, npmVersion])}`,
		2
	)

	return [
		npmName,
		npmVersion
	]
}

let createNpmDependencies = (dependencies: Dependency[]) =>
	dependencies.reduce((dependencies, dependency: Dependency) => {
		let [name, version] = createNpmDependency(dependency)
		dependencies[name] = version
		return dependencies
	}, {})

let createNpmManifest = (bowerManifest: BowerManifest) : NpmManifest => {
	let {
		name,
		dependencies,
		version
	} = bowerManifest

	let npmName = createNpmComponentName(name)
	let npmDependencies = dependencies &&
		createNpmDependencies(Object.entries(dependencies))

	log(`created ${name} as ${npmName}`)

	return {
		...packageSkeleton,
		name: npmName,
		version,
		dependencies: npmDependencies,
		component: name
	}
}

let writeNpmManifest = (npmManifest: NpmManifest) : Promise<void> =>
	fs.writeFile(
		getNpmManifestPath(npmManifest.component),
		stringify(npmManifest)
	)

let writeNpmManifests = (npmManifests: NpmManifest[]) =>
	Promise.all(
		npmManifests.map(writeNpmManifest)
	).catch(createExit(10))

let npmManifests = componentNames
	.map(getBowerManifest)
	.map(createNpmManifest)

let npm = command => componentName => {
	log(`running ${command} on ${componentName}`)

	return spawn(
		'npm',
		command.split(' '),
		{cwd: getComponentDirectory(componentName)}
	).then(process => {
		log(`completed: ${command} on ${componentName}`)
		return process
	})
}

let install = npm('install')
let build = npm('run-script build')

let buildComponent = (componentName: string) =>
	install(componentName).then(() => build(componentName))

let buildComponents = (componentNames: string[]) =>
	Promise.all(componentNames.map(buildComponent))
		.catch(createExit(22))

let go = (componentNames: string[]) => {
	let npmManifests = componentNames
		.map(getBowerManifest)
		.map(createNpmManifest)

	return writeNpmManifests(npmManifests)
		.then(() => buildComponents(componentNames))
}

go(componentNames)
	.then(() => console.log('oh good'))
	.catch(createExit(47))

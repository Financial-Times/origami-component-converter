// @flow
import settings from './settings.js'
import path from 'path'
import defaultComponentNames from './component-names.js'
import os from 'os'
import yargs from 'yargs'

let parseComponentsArgument = (components: string | Array<string>): string[] =>
	Array.isArray(components)
		? components
		: components.split(/,/)

export let options = {
	components: {
		global: false,
		describe: 'the components to use',
		default: defaultComponentNames,
		coerce: parseComponentsArgument
	},
	fresh: {
		global: false,
		describe: 'delete old components/ directory',
		alias: 'f',
		default: false,
		type: 'boolean'
	},
	download: {
		global: false,
		describe: 'download components from github',
		default: true,
		type: 'boolean'
	},
	createManifests: {
		global: false,
		describe: 'create package.jsons from .bower.jsons',
		alias: 'n',
		default: true,
		type: 'boolean'
	},
	build: {
		global: false,
		describe: 'build the components',
		default: true,
		type: 'boolean'
	},
	cleanManifests: {
		global: false,
		describe: 'clean the manifest before publish',
		default: true,
		type: 'boolean'
	},
	publish: {
		global: false,
		alias: 'p',
		describe: 'publish to npm registry',
		default: false,
		type: 'boolean'
	},
	unpublish: {
		global: false,
		alias: 'u',
		describe: 'remove from npm registry',
		default: false,
		type: 'boolean'
	},
	npmOrganisation: {
		global: false,
		describe: 'npm organisation to use',
		default: settings.organisation
	},
	githubOrganisation: {
		global: false,
		describe: 'github organisation to use',
		default: settings.organisation
	},
	initialise: {
		global: false,
		default: true,
		describe: 'initialise the working directory with a package.json and do an npm install',
		type: 'boolean'
	},
	workingDirectory: {
		global: false,
		default: path.resolve(os.homedir(), 'tmp/origami'),
		coerce: (directory: string) => path.resolve(process.cwd(), directory)
	},
	npmInstall: {
		global: false,
		default: false,
		type: 'boolean',
		describe: 'install component dependencies'
	},
	npmRegistry: {
		global: false,
		default: 'http://localhost:4873',
		type: 'string',
		describe: 'the npm registry to use'
	},
	test: {
		global: false,
		default: false,
		type: 'boolean',
		describe: 'run `obt t` on the components after build'
	}
}

let {argv} = yargs.options(options)

export default argv

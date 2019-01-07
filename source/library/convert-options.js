// @flow
import settings from '../library/settings.js'
import path from 'path'
import defaultComponentNames from './component-names.js'

let parseComponentsArgument = (components: string | Array<string>): string[] =>
	Array.isArray(components)
		? components
		: components.split(/,/)

export default {
	components: {
		describe: 'the components to use',
		default: defaultComponentNames,
		coerce: parseComponentsArgument
	},
	fresh: {
		describe: 'delete old components/ directory',
		alias: 'f',
		default: false,
		type: 'boolean'
	},
	download: {
		describe: 'download components from github',
		default: true,
		type: 'boolean'
	},
	createManifests: {
		describe: 'create package.jsons from .bower.jsons',
		alias: 'n',
		default: true,
		type: 'boolean'
	},
	createLinks: {
		describe: 'create global npm links',
		default: false,
		type: 'boolean'
	},
	build: {
		describe: 'build the components',
		default: true,
		type: 'boolean'
	},
	cleanManifests: {
		describe: 'clean the manifest before publish',
		default: true,
		type: 'boolean'
	},
	publish: {
		alias: 'p',
		describe: 'publish to npm registry',
		default: false,
		type: 'boolean'
	},
	unpublish: {
		alias: 'u',
		describe: 'remove from npm registry',
		default: false,
		type: 'boolean'
	},
	npmOrganisation: {
		describe: 'npm organisation to use',
		default: settings.organisation
	},
	githubOrganisation: {
		describe: 'github organisation to use',
		default: settings.organisation
	},
	initialise: {
		default: true,
		describe: 'initialise the working directory with a package.json and do an npm install',
		type: 'boolean'
	},
	workingDirectory: {
		default: process.cwd(),
		coerce: (directory: string) => path.resolve(process.cwd(), directory)
	},
	npmInstall: {
		default: false,
		type: 'boolean',
		describe: 'install component dependencies'
	},
	npmRegistry: {
		default: 'http://localhost:4873',
		type: 'string',
		describe: 'the npm registry to use'
	},
	test: {
		default: false,
		type: 'boolean',
		describe: 'run `obt t` on the components after build'
	}
}

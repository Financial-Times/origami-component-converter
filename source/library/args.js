// @flow
import yargs from 'yargs'
import settings from './settings.js'
import path from 'path'
import defaultComponentNames from './component-names.js'

let parseComponents = (components: string | Array<string>): string[] =>
	Array.isArray(components)
		? components
		: components.split(/,/)

export default yargs
	.count('verbose')
	.alias('v', 'verbose')
	.options('fresh', {
		describe: 'delete old components/ directory',
		alias: 'f',
		default: false,
		type: 'boolean'
	})
	.options('download', {
		describe: 'do a bower install -F',
		default: true,
		type: 'boolean'
	})
	.options('create-manifests', {
		describe: 'create package.jsons from .bower.jsons',
		alias: 'n',
		default: true,
		type: 'boolean'
	})
	.options('create-links', {
		describe: 'create global npm links',
		default: false,
		type: 'boolean'
	})
	.options('build', {
		describe: 'build the components',
		default: true,
		type: 'boolean'
	})
	.options('clean-manifests', {
		describe: 'clean the manifest before publish',
		default: true,
		type: 'boolean'
	})
	.options('publish', {
		alias: 'p',
		describe: 'publish to npm registry',
		default: false,
		type: 'boolean'
	})
	.options('unpublish', {
		alias: 'u',
		describe: 'remove from npm registry',
		default: false,
		type: 'boolean'
	})
	.options('organisation', {
		describe: 'organisation to use (not implemented)',
		default: settings.organisation
	})
	.options('print-components', {
		describe: 'show components in sort order and die'
	})
	.options('initialise', {
		default: true,
		describe: 'initialise the working directory with a package.json and do an npm install',
		type: 'boolean'
	})
	.options('working-directory', {
		default: process.cwd(),
		coerce: (directory: string) => path.resolve(process.cwd(), directory)
	})
	.options('components', {
		describe: 'the components to use',
		default: defaultComponentNames,
		coerce: parseComponents
	})
	.options('npm-install', {
		default: false,
		type: 'boolean',
		describe: 'install component dependencies'
	})
	.options('exec', {
		default: '',
		type: 'string',
		describe: 'run a boi in each boi in order'
	})
	.argv

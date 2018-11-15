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
	.options('clean-manifest', {
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
	.options('prerelease', {
		describe: 'prerelease tag to use (not implemented)',
		default: settings.prerelease
	})
	.options('organisation', {
		describe: 'organisation to use (not implemented)',
		default: settings.organisation
	})
	.options('print-components', {
		describe: 'show components in sort order and die'
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
		default: true,
		type: 'boolean',
		describe: 'install component dependencies'
	})
	.argv

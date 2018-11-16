// @flow
import {
	reduce,
	clone,
	type Dictionary
} from './dictionary.js'
import {builder} from './babel-builder.js'
import * as components from './components.js'
import * as workingDirectory from './working-directory.js'
import spawn from './spawn.js'
import checkFileIsAccessible from './check-file-is-accessible.js'

type Item = string | [string, any]

export type Preset = Item
export type Plugin = Item

export type Configuration = {
	presets: Preset[],
	plugins: Plugin[],
	test?: string,
	overrides?: Configuration[]
}

type Options = {
	aliases: Dictionary
}

function createRedirects (aliases: Dictionary, initial: Dictionary = {}): Dictionary {
	return reduce((redirects, componentName, moduleName) => {
		redirects[`${componentName}/src/(.*)`] = `${moduleName}/dist/$1`
		return redirects
	}, clone(initial), aliases)
}

export function createConfiguration ({aliases}: Options): Configuration {
	return builder()
		.preset('@babel/preset-env', {useBuiltIns: false})
		.plugin('@babel/plugin-transform-modules-commonjs')
		.plugin('module:babel-plugin-module-resolver', {alias: aliases})
		.plugin('module:babel-plugin-import-redirect', {
			redirect: createRedirects(aliases)
		})
		.override(
			'./main.js',
			builder()
				.plugin('module:babel-plugin-import-redirect', {
					redirect: createRedirects(
						aliases,
						{'./src/(.*)': './dist/$1'}
					)
				})
		).toJSON()
}

export async function compile (componentName: string): Promise<any> {
	let componentDirectory = components.resolve(componentName)
	let workingBin = workingDirectory.resolve('node_modules/.bin')
	let babelOptions = {
		cwd: componentDirectory,
		env: {
			...process.env,
			PATH: `${workingBin}:${process.env.PATH||''}`
		}
	}
	let mainJsFile = components.resolve(componentName, 'main.js')
	let sourceDirectory = components.resolve(componentName, 'src')

	await checkFileIsAccessible(sourceDirectory) && await spawn(
		'babel src --out-dir dist --configFile=./package.json',
		babelOptions
	)

	return (await checkFileIsAccessible(mainJsFile)) && spawn(
		'babel main.js --out-file index.js --configFile=./package.json',
		babelOptions
	)
}
// TODO programattic babel boi

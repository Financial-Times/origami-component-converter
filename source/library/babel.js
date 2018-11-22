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
import * as fs from 'fs-extra'
import args from './args.js'

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
	return reduce((redirects, moduleName, componentName) => {
		redirects[`${componentName}/src/(.*)`] = `${moduleName}/dist/$1`
		return redirects
	}, clone(aliases), clone(initial))
}


export function createConfiguration ({aliases}: Options): Configuration {
	return builder()
		.plugin('module:babel-plugin-module-resolver', {
			alias: aliases
		})
		.override(
			builder()
				.preset('@babel/preset-env', {useBuiltIns: false})
				.plugin('@babel/plugin-transform-modules-commonjs')
				.plugin('module:babel-plugin-add-module-exports')
				.plugin('module:babel-plugin-import-redirect', {
					redirect: createRedirects(aliases)
				})
				.exclude('./test.src/**')
		)
		.override(
			builder()
				.plugin('module:babel-plugin-import-redirect', {
					redirect: createRedirects(aliases, {
						'./src/(.*)': './dist/$1'
					})
				})
				.test('./main.js')
		)
		.override(
			builder()
				.plugin('module:babel-plugin-import-redirect', {
					root: 'test',
					redirect: createRedirects(aliases, {
						'../src/(.*)': '../dist/$1',
						// look away. this is a hack to get o-banner to compile. i am very
						// confused
						'./fixture/main': './fixture/main',
						'../main': '../index.js'
					})
				})
				.test('./test.src/**')
		)
		.toJSON()
}

type CreateBabelBuildStringOptions = {
	source: string,
	type?: 'dir' | 'file',
	destination: string
}

let createBabelBuildString = ({
	source,
	type = 'dir',
	destination
}: CreateBabelBuildStringOptions) =>
	[
		'babel',
		source,
		`--out-${type}`,
		destination,
		'--configFile=./package.json',
		'--copy-files'
	].join(' ')

let babelSpawnEnvironmentPath =
	`${workingDirectory.binaryDirectory}:${process.env.PATH || ''}`

// fixme: slowboi
let babelSpawnEnvironment = {
	...process.env,
	PATH: babelSpawnEnvironmentPath
}

export async function compile (componentName: string): Promise<any> {
	let componentDirectory = components.resolve(componentName)
	let componentResolve = components.resolve.bind(null, componentName)
	let babelSpawnOptions = {
		cwd: componentDirectory,
		env: babelSpawnEnvironment
	}
	let mainJsFile = componentResolve('main.js')
	let sourceDirectory = componentResolve('src')
	let testDirectory = componentResolve('test')
	let sourceTestDirectory = componentResolve('test.src')

	await checkFileIsAccessible(sourceDirectory) && await spawn(
		createBabelBuildString({
			source: 'src',
			destination: 'dist'
		}),
		babelSpawnOptions
	)

	await checkFileIsAccessible(mainJsFile) && await spawn(
		createBabelBuildString({
			source: 'main.js',
			destination: 'index.js',
			type: 'file'
		}),
		babelSpawnOptions
	)

	if (args.test && await checkFileIsAccessible(testDirectory)) {
		await checkFileIsAccessible(sourceTestDirectory) &&
			await fs.remove(sourceTestDirectory)
		await fs.move(testDirectory, sourceTestDirectory)
		return spawn(
			createBabelBuildString({
				source: 'test.src',
				destination: 'test',
			}),
			babelSpawnOptions
		)
	}
}
// TODO programattic babel boi

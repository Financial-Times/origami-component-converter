/**
 * @typedef {import('./dictionary.js').Dictionary} Dictionary
 */
import {reduce, clone} from "./dictionary.js"
import * as components from "./components.js"
import spawn from "./spawn.js"
import fs from "fs-extra"
import * as workingDirectory from "./working-directory.js"

/**
 * @typedef {string | [string, any]} Item
 */

/**
 * @typedef {Item} Preset
 */

/**
 * @typedef {Item} Plugin
 */

/**
 * @typedef {object} Configuration
 * @property {Preset[]} presets
 * @property {Plugin[]} plugins
 * @property {string | string[]} [test]
 * @property {string | string[]} [exclude]
 * @property {Configuration[]} [overrides]
 */

/**
 * Create the 'redirects' field for babel-plugin-import-redirect
 *
 * @param {Dictionary} aliases aliases to convert
 * @param {Dictionary} initial initial redirects object to use
 * @returns {Dictionary} the redirects
 */
function createRedirects(aliases, initial) {
	return reduce(
		(redirects, moduleName, componentName) => {
			redirects[`${componentName}/src/(.*)`] = `${moduleName}/dist/$1`
			return redirects
		},
		clone(aliases),
		clone(initial)
	)
}

/**
 * Create a babel configuration
 *
 * @param {{aliases: Dictionary}} aliases aliases needed for this conifg
 * @returns {Configuration} the config as an object, ready for use
 */
export function createConfiguration ({aliases}) {
	return {
		presets: [],
		plugins: [
			[
				"module:babel-plugin-module-resolver",
				{
					alias: aliases
				}
			]
		],
		overrides: [
			{
				presets: [
					[
						"@babel/preset-env",
						{
							useBuiltIns: false
						}
					]
				],
				plugins: [
					"@babel/plugin-transform-modules-commonjs",
					"module:babel-plugin-add-module-exports",
					"module:babel-plugin-transform-es3-member-expression-literals",
					"module:babel-plugin-transform-es3-property-literals",
					[
						"module:babel-plugin-import-redirect",
						{
							redirect: createRedirects(aliases, {})
						}
					]
				],
				exclude: "./test.src/**"
			},
			{
				presets: [],
				plugins: [
					[
						"module:babel-plugin-import-redirect",
						{
							redirect: createRedirects(aliases, {
								"./src/(.*)": "./dist/$1"
							})
						}
					]
				],
				test: "./main.js"
			},
			{
				presets: [],
				plugins: [
					[
						"module:babel-plugin-import-redirect",
						{
							root: "test",
							redirect: createRedirects(aliases, {
								"../src/(.*)": "../dist/$1",
								// look away. this is a hack to get o-banner to compile. i am very
								// confused
								"./fixture/main": "./fixture/main",
								"../main": "../browser.js"
							})
						}
					]
				],
				test: "./test.src/**"
			}
		]
	}
}

/**
 * Create the string that's used to run the babel cli
 * @typedef {"dir" | "file"} DirOrFile
 * @param {{source: string, type: DirOrFile, destination: string}} options run options
 * @returns {string} the command
 */
let createBabelBuildString = ({source, type = "dir", destination}) =>
	[
		"babel",
		source,
		`--out-${type}`,
		destination,
		"--configFile=./package.json",
		"--copy-files"
	].join(" ")

let getBabelSpawnEnvironmentPath = () =>
	`${workingDirectory.resolve("node_modules", ".bin")}:${process.env.PATH || ""}`

/**
 * Run the babel cli for a component
 *
 * @param {string} componentName the name of the component
 * @param {{compileTests: boolean}} options .compileTests will also compile the tests
 * @returns {Promise<void>} to resolve when done
 */
export async function compile(componentName, options = {compileTests: true}) {
	let componentDirectory = components.resolve(componentName)
	let componentResolve = components.resolve.bind(null, componentName)
	let babelSpawnOptions = {
		cwd: componentDirectory,
		env: {
			...process.env,
			PATH: getBabelSpawnEnvironmentPath()
		}
	}
	let mainJsFile = componentResolve("main.js")
	let sourceDirectory = componentResolve("src")
	let testDirectory = componentResolve("test")
	let sourceTestDirectory = componentResolve("test.src")

	await fs.pathExists(sourceDirectory) &&
		(await spawn(
			createBabelBuildString({
				type: "dir",
				source: "src",
				destination: "dist"
			}),
			babelSpawnOptions
		))

	await fs.pathExists(mainJsFile) &&
		(await spawn(
			createBabelBuildString({
				source: "main.js",
				destination: "browser.js",
				type: "file"
			}),
			babelSpawnOptions
		))

	if (options.compileTests && (await fs.pathExists(testDirectory))) {
		await fs.pathExists(sourceTestDirectory) &&
			(await fs.remove(sourceTestDirectory))
		await fs.move(testDirectory, sourceTestDirectory)
		await spawn(
			createBabelBuildString({
				type: "dir",
				source: "test.src",
				destination: "test"
			}),
			babelSpawnOptions
		)
	}
}

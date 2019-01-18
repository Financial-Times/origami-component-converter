/**
 * @typedef {import('./dictionary.js').Dictionary} Dictionary
 */
import {reduce, clone} from "./dictionary.js"
import {builder} from "./babel-builder.js"
import * as components from "./components.js"
import spawn from "./spawn.js"
import checkFileIsAccessible from "./check-file-is-accessible.js"
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
 * @param {{aliases: Dictionary}} aliases
 * @returns {Configuration}
 */
export function createConfiguration({aliases}) {
	return builder()
		.plugin("module:babel-plugin-module-resolver", {
			alias: aliases
		})
		.override(
			builder()
				.preset("@babel/preset-env", {useBuiltIns: false})
				.plugin("@babel/plugin-transform-modules-commonjs")
				.plugin("module:babel-plugin-add-module-exports")
				.plugin("module:babel-plugin-transform-es3-member-expression-literals")
				.plugin("module:babel-plugin-transform-es3-property-literals")
				.plugin("module:babel-plugin-import-redirect", {
					redirect: createRedirects(aliases, {})
				})
				.exclude("./test.src/**")
		)
		.override(
			builder()
				.plugin("module:babel-plugin-import-redirect", {
					redirect: createRedirects(aliases, {
						"./src/(.*)": "./dist/$1"
					})
				})
				.test("./main.js")
		)
		.override(
			builder()
				.plugin("module:babel-plugin-import-redirect", {
					root: "test",
					redirect: createRedirects(aliases, {
						"../src/(.*)": "../dist/$1",
						// look away. this is a hack to get o-banner to compile. i am very
						// confused
						"./fixture/main": "./fixture/main",
						"../main": "../browser.js"
					})
				})
				.test("./test.src/**")
		)
		.toJSON()
}

/**
 * Create the string that's used to run the babel cli
 *
 * @param {{source: string, type?: 'dir' | 'file', destination: string}} options
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
 * @param {string} componentName
 * @param {{test: boolean}} options
 * @returns {Promise<void>}
 */
export async function compile(componentName, options = {test: false}) {
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

	await checkFileIsAccessible(sourceDirectory) &&
		(await spawn(
			createBabelBuildString({
				source: "src",
				destination: "dist"
			}),
			babelSpawnOptions
		))

	await checkFileIsAccessible(mainJsFile) &&
		(await spawn(
			createBabelBuildString({
				source: "main.js",
				destination: "browser.js",
				type: "file"
			}),
			babelSpawnOptions
		))

	if (options.test && (await checkFileIsAccessible(testDirectory))) {
		await checkFileIsAccessible(sourceTestDirectory) &&
			(await fs.remove(sourceTestDirectory))
		await fs.move(testDirectory, sourceTestDirectory)
		await spawn(
			createBabelBuildString({
				source: "test.src",
				destination: "test"
			}),
			babelSpawnOptions
		)
	}
}
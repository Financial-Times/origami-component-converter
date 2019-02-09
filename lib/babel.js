import reduce from "just-reduce-object"
import clone from "just-clone"
import fs from "fs-extra"
import * as babel from "@babel/core"
import * as path from "path"

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
 * @typedef {Object.<string, string>} Aliases
 * @param {Aliases} aliases aliases to convert
 * @param {Aliases} initial initial redirects object to use
 * @returns {Aliases} the redirects
 */
function createRedirects(aliases, initial) {
	return reduce(
		clone(aliases),
		(redirects, componentName, moduleName) => {
			redirects[`${componentName}/src/(.*)`] = `${moduleName}/dist/$1`
			return redirects
		},
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
			["module:babel-plugin-module-resolver", {alias: aliases}]
		],
		overrides: [
			{
				presets: [
					["@babel/preset-env", {useBuiltIns: false}]
				],
				plugins: [
					"module:babel-plugin-add-module-exports",

					// - temporarily disabling the es3 transforms, as the module-exports
					// - doesn't work with it enabled
					// - https://github.com/59naga/babel-plugin-add-module-exports/pull/70
					//
					// "module:babel-plugin-transform-es3-member-expression-literals",
					// "module:babel-plugin-transform-es3-property-literals",
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
								// look away. this is a hack to get o-banner to compile. i am
								// very confused
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

let transform = (code, config) =>
	new Promise((resolve, reject) => {
		babel.transform(code, config, (error, {code}) => {
			error ? reject(error) : resolve(code)
		})
	})

async function buildFile (sourceFile, targetFile, config = {}) {
	let sourceExists = await fs.pathExists(sourceFile)
	if (!sourceExists) {
		return Promise.reject(new Error(`sourceFile "${sourceFile}" does not exist`))
	}

	let sourceCode = await fs.readFile(sourceFile)

	let targetCode = await transform(sourceCode, config)

	return fs.writeFile(targetFile, targetCode, "utf-8")
}

let javascriptExtensions = [".js"]

async function buildDirectory (
	sourceDirectory,
	targetDirectory,
	config = {}
) {

	let sourceDirectoryExists = await fs.pathExists(sourceDirectory)
	if (!sourceDirectoryExists) {
		return Promise.reject(new Error(
			`sourceDirectory "${sourceDirectory}" does not exist`
		))
	}

	let targetDirectoryExists = await fs.pathExists(targetDirectory)
	if (!targetDirectoryExists) {
		await fs.mkdir(targetDirectory)
	}

	let listing = await fs.readdir(sourceDirectory, {
		withFileTypes: true,
		encoding: "utf-8"
	})

	// https://nodejs.org/api/fs.html#fs_class_fs_dirent
	for (let dirent of listing) {
		let direntPath = path.resolve(
			sourceDirectory,
			dirent.name
		)

		let nextTarget = path.resolve(
			targetDirectory,
			dirent.name
		)

		let nextConfig = {
			...config,
			filename: path.join(config.filename, dirent.name)
		}

		if (dirent.isDirectory()) {
			await buildDirectory(direntPath, nextTarget, nextConfig)
		}

		if (dirent.isSymbolicLink()) {
			// skip?
		}

		if (dirent.isFile()) {
			let extension = path.extname(dirent.name)
			if (javascriptExtensions.includes(extension)) {
				await buildFile(direntPath, nextTarget, nextConfig)
			} else {
				await fs.copy(direntPath, nextTarget)
			}
		}
	}
}

/**
 * Build a component with babel
 *
 * @param {string} componentDirectory the directory of the component
 * @param {{compileTests: boolean}} options .compileTests will also compile the tests
 * @returns {Promise<void>} to resolve when done
 */
export async function compile(componentDirectory, options = {compileTests: true}) {
	let componentResolve = path.resolve.bind(null, componentDirectory)

	let mainJsFile = componentResolve("main.js")
	let sourceDirectory = componentResolve("src")
	let testDirectory = componentResolve("test")
	let sourceTestDirectory = componentResolve("test.src")
	let browserJsFile = componentResolve("browser.js")
	let distDirectory = componentResolve("dist")
	let {babel: babelConfig} = await fs.readJson(componentResolve("package.json"))

	let mainJsFileExists = await fs.pathExists(mainJsFile)
	if (mainJsFileExists) {
		await buildFile(mainJsFile, browserJsFile, {
			...babelConfig,
			filename: path.join(".", "main.js")
		})
	}

	let sourceDirectoryExists = await fs.pathExists(sourceDirectory)
	if (sourceDirectoryExists) {
		let distDirectoryExists = await fs.pathExists(distDirectory)

		if (distDirectoryExists) {
			fs.remove(distDirectory)
		}

		await buildDirectory(sourceDirectory, distDirectory, {
			...babelConfig,
			filename: path.join(".", "src")
		})
	}

	let shouldCompileTests = options.compileTests !== false
	let testDirectoryExists = await fs.pathExists(testDirectory)
	if (testDirectoryExists && shouldCompileTests) {
		let sourceTestDirectoryExists = await fs.pathExists(sourceTestDirectory)

		if (!sourceTestDirectoryExists) {
			await fs.move(testDirectory, sourceTestDirectory)
		}

		if (testDirectoryExists) {
			await fs.remove(testDirectory)
		}

		await buildDirectory(sourceTestDirectory, testDirectory, {
			...babelConfig,
			filename: path.join(".", "test.src")
		})
	}
}

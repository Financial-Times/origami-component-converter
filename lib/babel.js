import reduce from "just-reduce-object"
import clone from "just-clone"
import fs from "fs-extra"
import * as babel from "@babel/core"
import * as path from "path"
import * as root from "./root.js"

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
 * @property {string} [filename]
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

function getModulePath (moduleName) {
	return root.resolve("node_modules", moduleName)
}

/**
 * Create a babel configuration
 * @returns {Configuration} the config as an object, ready for use
 */
export function createConfiguration ({
	aliases,
	modules = "commonjs",
	filename = ""
}) {
	return {
		filename,
		presets: [],
		plugins: [
			[getModulePath("babel-plugin-module-resolver"), {alias: aliases}]
		],
		overrides: [
			{
				presets: [
					[getModulePath("@babel/preset-env"), {
						useBuiltIns: false,
						targets: {
							esmodules: true
						},
						modules
					}]
				],
				plugins: [
					getModulePath("babel-plugin-add-module-exports"),
					[
						getModulePath("babel-plugin-import-redirect"),
						{
							redirect: createRedirects(aliases, {}),
							suppressResolveWarning: true
						}
					]
				],
				exclude: "./test.src/**"
			},
			{
				presets: [],
				plugins: [
					getModulePath("babel-plugin-add-module-exports"),
					[
						getModulePath("babel-plugin-import-redirect"),
						{
							redirect: createRedirects(aliases, {
								"./src/(.*)": "./dist/$1"
							}),
							suppressResolveWarning: true
						}
					]
				],
				test: "./main.js"
			},
			{
				presets: [],
				plugins: [
					[
						getModulePath("babel-plugin-import-redirect"),
						{
							root: "test",
							redirect: createRedirects(aliases, {
								"../src/(.*)": "../dist/$1",
								// look away. this is a hack to get o-banner to compile. i am
								// very confused
								"./fixture/main": "./fixture/main",
								"../main": "../browser"
							}),
							suppressResolveWarning: true
						}
					]
				],
				test: "./test.src/**"
			}
		]
	}
}

let transform = (code, options) =>
	new Promise((resolve, reject) => {
		babel.transform(code, createConfiguration(options), (error, result) => {
			error ? reject(error) : resolve(result.code)
		})
	})

let changeExtension = (filePath, newExtension) =>
	path.resolve(
		path.dirname(filePath),
		path.basename(
			filePath,
			path.extname(filePath)
		) + newExtension
	)


async function buildFile (sourceFile, targetFile, options = {}) {
	let sourceExists = await fs.pathExists(sourceFile)
	if (!sourceExists) {
		return Promise.reject(new Error(`sourceFile "${sourceFile}" does not exist`))
	}

	let sourceCode = await fs.readFile(sourceFile)
	let targetCode = await transform(sourceCode, options)
	let targetModuleCode = await transform(sourceCode, {
		...options,
		modules: false
	})

	await fs.writeFile(targetFile, targetCode, "utf-8")
	await fs.writeFile(
		changeExtension(targetFile, ".mjs"),
		targetModuleCode,
		"utf-8"
	)
}

let javascriptExtensions = [".js"]

async function buildDirectory (
	sourceDirectory,
	targetDirectory,
	options = {}
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

		let nextOptions = {
			...options,
			filename: path.join(options.filename, dirent.name)
		}

		if (dirent.isDirectory()) {
			await buildDirectory(direntPath, nextTarget, nextOptions)
		}

		if (dirent.isSymbolicLink()) {
			// skip?
		}

		if (dirent.isFile()) {
			let extension = path.extname(dirent.name)
			if (javascriptExtensions.includes(extension)) {
				await buildFile(direntPath, nextTarget, nextOptions)
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
 * @returns {Promise<void>} to resolve when done
 */
export async function compile(componentDirectory) {
	let componentResolve = path.resolve.bind(null, componentDirectory)

	let mainJsFile = componentResolve("main.js")
	let sourceDirectory = componentResolve("src")
	let testDirectory = componentResolve("test")
	let sourceTestDirectory = componentResolve("test.src")
	let browserJsFile = componentResolve("browser.js")
	let distDirectory = componentResolve("dist")
	let {aliases} = await fs.readJson(componentResolve("package.json"))

	let sourceDirectoryExists = await fs.pathExists(sourceDirectory)
	if (sourceDirectoryExists) {
		let distDirectoryExists = await fs.pathExists(distDirectory)

		if (distDirectoryExists) {
			await fs.remove(distDirectory)
		}

		await buildDirectory(sourceDirectory, distDirectory, {
			aliases,
			filename: path.join(".", "src")
		})
	}

	let mainJsFileExists = await fs.pathExists(mainJsFile)
	if (mainJsFileExists) {
		await buildFile(mainJsFile, browserJsFile, {
			aliases,
			filename: path.join(".", "main.js")
		})
	}

	let testDirectoryExists = await fs.pathExists(testDirectory)
	if (testDirectoryExists) {
		let sourceTestDirectoryExists = await fs.pathExists(sourceTestDirectory)

		if (!sourceTestDirectoryExists) {
			await fs.move(testDirectory, sourceTestDirectory)
		}

		if (testDirectoryExists) {
			await fs.remove(testDirectory)
		}

		await buildDirectory(sourceTestDirectory, testDirectory, {
			aliases,
			filename: path.join(".", "test.src")
		})
	}
}

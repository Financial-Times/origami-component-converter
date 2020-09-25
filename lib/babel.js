import fs from "fs-extra"
import * as babel from "@babel/core"
import * as path from "path"
import babelPluginImportRewrite from "./babel-plugin-import-rewrite.js"
import babelPluginAddModuleExports from "babel-plugin-add-module-exports"
import babelPresetEnv from "@babel/preset-env"

/**
 * A (partial) babel configuration
 *
 * @typedef {Object} BabelConfiguration
 * @property {string} [filename] the filename currently being operated upon
 * @property {[function, any][]} [presets] a list of presets
 * @property {function[]} [plugins] a list of plugins
 * @property {string} [exclude] paths to exclude
 * @property {BabelConfiguration[]} [overrides] configuration overrides
 * @property {import('./babel-plugin-import-rewrite').Aliases} [aliases] the rewrites that need to be performed by the import-rewrite plugin
 */

/**
 * Options for the createConfiguration function
 *
 * @typedef {Object} ConfigurationOptions
 * @property {"amd" | "umd" | "systemjs" | "commonjs" | "cjs" | "auto" | false} [modules] the output format to use for modules
 * @property {string} [filename] the filename currently being operated upon
 * @property {import('./babel-plugin-import-rewrite').Aliases} [aliases] the rewrites that need to be performed by the import-rewrite plugin
 */

/**
 * Create a babel config that will rewrite imports to point at the right modules,
 *
 * @param {ConfigurationOptions=} options options to consider
 * @returns {BabelConfiguration} babel configuration
 */
export function createConfiguration({
	aliases,
	modules = false,
	filename = "",
} = {}) {
	const compileToEsm = modules === false
	const plugins = []
	if (!compileToEsm) {
		plugins.push(babelPluginAddModuleExports)
		plugins.push(babelPluginImportRewrite({aliases}))
	} else {
		plugins.push(babelPluginImportRewrite({aliases, replacer: esmReplacer}))
	}
	return {
		filename,
		presets: [],
		plugins,
		overrides: [
			{
				presets: [
					[
						babelPresetEnv,
						{
							useBuiltIns: false,
							targets: {
								esmodules: true,
							},
							modules,
						},
					],
				],
				plugins: [],
				exclude: "./test.src/**",
			},
		],
	}
}

/**
 * Run babel transform, return a promise that would resolve with the code
 * @param {string} code the source code
 * @param {ConfigurationOptions} options options to pass to createConfiguration
 * @returns {Promise.<string>} the compiled code
 */
export let transform = (code, options = {}) =>
	new Promise((resolve, reject) => {
		babel.transform(code, createConfiguration(options), (error, result) => {
			if (error) {
				reject(error)
			} else {
				resolve(result.code)
			}
		})
	})

/**
 * Perform default replacements for occ rewrite.
 * Given a filename, replace `"main.js"` with `"module.js"` or
 * `src` with `dist-esm`
 * @param {string} name import string to perform replacement on
 * @returns {string} the fixed name
 */
let esmReplacer = name => {
	let mainRegex = /^((?:\.\.\/)+)main(\.js)?$/
	let mainMatch = name.match(mainRegex)
	if (mainMatch) {
		return name.replace(mainRegex, "$1module$2")
	}

	let srcRegex = /(.*)\/src\/(.*)/
	let srcMatch = name.match(srcRegex)
	if (srcMatch) {
		return name.replace(srcRegex, "$1/dist-esm/$2")
	}

	return name
}

/**
 * Build a given filepath to a target path with our babel config
 * @param {string} sourceFile the path to the source code
 * @param {string} targetFile the path to output on
 * @param {ConfigurationOptions} options Options to pass to createConfiguration
 * @returns {Promise.<void>} resolves when done, rejects if couldn't
 */
async function buildFile(sourceFile, targetFile, options = {}) {
	let sourceExists = await fs.pathExists(sourceFile)
	if (!sourceExists) {
		return Promise.reject(
			new Error(`sourceFile "${sourceFile}" does not exist`)
		)
	}

	let sourceCode = await fs.readFile(sourceFile, "utf-8")
	let targetCode = await transform(sourceCode, options)

	await fs.writeFile(targetFile, targetCode, "utf-8")
}

let JAVASCRIPT_FILE_EXTENSIONS = [".js"]

/**
 * Build a given directory to a target directory with our babel config,
 * building javascript files and copying the rest.
 *
 * @param {string} sourceDirectory the path to the source code
 * @param {string} targetDirectory the path to output on
 * @param {ConfigurationOptions} options Options to pass to createConfiguration
 * @returns {Promise.<void>} resolves when done, rejects with reason if couldn't
 */
async function buildDirectory(sourceDirectory, targetDirectory, options = {}) {
	let sourceDirectoryExists = await fs.pathExists(sourceDirectory)
	if (!sourceDirectoryExists) {
		return Promise.reject(
			new Error(`sourceDirectory "${sourceDirectory}" does not exist`)
		)
	}

	let targetDirectoryExists = await fs.pathExists(targetDirectory)
	if (!targetDirectoryExists) {
		await fs.mkdir(targetDirectory)
	}

	let listing = await fs.readdir(sourceDirectory, {
		withFileTypes: true,
		encoding: "utf-8",
	})

	// https://nodejs.org/api/fs.html#fs_class_fs_dirent
	for (let dirent of listing) {
		let direntPath = path.resolve(sourceDirectory, dirent.name)

		let nextTarget = path.resolve(targetDirectory, dirent.name)

		let nextOptions = {
			...options,
			filename: path.join(options.filename, dirent.name),
		}

		if (dirent.isDirectory()) {
			await buildDirectory(direntPath, nextTarget, nextOptions)
		}

		if (dirent.isSymbolicLink()) {
			return Promise.reject(
				new Error(
					`source directory "${sourceDirectory}" is a symbolic link, which is not supported`
				)
			)
		}

		if (dirent.isFile()) {
			let extension = path.extname(dirent.name)
			if (JAVASCRIPT_FILE_EXTENSIONS.includes(extension)) {
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
	let browserJsEsmFile = componentResolve("module.js")
	let distDirectory = componentResolve("dist")
	let distEsmDirectory = componentResolve("dist-esm")
	let {aliases} = await fs.readJson(componentResolve("package.json"))

	let sourceDirectoryExists = await fs.pathExists(sourceDirectory)
	if (sourceDirectoryExists) {
		let distDirectoryExists = await fs.pathExists(distDirectory)

		if (distDirectoryExists) {
			await fs.remove(distDirectory)
		}

		await buildDirectory(sourceDirectory, distDirectory, {
			aliases,
			filename: path.join(".", "src"),
			modules: "commonjs",
		})

		let distEsmDirectoryExists = await fs.pathExists(distEsmDirectory)

		if (distEsmDirectoryExists) {
			await fs.remove(distEsmDirectory)
		}

		await buildDirectory(sourceDirectory, distEsmDirectory, {
			aliases,
			filename: path.join(".", "src"),
		})
	}

	let mainJsFileExists = await fs.pathExists(mainJsFile)
	if (mainJsFileExists) {
		await buildFile(mainJsFile, browserJsFile, {
			aliases,
			filename: path.join(".", "main.js"),
			modules: "commonjs",
		})
		await buildFile(mainJsFile, browserJsEsmFile, {
			aliases,
			filename: path.join(".", "main.js"),
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
			filename: path.join(".", "test.src"),
		})
	}
}

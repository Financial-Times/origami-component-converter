#!/usr/bin/env node
import spawn from "../lib/spawn.js"
import * as components from "../lib/components.js"
import * as npm from "../lib/npm.js"
import * as babel from "../lib/babel.js"
import * as fs from "fs-extra"
import * as github from "../lib/github.js"
import {builderManifest} from "../lib/skeletons.js"
import origamiComponentNames from "../lib/component-names.js"
import write from "../lib/write-object.js"
import * as workingDirectory from "../lib/working-directory.js"
import chalk from "chalk"

/**
 * coerce components argument into an array if it was comma separated
 *
 * @param {string | string[]} components
 * @returns {string[]}
 */
let parseComponentsArgument = components =>
	Array.isArray(components) ? components : components.split(/,/)

export let command = "bootstrap"
export let describe = "download, convert and publish all origami components"

/**
 * @type {Object.<string, import('yargs').Options>}
 */
export let options = {
	cleanFirst: {
		global: false,
		describe: "delete old components/ directory",
		alias: "c",
		default: false,
		type: "boolean"
	},
	publish: {
		global: false,
		alias: "p",
		describe: "publish to npm registry",
		default: true,
		type: "boolean"
	},
	unpublish: {
		global: false,
		alias: "u",
		describe: "remove from npm registry",
		default: false,
		type: "boolean"
	},
	npmRegistry: {
		default: "http://localhost:4873",
		type: "string",
		describe: "the npm registry to use"
	},
	components: {
		global: false,
		describe: "the components to use",
		default: origamiComponentNames,
		coerce: parseComponentsArgument,
		type: undefined
	}
}

/**
 * The builder param for yargs to consume
 * @param {import('yargs')} yargs
 */
export let builder = yargs => yargs.options(options)

export let handler = async function ဪ(args) {
	args.components && components.setTargets(args.components)
	await write(workingDirectory.resolve("package.json"), builderManifest)

	let registryArgument = npm.createRegistryArgument(args.npmRegistry)

	await spawn(`npm install ${registryArgument}`)
	args.cleanFirst && (await fs.remove(components.resolve()))
	await args.components.reduce(
		/**
		 * @param {Promise} promise
		 * @param {string} name
		 */
		(promise, name) => promise.then(() => github.getLatestRelease(name)),
		Promise.resolve()
	)
	await components.sequence(npm.createAndWriteManifest)

	await components.sequence(component => babel.compile(component, args))
	await components.sequence(npm.cleanAndWriteManifest)
	args.test && (await components.batch("obt t", undefined, 1))
	args.unpublish &&
		(await components.batch(`npm unpublish --force ${registryArgument}`))
	args.publish && (await components.batch(`npm publish ${registryArgument}`))

	console.info(chalk.magenta("oh good"))
}

#!/usr/bin/env node
import spawn from "../lib/spawn.js"
import * as components from "../lib/components.js"
import * as npm from "../lib/npm.js"
import * as babel from "../lib/babel.js"
import * as fs from "fs-extra"
import * as github from "../lib/github.js"
import {builderManifest} from "../lib/skeletons.js"
import write from "../lib/write-object.js"
import * as workingDirectory from "../lib/working-directory.js"
import chalk from "chalk"

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
	}
}

export let builder = yargs => yargs.options(options)

export let handler = async function ဪ(args) {
	args.components && components.setTargets(args.components)
	await write(workingDirectory.resolve("package.json"), builderManifest)

	let registryArgument = npm.createRegistryArgument(args.npmRegistry)

	await spawn(`npm install ${registryArgument}`)
	args.cleanFirst && (await fs.remove(components.resolve()))
	await components.sequence(github.getLatestRelease)
	await components.sequence(npm.createAndWriteManifest)
	await components.sequence(babel.compile)
	await components.sequence(npm.cleanAndWriteManifest)

	args.unpublish &&
		(await components.sequence(`npm unpublish --force ${registryArgument}`))

		args.publish && (await components.sequence(`npm publish ${registryArgument}`))

	if (args.obt) {
		await components.sequence("npx obt i --ignore-bower")
		await components.sequence("npx obt b --ignore-bower")
		await components.sequence("npx obt t --ignore-bower")
	}

	console.info(chalk.yellow("hooray!!"))
}

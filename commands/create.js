#!/usr/bin/env node
import spawn from "../lib/spawn.js"
import * as components from "../lib/components.js"
import * as npm from "../lib/npm.js"
import * as babel from "../lib/babel.js"
import * as fs from "fs-extra"
import * as github from "../lib/github.js"
import * as workingDirectory from "../lib/working-directory.js"
import write from "../lib/write-object.js"
import {builderManifest} from "../lib/skeletons.js"
import {handler as initHandler} from "./init.js"

import chalk from "chalk"

export let command = "create"
export let desc =
	"fetch an origami component at branch and create an npm version"

export let builder = yargs =>
	yargs
		.option("component", {
			describe: "the component to operate on",
			type: "string",
			required: true
		})
		.option("branch", {
			default: "master",
			alias: "brank",
			describe: "the branch to fetch",
			type: "string",
			required: true
		})
		.option("semver", {
			describe: "the version number to use in the package.json",
			type: "string",
			required: true
		})
		.option("init", {
			describe: "initialise the build directory first",
			default: true,
			type: "boolean"
		})

export let handler = async function ဪ(argv) {
	let {
		init,
		component,
		brank,
		semver: version
	} = argv
	components.setTargets([component])

	if (init) {
		await initHandler(argv)
	}

	await fs.remove(components.resolve(component))

	await github.extractTarballFromUri(
		await github.getBranchTarballUri(component, brank),
		components.resolve(component)
	)

	await fs.outputFile(components.getVersionFilePath(component), version)

	await npm.createAndWriteManifest(component)
	await babel.compile(component)
	await npm.cleanAndWriteManifest(component)
	await npm.removeLockfile(component)

	console.info(chalk.magenta("oh good"))
}

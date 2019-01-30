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

export let command = "create <component> <branch> <semver>"
export let desc =
	"fetch an origami component at branch and create an npm version"

export let builder = yargs =>
	yargs
		.positional("component", {
			default: true,
			describe: "the component to operate on",
			type: "string"
		})
		.positional("branch", {
			default: true,
			alias: "brank",
			describe: "the branch to fetch",
			type: "string"
		})
		.positional("semver", {
			default: true,
			describe: "the version to create",
			type: "string"
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

	await write(workingDirectory.resolve("package.json"), builderManifest)

	await spawn("npm install")
	await fs.remove(components.resolve())

	await github.extractTarballFromUri(
		await github.getBranchTarballUri(component, brank),
		components.resolve(component)
	)

	await fs.outputFile(components.getVersionFilePath(component), version)

	await npm.createAndWriteManifest(component)
	await babel.compile(component)
	await npm.cleanAndWriteManifest(component)

	console.info(chalk.magenta("oh good"))
}

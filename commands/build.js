#!/usr/bin/env node
import * as npm from "../lib/npm.js"
import * as babel from "../lib/babel.js"
import * as fs from "fs-extra"
import path from "path"

export let command = ["$0 <semver>", "build <semver>"]
export let desc = "build a component in place"

// import for jsdoc
// eslint-disable-next-line no-unused-vars
import yargs from "yargs"
/**
 * @param {yargs.Argv} yargs the yargs instance passed by outer yargs
 * @returns {yargs.Argv} the yargs instance to be consumed by outer yargs
*/
export let builder = yargs =>
	yargs.option()
		.option("cwd", {
			alias: ["directory"],
			describe: "the directory to build",
			default: process.cwd(),
			coerce(directory) {
				return path.resolve(process.cwd(), directory)
			}
		})
		.positional("semver", {
			describe: "the version number to use in the package.json",
			type: "string",
			required: true
		})
/**
 * Take the bower.json from the directory, and generate a package.json (including aliases)
 * Then compile that javascript from `src` to `dist`, rewriting the aliases
 * Then remove the aliases from the manifest
 * @param {{directory: string, semver: string}} argv the arguments understood by yargs
 * @returns {undefined}
 */
export let handler = async function build(argv) {
	let {
		directory,
		semver: version
	} = argv

	let resolve = (...paths) => path.resolve(directory, ...paths)

	let bowerManifestPath = resolve("bower.json")
	if (!await fs.pathExists(bowerManifestPath)) {
		return Promise.reject(new Error("no bower.json"))
	}

	let bowerManifest = await fs.readJson(bowerManifestPath)

	bowerManifest.version = version

	let npmManifestPath = resolve("package.json")

	// We'll want to merge some fields from any existing manifests
	let previousManifestExists = await fs.pathExists(npmManifestPath)

	let npmManifest = npm.mergeManifests(
		previousManifestExists
			? await fs.readJson(npmManifestPath)
			: {},
		await npm.createManifest(bowerManifest)
	)

	await npm.writeManifest(
		npmManifest,
		npmManifestPath
	)

	await babel.compile(directory)

	await npm.writeManifest(
		npm.cleanManifest(npmManifest),
		npmManifestPath
	)

	await fs.remove(resolve("package-lock.json"))
}

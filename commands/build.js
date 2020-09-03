#!/usr/bin/env node
import * as npm from "../lib/npm.js"
import * as babel from "../lib/babel.js"
import * as ignore from "../lib/ignore.js"
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
	yargs
		.option("cwd", {
			alias: ["directory"],
			describe: "the directory to build",
			default: process.cwd(),
			coerce(directory) {
				return path.resolve(process.cwd(), directory)
			},
		})
		.option("name", {
			describe: "the name of the component",
		})
		.option("repository", {
			describe: "the repository url to use in the package.json",
			type: "string",
			required: false,
		})
		.positional("semver", {
			describe: "the version number to use in the package.json",
			type: "string",
			required: true,
		})
/**
 * Take the bower.json from the directory, and generate a package.json (including aliases)
 * Then compile that javascript from `src` to `dist`, rewriting the aliases
 * Then remove the aliases from the manifest
 * @returns {Promise.<void>} promise which resolves when the npm version has been built
 */
export let handler = async function build(argv) {
	let {name, directory, semver: version} = argv

	let resolve = (...paths) => path.resolve(directory, ...paths)

	let bowerManifestPath = resolve("bower.json")
	if (!(await fs.pathExists(bowerManifestPath))) {
		return Promise.reject(new Error("no bower.json"))
	}

	let bowerManifest = await fs.readJson(bowerManifestPath)

	if (name) {
		bowerManifest.name = name
	} else {
		console.error(
			"Warning: Building a component without passing a `--name` is deprecated!"
		)
		console.error("We'll use the name from the bower manifest this time.")
	}

	bowerManifest.version = version

	let npmManifestPath = resolve("package.json")

	// We'll want to merge some fields from any existing manifests
	let previousManifestExists = await fs.pathExists(npmManifestPath)

	let convertedNpmManifest
	const repository = argv.repository || process.env.CIRCLE_REPOSITORY_URL
	if (repository) {
		convertedNpmManifest = await npm.createManifest(
			bowerManifest,
			repository
		)
	} else {
		convertedNpmManifest = await npm.createManifest(bowerManifest)
	}
	let npmManifest = npm.mergeManifests(
		previousManifestExists ? await fs.readJson(npmManifestPath) : {},
		convertedNpmManifest
	)

	await npm.writeManifest(npmManifest, npmManifestPath)

	await babel.compile(directory)
	await ignore.create(directory, npmManifest)

	await npm.writeManifest(npm.cleanManifest(npmManifest), npmManifestPath)

	await fs.remove(resolve("package-lock.json"))
}

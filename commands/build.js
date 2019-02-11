#!/usr/bin/env node
import * as npm from "../lib/npm.js"
import * as babel from "../lib/babel.js"
import * as fs from "fs-extra"
import path from "path"
import writeObject from "../lib/write-object.js"

export let command = "build [directory]"
export let desc = "build a component in place"

export let builder = yargs =>
	yargs
		.positional("directory", {
			describe: "the directory to build",
			default: process.cwd(),
			coerce (directory) {
				return path.resolve(process.cwd(), directory)
			}
		})
		.option("semver", {
			describe: "the version number to use in the package.json",
			type: "string",
			required: true
		})

export let handler = async function build (argv) {
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

	let npmManifest = await npm.createManifest(bowerManifest)

	let npmManifestPath = resolve("package.json")

	await npm.writeManifest(
		npmManifestPath,
		npmManifest
	)

	await babel.compile(directory)

	await npm.writeManifest(
		npmManifestPath,
		npm.cleanManifest(npmManifest)
	)
}

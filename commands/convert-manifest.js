#!/usr/bin/env node
import * as npm from "../lib/npm.js"
import {EOL} from "os"
export let command = "convert-manifest"
export let desc =
	"read a bower manifest on stdin and write a npm manifest to stdout"

// import for jsdoc
// eslint-disable-next-line no-unused-vars
import yargs from "yargs"
/**
 * @param {yargs.Argv} yargs the yargs instance passed by outer yargs
 * @returns {yargs.Argv} the yargs instance to be consumed by outer yargs
 */
export let builder = yargs =>
	yargs
		.option("semver", {
			describe: "the version number to use in the package.json",
			type: "string",
			required: true,
		})
		.option("repository", {
			describe: "the repository url to use in the package.json",
			type: "string",
			required: false,
		})
		.option("include-aliases", {
			describe: "whether or not to include alias config in the package.json",
			type: "boolean",
			default: false,
		})

let {stdin, stdout} = process

/**
 * Take a bower.json on `STDIN` and print a package.json on `STDOUT`
 *
 * @param {{includeAliases: boolean, semver: string}} argv the argv created by yargs
 * @returns {Promise.<void>}
 */
export let handler = async function(argv) {
	let input = ""

	stdin.resume()
	stdin.setEncoding("utf-8")

	stdin.on("data", chunk => (input += chunk))

	stdin.on("end", async () => {
		let bowerManifest = JSON.parse(input)
		bowerManifest.version = argv.semver
		let npmManifest
		const repository = argv.repository || process.env.CIRCLE_REPOSITORY_URL
		if (repository) {
			npmManifest = await npm.createManifest(bowerManifest, repository)
		} else {
			npmManifest = await npm.createManifest(bowerManifest)
		}
		if (!argv.includeAliases) {
			delete npmManifest.aliases
		}
		stdout.write(JSON.stringify(npmManifest, null, "\t") + EOL)
	})
}

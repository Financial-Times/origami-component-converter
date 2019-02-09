#!/usr/bin/env node
import * as npm from "../lib/npm.js"
import {EOL} from "os"
export let command = "convert-manifest"
export let desc =
	"read a bower manifest on stdin and write a npm manifest to stdout"

export let builder = yargs =>
	yargs
		.option("semver", {
			describe: "the version number to use in the package.json",
			type: "string",
			required: true
		})
		.option("include-babel-config", {
			describe: "whether or not to include babel config in the package.json",
			type: "boolean",
			default: false
		})

let {
	stdin,
	stdout
} = process

export let handler = async function (argv) {
	let input = ""

	stdin.resume()
	stdin.setEncoding("utf-8")

	stdin.on("data", chunk => input += chunk)

	stdin.on("end", async () => {
		let bowerManifest= JSON.parse(input)
		bowerManifest.version = argv.semver
		let npmManifest = await npm.createManifest(bowerManifest)
		if (!argv.includeBabelConfig) {
			delete npmManifest.babel
		}
		if (!argv.includeAliasConfig) {
			delete npmManifest.aliases
		}
		stdout.write(JSON.stringify(npmManifest, null, "\t") + EOL)
	})
}

import * as github from "../lib/github.js"

export let describe = "fetch the latest tagged release number"

export let command = "get-latest-tag <component>"

export let builder = yargs =>
	yargs
		.positional("component", {
			default: false,
			describe: "component name"
		})

export async function handler ({component}) {
	console.info(await github.getLatestTag(component))
}

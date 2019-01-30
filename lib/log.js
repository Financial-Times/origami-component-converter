import yargs from "yargs"

export let quietModeEnabled = yargs.option(
	"quiet",
	{
		type: "boolean",
		aliases: ["q"]
	}
).argv.quiet

export default (message) => {
	if (!quietModeEnabled) {
		console.info(message)
	}

	return message
}

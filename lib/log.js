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
		// printing to stderr so logging doesn't interfere with piping and redirects
		console.error(message.toString())
	}

	return message
}

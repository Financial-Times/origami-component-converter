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
		process.stderr.write(`\u001b[1K\u001b[1000D${message.toString()}`)
	}

	return message
}

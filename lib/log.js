import yargs from "yargs"

export let loggingEnabled = yargs.option(
	"verbose",
	{
		type: "boolean",
		aliases: ["v", "log"]
	}
).argv.verbose

export default (message) => {
	if (loggingEnabled) {
		console.info(message)
	}

	return message
}

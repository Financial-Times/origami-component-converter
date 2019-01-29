import yargs from "yargs"

let shouldLog = yargs.option(
	"verbose",
	{
		type: "boolean",
		aliases: ["v", "log"]
	}
).argv.verbose

export default (message) => {
	if (shouldLog) {
		console.info(message)
	}

	return message
}

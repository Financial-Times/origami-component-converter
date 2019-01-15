//
import yargs from "yargs"

let userLogLevel = yargs.count("verbose").alias("v", "verbose").argv.v

export default (message, level = 1) => {
	if (userLogLevel >= level) {
		// eslint-disable-next-line no-console
		console.log(message)
	}

	return message
}
